import { SetComponent } from "./../../world"
import { AppContainer } from "./../../../app.container"
import { IDisposable, TmpVectors, TransformNode, Vector3 } from "@babylonjs/core"
import { Encounter, Environment, LocationPoint, Mission, Objective } from "../../../data/missions/missionData"
import { Vector3FromObj, lineSegmentSphereIntersection } from "../../../utils/math"
import {
  ActiveObjective,
  AutoPilotCommand,
  CreateEntity,
  Entity,
  EntityForId,
  EntityUUID,
  queries,
  world,
} from "../../world"
import { createCustomShip } from "../../factories"
import { rotateTowardsPoint } from "../../helpers"
import { ShipTemplate } from "../../../data/ships/shipTemplate"
import { PlayerAgent } from "../../../agents/playerAgent"
import * as Ships from "../../../data/ships"
import { LoadAsteroidField } from "./missionHazards"
import { powerPlantRecharge } from "../shipSystems/engineRechargeSystem"
import { shieldRecharge } from "../shipSystems/shieldRechargeSystem"
import { debugLog } from "../../../utils/debuglog"

/** TODOS:
 * [] when an entity is defeated, find it's active encounter and move it from active to defeated set
 * [] when all entities from all waves are defeated move the active encounter to the completed encounter list
 * [] keep track of defeated enemy ship composition, and if destroyed or defeated to add to possible salvage list
 * [] mission over/failed/completed state
 */

/** */
interface ActiveEncounter extends Encounter {
  nextWave: number
  activeEntities: Set<EntityUUID>
  deadEntities: Set<EntityUUID>
}
/** check if autopilot is possible once a second */
const AUTOPILOT_CHECK_LIMIT = 1000
export class MissionTracker implements IDisposable {
  mission: Mission
  navigationLocations: LocationPoint[] = []
  navigationEntities: Map<number, Entity> = new Map()
  entryPoint: LocationPoint = undefined
  exitPoint: LocationPoint = undefined
  /** the entity id and the encounter they belong to */
  enemiesEncounters: Map<EntityUUID, number> = new Map()
  encounters: ActiveEncounter[] = []
  completedEncounters: ActiveEncounter[] = []
  objectives: ActiveObjective[] = []
  visitedLocations = new Set<number>()
  visitedEnvironments = new Set<number>()
  /// autopilot check timer
  autopilotCheckDelay = 0

  unsubscribeOnDeath: () => void
  constructor() {
    this.unsubscribeOnDeath = queries.outOfCombat.onEntityAdded.subscribe(this.onDeath)
  }

  dispose(): void {
    this.unsubscribeOnDeath()
  }

  onDeath = (entity: Entity) => {
    const encounterId = this.enemiesEncounters.get(entity.id)
    if (encounterId) {
      this.enemiesEncounters.delete(entity.id)

      let encounter = this.encounters.find((encounter) => encounter.id == encounterId)
      if (encounter.activeEntities.has(entity.id)) {
        encounter.activeEntities.delete(entity.id)
        encounter.deadEntities.add(entity.id)
      }
    }
  }

  setMission(mission: Mission, playerShip?: ShipTemplate) {
    this.mission = mission

    this.entryPoint = this.mission.locations[0]
    this.entryPoint = this.mission.locations.at(-1)
    this.visitedLocations = new Set<number>()
    for (const location of this.mission.locations) {
      if (location.isNavPoint) {
        this.navigationLocations.push(location)
      }
      if (location.isEntryPoint) {
        this.entryPoint = location
      }
      if (location.isExitPoint) {
        this.exitPoint = location
      }
    }
    this.encounters = mission.encounters.map((encounter) => {
      let missionEncounter = {
        ...(structuredClone(encounter) as Encounter),
        nextWave: 0,
        activeEntities: new Set(),
        deadEntities: new Set(),
      } as ActiveEncounter
      return missionEncounter
    })
    this.objectives = mission.objectives.map((objective) => {
      let missionObjective = {
        ...(structuredClone(objective) as Objective),
        complete: false,
        currentStep: 0,
        completedSteps: [],
      } as ActiveObjective
      return missionObjective
    })
    debugLog("[MissionTracker] set encounters", this.encounters)
    debugLog("[MissionTracker] set objectives", this.objectives)

    // create the player to the entry point
    const appContainer = AppContainer.instance
    appContainer.player = new PlayerAgent(playerShip)

    const player = AppContainer.instance.player.playerEntity
    // player.position.x = this.entryPoint.position.x
    // player.position.y = this.entryPoint.position.y
    // player.position.z = this.entryPoint.position.z
    if (player.objectiveDetails) {
      world.removeComponent(player, "objectiveDetails")
    }
    world.addComponent(player, "objectiveDetails", this.objectives)
    world.addComponent(player, "salvageClaims", {
      weapons: [],
      guns: [],
      shipParts: [],
      hulls: [],
    })

    // create the initial nav points
    this.createNavPoints()
  }

