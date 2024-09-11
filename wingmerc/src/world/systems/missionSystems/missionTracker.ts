import { AppContainer } from './../../../app.container';
import { IDisposable, TmpVectors, TransformNode, Vector2, Vector3 } from "@babylonjs/core";
import { Encounter, Environment, LocationPoint, Mission } from "../../../data/missions/missionData";
import { Vector3FromObj, lineSegmentSphereIntersection } from "../../../utils/math";
import { AutoPilotCommand, CreateEntity, Entity, EntityForId, EntityUUID, queries, world } from "../../world";
import { createCustomShip } from "../../factories";
import { rotateTowardsPoint } from "../../helpers";
import { ShipTemplate } from "../../../data/ships/shipTemplate";
import { PlayerAgent } from '../../../agents/playerAgent';
import * as Ships from "../../../data/ships";

export class MissionTracker implements IDisposable  {
  mission: Mission
  navigationLocations: LocationPoint[] = []
  navigationEntities: Map<number, Entity> = new Map()
  entryPoint: LocationPoint = undefined
  exitPoint: LocationPoint = undefined
  /** the entity id and the encounter they belong to */
  enemiesEncounters: Map<EntityUUID, number> = new Map()
  encounters: Encounter[] = []
  remainingEncounters: Encounter[] = []
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
      // are there no more encounter ships left?
      let remainingShips = false
      for (const enemyEncounter of this.enemiesEncounters.entries()) {
        const [remainingEnemyId, remainingEncounterId] = enemyEncounter
        if (encounterId == remainingEncounterId) {
          remainingShips = true
          break
        }
      }
      if (remainingShips) {
        return
      }
      // encounter complete
      // find any objectives for this encounter
      const player = AppContainer.instance.player.playerEntity
      let objectiveDetails = player.objectiveDetails
      objectiveDetails.objectivesComplete
      for (const objective of this.mission.objectives) {
        if (objective.encounters?.some((objectiveEncounterId) => objectiveEncounterId == encounterId)) {
          // this completed encounter belongs to this objective
          objectiveDetails.objectivesComplete = [
            ...objectiveDetails.objectivesComplete,
            objective
          ]
        }
        for (const subObjective of objective.steps) {
          const match = subObjective.encounters?.some((subObjectiveEncounterId) => subObjectiveEncounterId == encounterId)
          if (match) {
            // this completed encounter belongs to this subObjective
            if (!objectiveDetails.objectivesComplete) {
              objectiveDetails.objectivesComplete = [];
            }
            objectiveDetails.objectivesComplete.push(objective);
          }
        }
      }
    }
  }

  setMission(mission: Mission, playerShip?: ShipTemplate) {
    this.mission = mission
    
    this.entryPoint = this.mission.locations[0]
    this.entryPoint = this.mission.locations.at(-1)
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
      let missionEncounter = structuredClone(encounter) as Encounter
      return missionEncounter
    })

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
    world.addComponent(player, "objectiveDetails", {
      visitedLocations: []
    })

    // create the initial nav points
    this.createNavPoints()
  }

  /**
   * @param dt time in ms since last update
   */
  update(dt: number) {
    if (this.mission == undefined) { return }
    if (AppContainer.instance.player.playerEntity == undefined) { return }
    const player = AppContainer.instance.player.playerEntity
    const playerPosition = Vector3FromObj(player.position)

    // are there new navigation points to create?
    this.createNavPoints()

    // is the player near a navigation object
    for (const [index, location] of this.mission.navigationOrder.entries()) {
      const navNode = Vector3FromObj(location.position);
      if (playerPosition.subtract(navNode).length() < 500) {
        if (!player.objectiveDetails.visitedLocations.some(visited => visited.id == location.id)) {
          player.objectiveDetails.visitedLocations.push(location);
    
          // Determine the next destination
          const nextIndex = (index + 1) % this.mission.navigationOrder.length;
          player.targeting.destination = this.navigationEntities.get(this.mission.navigationOrder[nextIndex].id).id;
        }
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
        // spawn the encounter
        let team = encounter.teamId == "Friendly" ? 1 : 3
        let leader: Entity = undefined
        let curPos = new Vector3(encounterPosition.x, encounterPosition.y, encounterPosition.z)
        let shipTemplate = Ships[encounter.shipClass]
        if (shipTemplate == undefined) {
          console.error(`Could not find ship of class ${encounter.shipClass} for encounter:`,encounter)
          continue
        }
        for (let i = 0; i < encounter.quantity; i += 1) {
          // TODO: they should be spawned in formation, right now they spawn ontop of each other
          const formationPlace = i
          let offset: Vector3
          if (formationPlace % 2 == 0) {
            offset = new Vector3(-50, 0, 0)
          } else {
            offset = new Vector3(50, 0, 0)
          }
          let ship = createCustomShip(shipTemplate, encounterPosition.x, encounterPosition.y, encounterPosition.z, team, group)
          if (leader != undefined) {
            curPos.addInPlace(offset)
          } else {
            leader = ship
          }
          ship.position.x = curPos.x
          ship.position.y = curPos.y
          ship.position.z = curPos.z
          world.addComponent(ship, "missionDetails", structuredClone(encounter.missionDetails))
          console.log("[mission tracker] mission details", encounter.missionDetails, ship.missionDetails)
          this.enemiesEncounters.set(ship.id, encounter.id)
          break
        }
      } else {
        this.remainingEncounters.push(encounter)
      }
    }
    this.encounters = this.remainingEncounters
    this.remainingEncounters = []
      
    // is the player near an environment?
      // has the environment been triggered yet?
        // create environment
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
          node: navNode
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
  exitAutopilot(player: Entity, exitPoint: Vector3, wingmen: {
    id: EntityUUID;
    offset: {
        x: number;
        y: number;
        z: number;
    };
  }[]) {
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
  executeAutopilot(dt: number, player: Entity, destination: AutoPilotCommand, encounters: Encounter[], environment: Environment[]): void {
    // const autopilotEndPosition = Vector3FromObj(destination.location)
    const { targeting } = player
    if (targeting == undefined) { return }
    const targetEntity = EntityForId(targeting.destination)
    if (targetEntity == undefined || targetEntity.isTargetable != "nav") { return }
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
          console.log("[Autopilot] inside hazzard", hazard)
          currentHazzard = hazard
        }
      }
      if (currentHazzard) {
        console.log("[Autopilot] can't start autopilot in a hazzard")
        this.clearAutopilot(player)
        return
      }

      console.log(`[Autopilot] begining autopilot checks to {${targetEntity.targetName}}`, autopilotEndPosition)
      // Look for wingmen nearby or nearby enemies
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
          wingmenDelta.push(targetDelta)
          wingmen.push(target)
        }
      }
      if (enemies.length > 0) {
        // TODO: notify user they can't autopilot
        console.log("[Autopilot] cannot start, enemies nearby", enemies)
        this.clearAutopilot(player)
        return
      }
      rotateTowardsPoint(player, autopilotEndPosition)
      if (player.camera) {
        player.camera = "dramatic"
      } else {
        world.addComponent(player, "camera", "dramatic")
      }
      player.visible = true
      // turn off the particlesf
      autopilotCommand.running = true
      autopilotCommand.runTime = 0
      autopilotCommand.wingmen = []
      for (let i = 0; i < wingmen.length; i += 1) {
        autopilotCommand.wingmen.push({
          id: wingmen[i].id,
          offset: {
            x: wingmenDelta[i].x,
            y: wingmenDelta[i].y,
            z: wingmenDelta[i].z
          }
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
      const collisionPoint = lineSegmentSphereIntersection(autopilotStartPosition, autopilotEndPosition, encounterPosition, 10000);
      if (collisionPoint && encounter != currentEncounter) {
        this.exitAutopilot(player, collisionPoint, autopilotCommand.wingmen)
        console.log(`[Autopilot] interrupted by encounter at (${collisionPoint.x}, ${collisionPoint.y}, ${collisionPoint.z})`);
        this.clearAutopilot(player)
        return;
      }
    }

    // Check for collisions with hazards
    for (const hazard of environment || []) {
      const hazardPosition = new Vector3(hazard.location.position.x, 0, hazard.location.position.y)
      const collisionPoint = lineSegmentSphereIntersection(autopilotStartPosition, autopilotEndPosition, hazardPosition, 2000);
      if (collisionPoint) {
        this.exitAutopilot(player, collisionPoint, autopilotCommand.wingmen)
        console.log(`[Autopilot] interrupted by hazard at (${collisionPoint.x}, ${collisionPoint.y}, ${collisionPoint.z})`);
        this.clearAutopilot(player)
        return;
      }
    }

    // If no collisions, move to the autopilot end position
    // we shouldn't jump right on top of the destination, we should be 5k out
    const collisionPoint = lineSegmentSphereIntersection(autopilotStartPosition, autopilotEndPosition, autopilotEndPosition.clone(), 5000);
    this.exitAutopilot(player, collisionPoint, autopilotCommand.wingmen)
    console.log(`[Autopilot] completed to (${collisionPoint.x}, ${collisionPoint.y}, ${collisionPoint.z})`);
    this.clearAutopilot(player)
  }

  checkForEncounterCollisions = (startPosition: Vector3, endPosition: Vector3, encounters: Encounter[]) => {
    // Check for collisions with encounters
    for (const encounter of encounters) {
      const encounterPosition = new Vector3(encounter.location.position.x, 0, encounter.location.position.y)
      const collisionPoint = lineSegmentSphereIntersection(startPosition, endPosition, encounterPosition, 10000);
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
      const collisionPoint = lineSegmentSphereIntersection(startPosition, endPosition, hazardPosition, 2000);
      if (collisionPoint) {
        return hazard
      }
    }
    return undefined
  }
}