  /**
   * @param dt time in ms since last update
   */
  update(dt: number) {
    if (this.mission == undefined) {
      return
    }
    if (AppContainer.instance.player.playerEntity == undefined) {
      return
    }
    const player = AppContainer.instance.player.playerEntity

    const playerPosition = Vector3FromObj(player.position)

    // are there new navigation points to create?
    this.createNavPoints()
    this.autopilotCheckDelay += dt
    if (this.autopilotCheckDelay >= AUTOPILOT_CHECK_LIMIT) {
      this.autopilotCheckDelay = 0
      if (this.canAutopilot(player, this.mission.environment)) {
        SetComponent(player, "canAutopilot", true)
      } else {
        SetComponent(player, "canAutopilot", false)
      }
    }
    // is the player trying to autopilot to somewhere?
    const { autoPilotCommand } = player
    if (autoPilotCommand != undefined && autoPilotCommand.autopilot) {
      // pause player input
      // calculate if autopilot line from here to destination intersects any hazards or events
      this.executeAutopilot(dt, player, autoPilotCommand, this.mission.encounters, this.mission.environment)
      return
    }

    // has the encounter been triggered yet?
    let group = 0
    for (const encounter of this.encounters) {
      // is the player near an encounter?
      group += 1
      const encounterPosition = Vector3FromObj(encounter.location.position, TmpVectors.Vector3[0])
      const distance = encounterPosition.subtract(playerPosition).length()
      if (distance < 10000) {
        const encounterWave = encounter.waves[encounter.nextWave]
        if (encounter.activeEntities.size == 0) {
          encounter.nextWave += 1
          if (encounter.nextWave > encounter.waves.length) {
            // encounter over, all waves complete
            this.completedEncounters.push(encounter)
            this.encounters.splice(group - 1, 1)
            debugLog("[MissionTracker] encounter completed", encounter)
          } else {
            debugLog("[MissionTracker] spawning encounter", encounter, "wave", encounterWave)
            // spawn the encounter
            let team = encounterWave.teamId == "Friendly" ? 1 : 3
            let leader: Entity = undefined
            let curPos = new Vector3(encounterPosition.x, encounterPosition.y, encounterPosition.z)
            let shipTemplate = Ships[encounterWave.shipClass]
            if (shipTemplate == undefined) {
              console.error(`Could not find ship of class ${encounterWave.shipClass} for encounter:`, encounterWave)
              continue
            }
            for (let i = 0; i < encounterWave.quantity; i += 1) {
              // TODO: they should be spawned in formation, right now they spawn ontop of each other
              const formationPlace = i
              let offset: Vector3
              if (formationPlace % 2 == 0) {
                offset = new Vector3(-50, 0, 0)
              } else {
                offset = new Vector3(50, 0, 0)
              }
              let ship = createCustomShip(
                shipTemplate,
                encounterPosition.x,
                encounterPosition.y,
                encounterPosition.z,
                team,
                group
              )
              if (leader != undefined) {
                curPos.addInPlace(offset)
              } else {
                leader = ship
              }
              ship.position.x = curPos.x
              ship.position.y = curPos.y
              ship.position.z = curPos.z
              world.addComponent(ship, "missionDetails", structuredClone(encounterWave.missionDetails))
              debugLog("[MissionTracker] spawned ship", ship)
              this.enemiesEncounters.set(ship.id, encounter.id)
              encounter.activeEntities.add(ship.id)
              break
            }
          }
        }
      }
    }

    for (const location of this.mission.locations) {
      if (this.visitedLocations.has(location.id)) {
        continue
      }
      const distance = Vector3FromObj(location.position, TmpVectors.Vector3[0]).subtract(playerPosition).length()
      if (distance < 1000) {
        this.visitedLocations.add(location.id)
      }
    }

    for (const objective of this.objectives) {
      if (objective.complete) {
        continue
      }
      const step = objective.steps[objective.currentStep]
      switch (step.type) {
        case "Patrol": {
          let nav = step.location
          if (this.visitedLocations.has(nav.id)) {
            objective.currentStep += 1
            objective.completedSteps.push(step.id)
          }
          if (objective.currentStep >= objective.steps.length) {
            objective.complete = true
          }
          break
        }
        case "Destroy": {
          let complete = true
          for (const encounter of step.encounters) {
            complete = complete && this.completedEncounters.some((e) => e.id == encounter)
            if (!complete) {
              break
            }
          }
          if (complete) {
            objective.complete = true
          }
          break
        }
      }
    }

    for (const environment of this.mission.environment) {
      const position = Vector3FromObj(environment.location.position, TmpVectors.Vector3[0])
      const id = position.getHashCode()
      if (this.visitedEnvironments.has(id)) {
        continue
      }
      const distance = playerPosition.subtractToRef(position, TmpVectors.Vector3[1]).length()
      if (distance > 10000) {
        // visible radius + hazard radius
        continue
      }
      // create hazard
      this.visitedEnvironments.add(id)
      for (const hazard of environment.hazards) {
        if (hazard == "Asteroids") {
          LoadAsteroidField(position)
        }
      }
    }
  }

  createNavPoints = () => {
    // are there navigation points to create?
    if (this.navigationLocations != undefined && this.navigationLocations.length > 0) {
      // create the navigation points
      for (const navPoint of this.navigationLocations) {
        const navNode = new TransformNode(navPoint.name)
        navNode.position.set(navPoint.position.x, navPoint.position.y, navPoint.position.z)
        const navEntity = CreateEntity({
          position: { x: navPoint.position.x, y: navPoint.position.y, z: navPoint.position.z },
          targetName: navPoint.name,
          isTargetable: "nav",
          node: navNode,
        })
        this.navigationEntities.set(navPoint.id, navEntity)
      }
      this.navigationLocations = []
    }
  }

  clearAutopilot(player: Entity) {
    world.removeComponent(player, "pauseMovement")
    world.removeComponent(player, "autoPilotCommand")
    world.removeComponent(player, "camera")
  }
  exitAutopilot(
    player: Entity,
    exitPoint: Vector3,
    wingmen: {
      id: EntityUUID
      offset: {
        x: number
        y: number
        z: number
      }
    }[]
  ) {
    player.position.x = exitPoint.x
    player.position.y = exitPoint.y
    player.position.z = exitPoint.z
    for (let i = 0; i < wingmen.length; i += 1) {
      const wingman = EntityForId(wingmen[i].id)
      wingman.position.x = exitPoint.x + wingmen[i].offset.x
      wingman.position.y = exitPoint.y + wingmen[i].offset.y
      wingman.position.z = exitPoint.z + wingmen[i].offset.z
    }
    // remove lock
    if (player.targeting) {
      player.targeting.locked = false
    }
  }
  // Function to execute the autopilot command
  // TODO: calculate time to travel and update shield/energy/and other ship movements
  executeAutopilot(
    dt: number,
    player: Entity,
    destination: AutoPilotCommand,
    encounters: Encounter[],
    environment: Environment[]
  ): void {
    // const autopilotEndPosition = Vector3FromObj(destination.location)
    const { targeting } = player
    if (targeting == undefined) {
      return
    }
    const targetEntity = EntityForId(targeting.destination)
    if (targetEntity == undefined || targetEntity.isTargetable != "nav") {
      return
    }
    const autopilotCommand = player.autoPilotCommand
    const autopilotEndPosition = Vector3FromObj(targetEntity.position)
    const autopilotStartPosition = Vector3FromObj(player.position)
    const distanceToEnd = autopilotEndPosition.subtract(autopilotStartPosition).length()

    if (autopilotCommand.running == undefined) {
      world.addComponent(player, "pauseMovement", true)
      // move camera to swing view
      // run swing animation
      if (distanceToEnd < 5000) {
        // Too Close
        this.clearAutopilot(player)
        return
      }

      // Check if we are inside a hazzard
      let currentHazzard: Environment
      for (const hazard of environment || []) {
        const hazardPosition = new Vector3(hazard.location.position.x, 0, hazard.location.position.y)
        const distance = autopilotStartPosition.subtract(hazardPosition).length()
        if (distance < 5000) {
          debugLog("[Autopilot] inside hazzard", hazard)
          currentHazzard = hazard
        }
      }
      if (currentHazzard) {
        debugLog("[Autopilot] can't start autopilot in a hazzard")
        this.clearAutopilot(player)
        return
      }

      debugLog(`[Autopilot] begining autopilot checks to {${targetEntity.targetName}}`, autopilotEndPosition)
      // Look for wingmen nearby or nearby enemies
      // Wingmen must have escort mission or wingman mission
      const NEAR_BY_FRIENDLY = 5000
      const NEAR_BY_ENEMY = 15000
      const wingmen: Entity[] = []
      const wingmenDelta: Vector3[] = []
      const enemies: Entity[] = []
      for (const target of queries.targets.entities) {
        if (target.isTargetable == "nav") {
          continue
        }
        if (target == player) {
          continue
        }
        const targetDelta = Vector3FromObj(target.position, TmpVectors.Vector3[5])
        targetDelta.subtractInPlace(autopilotStartPosition)
        const targetDistance = targetDelta.length()

        if (target.teamId != player.teamId) {
          // TODO: eventually we need a mapping of what teams are alinged with other teams
          // right now only the plays team is friendly with the player and all other teams are hostile to each other
          if (targetDistance > NEAR_BY_ENEMY) {
            continue
          }
          enemies.push(target)
        } else {
          if (targetDistance > NEAR_BY_FRIENDLY) {
            continue
          }
          // filter out friendlies who aren't wingmen
          if (
            (target.missionDetails && target.missionDetails.mission == "Wingman") ||
            target.missionDetails.mission == "Escorted"
          ) {
            wingmenDelta.push(targetDelta)
            wingmen.push(target)
          }
        }
      }
      if (enemies.length > 0) {
        // TODO: notify user they can't autopilot
        debugLog("[Autopilot] cannot start, enemies nearby", enemies)
        this.clearAutopilot(player)
        return
      }
      // compute time to destination
      const { engine, systems } = player
      // TODO this calculation should be in one place
      const maxDamagedCruiseSpeed =
        engine.cruiseSpeed * Math.max(0.2, (systems?.state?.engines ?? 1) / (systems?.base?.engines ?? 1))
      const msToDestination = distanceToEnd / maxDamagedCruiseSpeed / 1000
      powerPlantRecharge(msToDestination, player)
      shieldRecharge(msToDestination, player)
      // animation
      for (const wingman of wingmen) {
        powerPlantRecharge(msToDestination, wingman)
        shieldRecharge(msToDestination, wingman)
      }
      rotateTowardsPoint(player, autopilotEndPosition)
      SetComponent(player, "camera", "dramatic")
      player.visible = true
      // TODO: turn off the particles
      autopilotCommand.running = true
      autopilotCommand.runTime = 0
      autopilotCommand.wingmen = []
      for (let i = 0; i < wingmen.length; i += 1) {
        autopilotCommand.wingmen.push({
          id: wingmen[i].id,
          offset: {
            x: wingmenDelta[i].x,
            y: wingmenDelta[i].y,
            z: wingmenDelta[i].z,
          },
        })
      }
    }

    autopilotCommand.runTime += dt

    // after the flyby we want a callback to check for encounters
    // this is dirty for now
    if (autopilotCommand.runTime < 3000) {
      return
    }
    let currentEncounter: Encounter
    for (const encounter of encounters) {
      const encounterPosition = new Vector3(encounter.location.position.x, 0, encounter.location.position.y)
      const distance = autopilotStartPosition.subtract(encounterPosition).length()
      if (distance < 5000) {
        currentEncounter = encounter
      }
    }
    player.visible = false
    // Check for collisions with encounters
    for (const encounter of encounters) {
      const encounterPosition = new Vector3(encounter.location.position.x, 0, encounter.location.position.y)
      const collisionPoint = lineSegmentSphereIntersection(
        autopilotStartPosition,
        autopilotEndPosition,
        encounterPosition,
        10000
      )
      if (collisionPoint && encounter != currentEncounter) {
        this.exitAutopilot(player, collisionPoint, autopilotCommand.wingmen)
        debugLog(
          `[Autopilot] interrupted by encounter at (${collisionPoint.x}, ${collisionPoint.y}, ${collisionPoint.z})`
        )
        this.clearAutopilot(player)
        return
      }
    }

    // Check for collisions with hazards
    for (const hazard of environment || []) {
      const hazardPosition = new Vector3(hazard.location.position.x, 0, hazard.location.position.y)
      const collisionPoint = lineSegmentSphereIntersection(
        autopilotStartPosition,
        autopilotEndPosition,
        hazardPosition,
        2000
      )
      if (collisionPoint) {
        this.exitAutopilot(player, collisionPoint, autopilotCommand.wingmen)
        debugLog(`[Autopilot] interrupted by hazard at (${collisionPoint.x}, ${collisionPoint.y}, ${collisionPoint.z})`)
        this.clearAutopilot(player)
        return
      }
    }

    // If no collisions, move to the autopilot end position
    // we shouldn't jump right on top of the destination, we should be 5k out
    const collisionPoint = lineSegmentSphereIntersection(
      autopilotStartPosition,
      autopilotEndPosition,
      autopilotEndPosition.clone(),
      5000
    )
    this.exitAutopilot(player, collisionPoint, autopilotCommand.wingmen)
    debugLog(`[Autopilot] completed to (${collisionPoint.x}, ${collisionPoint.y}, ${collisionPoint.z})`)
    this.clearAutopilot(player)
  }

  checkForEncounterCollisions = (startPosition: Vector3, endPosition: Vector3, encounters: Encounter[]) => {
    // Check for collisions with encounters
    for (const encounter of encounters) {
      const encounterPosition = new Vector3(encounter.location.position.x, 0, encounter.location.position.y)
      const collisionPoint = lineSegmentSphereIntersection(startPosition, endPosition, encounterPosition, 10000)
      if (collisionPoint) {
        return encounter
      }
    }
    return undefined
  }
  checkForHazzardCollisions = (startPosition: Vector3, endPosition: Vector3, environment: Environment[]) => {
    // Check for collisions with hazards
    for (const hazard of environment || []) {
      const hazardPosition = new Vector3(hazard.location.position.x, 0, hazard.location.position.y)
      const collisionPoint = lineSegmentSphereIntersection(startPosition, endPosition, hazardPosition, 2000)
      if (collisionPoint) {
        return hazard
      }
    }
    return undefined
  }
  canAutopilot(player: Entity, environment: Environment[]): boolean {
    const { targeting } = player
    if (targeting == undefined) {
      return false
    }
    const targetEntity = EntityForId(targeting.destination)
    if (targetEntity == undefined || targetEntity.isTargetable != "nav") {
      return false
    }
    const autopilotEndPosition = Vector3FromObj(targetEntity.position)
    const autopilotStartPosition = Vector3FromObj(player.position)
    const distanceToEnd = autopilotEndPosition.subtract(autopilotStartPosition).length()

    // move camera to swing view
    // run swing animation
    if (distanceToEnd < 5000) {
      // Too Close
      return false
    }

    // Check if we are inside a hazzard
    let currentHazzard: Environment
    for (const hazard of environment || []) {
      const hazardPosition = new Vector3(hazard.location.position.x, 0, hazard.location.position.y)
      const distance = autopilotStartPosition.subtract(hazardPosition).length()
      if (distance < 5000) {
        debugLog("[Autopilot] inside hazzard", hazard)
        currentHazzard = hazard
      }
    }
    if (currentHazzard) {
      debugLog("[Autopilot] can't start autopilot in a hazzard")
      return false
    }
    return true
  }
}
