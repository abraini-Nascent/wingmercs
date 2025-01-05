import { Weapons } from "./../../../data/weapons/index"
import { EntityForId, SetComponent } from "./../../world"
import {
  BreakLeftData,
  BreakRightData,
  HeadingManeuverData,
  FishHookData,
  FlipData,
  LoopData,
  SmallWaggleData,
  VeerOffDownLeftData,
  VeerOffDownRightData,
  VeerOffUpLeftData,
  VeerOffUpRightData,
} from "../../../data/maneuvers/headingManeuvers"
import {
  AngleBetweenVectors,
  QuaternionFromObj,
  ToDegree,
  ToRadians,
  Vector3FromObj,
  isPointBehind,
} from "../../../utils/math"
import { MovementCommand, AIBlackboard, Entity, world, queries, FireCommand } from "../../world"
import { ManeuverType, ObjectiveType, StateOfConfrontation, StateOfHealth } from "./engagementState"
import { SteeringBehaviours, SteeringHardTurnClamp, SteeringResult } from "./steeringBehaviours"
import { TmpVectors, Vector3 } from "@babylonjs/core"
import { RouletteSelectionStochastic, randFloat, random, randomItem } from "../../../utils/random"
import { VeerOffData } from "../../../data/maneuvers/headingManeuvers"
import { shipDetailsFrom, totalVelocityFrom } from "../../helpers"
import { SteeringHardNormalizeClamp, SteeringSoftNormalizeClamp } from "./basicSteering"
import { PilotAIs } from "../../../data/pilotAI/pilotAI"
import { ExecutionTree } from "../../../data/pilotAI/executionTree"
import { MissionType } from "../../../data/missions/missionData"
import { AppContainer } from "../../../app.container"
import { barks } from "../../../data/barks"
import { PlayVoiceSound, VoiceSound } from "../../../utils/speaking"
import { GunStats } from "../../../data/guns/gun"
import { debugLog } from "../../../utils/debuglog"

const DEBUG = false

const PlanarUp = Vector3.Up()
const BreakFormationPattern = [VeerOffUpRightData, VeerOffUpLeftData, VeerOffDownRightData, VeerOffDownLeftData]
type intelligenceBlackboard = {
  intelligence: {
    mission: MissionType
    /** objective is the goal of the mission */
    objective: ObjectiveType
    /** tactic changes per objective, each objective has it's own tactics to complete the objective */
    tactic: unknown
    /** the currently running maneuverType if maneuvering */
    maneuver: ManeuverType
  }
}
export function shipIntelligence(entity: Entity) {
  const blackboard: intelligenceBlackboard = entity.ai.blackboard as intelligenceBlackboard
  if (blackboard.intelligence == undefined) {
    entity.ai.blackboard.intelligence = {}
  }
  if (entity.ai.blackboard.targeting == undefined) {
    entity.ai.blackboard.targeting = {}
  }
  const intelligence = blackboard.intelligence

  if (avoidObstaclesManeuver(entity, blackboard)) {
    debugLog("[Ship Intelegence] skipping mission ai, avoiding obstacle")
    return
  }
  switch (intelligence.mission) {
    case MissionType.Destroy:
      DestroyMission(entity, blackboard)
      break
    case MissionType.Patrol:
      PatrolMission(entity, blackboard)
      break
    case MissionType.Wingman:
      WingmanMission(entity, blackboard)
      break
    case MissionType.Escorted:
      EscortedMission(entity, blackboard)
    default:
      intelligence.mission = entity.missionDetails?.mission ?? MissionType.Wingman
      break
  }
}
export namespace shipIntelligence {
  export const taunt = (joker: Entity, enemy: Entity): boolean => {
    if (random() < 0.8) {
      let targeting = enemy.ai?.blackboard?.targeting
      if (targeting) {
        targeting.target = joker.id
      }
      VoiceSound(randomItem(barks.taunted).ipa, enemy.voice).then((sound) => PlayVoiceSound(sound, enemy))
    }
    return true
  }
  export const attackMyTarget = (ship: Entity, friendly: Entity) => {
    // Get the player's target and assign it to the wing member
    // Change mission to "Engage"
    const target = ship.targeting?.target
    if (target && friendly.ai?.blackboard?.targeting != undefined) {
      // friendly.targeting.target = target
      friendly.ai.blackboard.targeting.target = target
      const intelegence = (friendly.ai?.blackboard as intelligenceBlackboard)?.intelligence
      intelegence.mission = "Wingman"
      intelegence.objective = "Engage"
      VoiceSound(randomItem(barks.responses.attackMyTarget).ipa, friendly.voice).then((sound) =>
        PlayVoiceSound(sound, friendly)
      )
    } else {
      VoiceSound(randomItem(barks.responses.noCanDo).ipa, friendly.voice).then((sound) =>
        PlayVoiceSound(sound, friendly)
      )
    }
  }
  export const breakAndEngage = (ship: Entity, friendly: Entity) => {
    // Get the player's target and assign it to the wing member
    // Change mission to "Engage"
    const intelegence = (friendly.ai?.blackboard as intelligenceBlackboard)?.intelligence
    if (intelegence) {
      intelegence.mission = "Wingman"
      intelegence.objective = "BreakFormation"
      VoiceSound(randomItem(barks.responses.breakAndEngage).ipa, friendly.voice).then((sound) =>
        PlayVoiceSound(sound, friendly)
      )
    } else {
      VoiceSound(randomItem(barks.responses.noCanDo).ipa, friendly.voice).then((sound) =>
        PlayVoiceSound(sound, friendly)
      )
    }
  }
  export const followMyLead = (ship: Entity, friendly: Entity) => {
    // Get the player's target and assign it to the wing member
    // Change mission to "Engage"
    const intelegence = (friendly.ai?.blackboard as intelligenceBlackboard)?.intelligence
    if (intelegence) {
      intelegence.mission = "Wingman"
      intelegence.objective = "HoldFormation"
      intelegence.tactic = undefined
      friendly.groupId = ship.groupId
      friendly.ai.blackboard.holdFormation = undefined
      VoiceSound(randomItem(barks.responses.followMyLead).ipa, friendly.voice).then((sound) =>
        PlayVoiceSound(sound, friendly)
      )
    } else {
      VoiceSound(randomItem(barks.responses.noCanDo).ipa, friendly.voice).then((sound) =>
        PlayVoiceSound(sound, friendly)
      )
    }
  }
  export const joinMyWing = (ship: Entity, friendly: Entity) => {
    const intelegence = (friendly.ai?.blackboard as intelligenceBlackboard)?.intelligence
    if (intelegence) {
      intelegence.mission = "Wingman"
      intelegence.objective = "HoldFormation"
      intelegence.tactic = undefined
      friendly.groupId = ship.groupId
      friendly.ai.blackboard.holdFormation = undefined
      let wingLeader = ship.wingleader
      if (wingLeader == undefined) {
        wingLeader = {
          wingmen: [ship.id],
        }
        world.addComponent(ship, "wingleader", wingLeader)
      }
      if (friendly.wingleader) {
        world.removeComponent(friendly, "wingleader")
      }
      VoiceSound(randomItem(barks.responses.followMyLead).ipa, friendly.voice).then((sound) =>
        PlayVoiceSound(sound, friendly)
      )
    } else {
      VoiceSound(randomItem(barks.responses.noCanDo).ipa, friendly.voice).then((sound) =>
        PlayVoiceSound(sound, friendly)
      )
    }
  }
}
/****
 * WINGMAN MISSION
 * Follow your wing leader
 * engage the wingleaders target
 * become the wingleader if there is none for your group
 */
const WingmanMission = (entity: Entity, blackboard: AIBlackboard) => {
  const objective = blackboard.intelligence.objective
  switch (objective) {
    case "Engage": {
      Engage(entity, blackboard)
      break
    }
    case "HoldFormation": {
      // TODO: move into it's own method
      if (blackboard.holdFormation == undefined) {
        // find the leader
        let leader: Entity
        for (const ship of queries.ai) {
          if (ship.teamId != entity.teamId || ship.groupId != entity.groupId) {
            continue
          }

          if (ship.deathRattle) {
            // we don't follow the dead
            continue
          }
          if (ship.wingleader != undefined) {
            leader = ship
          }
        }
        if (leader == undefined) {
          // am i on the players wing?
          for (const player of queries.players) {
            if (player.teamId == entity.groupId && player.groupId == entity.groupId && player.wingleader != undefined) {
              leader = player
            }
          }
        }
        if (leader == undefined) {
          // promote self to wingleader
          world.addComponent(entity, "wingleader", {
            wingmen: [entity.id],
          })
          // takeover main mission
          blackboard.intelligence.objective = undefined
          blackboard.intelligence.mission = entity.missionDetails.mission
          debugLog(`[ShipIntelligence][Wingman] Ship ${entity.id} taking leadership role!`)
          return
        } else {
          for (let shipId of leader.wingleader.wingmen) {
            if (EntityForId(shipId) == undefined || EntityForId(shipId).deathRattle) {
              // remove dead wingman
              let index = leader.wingleader.wingmen.indexOf(shipId)
              leader.wingleader.wingmen.splice(index, 1)
            }
          }
          const followIndex = Math.max(0, leader.wingleader.wingmen.length - 2)
          const followEntity = EntityForId(leader.wingleader.wingmen[followIndex])
          // add ourselves and find our place in the formation
          leader.wingleader.wingmen.push(entity.id)
          const formationPlace = leader.wingleader.wingmen.length
          let offset: Vector3
          if (formationPlace % 2 == 0) {
            offset = new Vector3(-50, 0, 0)
          } else {
            offset = new Vector3(50, 0, 0)
          }
          // [l, fr, fl, ffr, ffl, fffr, fffl]
          DEBUG &&
            debugLog(
              `[ShipIntelligence][Wingman] Ship ${entity.id} forming up on ${followEntity.id}, team ${followEntity.teamId}, group ${followEntity.groupId}`
            )
          blackboard.holdFormation = {
            leader: followEntity.id,
            offset,
          }
        }
      }
      const leaderEntity = EntityForId(blackboard.holdFormation.leader)
      if (leaderEntity == undefined || leaderEntity.deathRattle) {
        // we don't follow the dead
        blackboard.holdFormation = undefined
        return
      }
      const input = SteeringBehaviours.offsetPursuit(
        blackboard.dt,
        entity,
        leaderEntity,
        blackboard.holdFormation.offset,
        SteeringHardTurnClamp
      )
      const movementCommand: MovementCommand = {
        pitch: input.pitch,
        yaw: input.yaw,
        roll: input.roll,
        afterburner: input.boost ? 1 : 0,
        brake: 0,
        drift: 0,
        deltaSpeed: input.boost ? 1 : input.throttle ?? 0,
      }
      SetComponent(entity, "movementCommand", movementCommand)
      // if leader is engaging we are engaging
      if (leaderEntity.ai?.blackboard.intelligence.objective == ObjectiveType.Engage) {
        blackboard.targeting.target = leaderEntity.ai.blackboard.targeting.target
        DEBUG &&
          debugLog(
            `[ShipIntelligence][Wingman] Ship ${entity.id} leader is engaged with ${blackboard.targeting.target}, backup coming!`
          )
        blackboard.intelligence.objective = ObjectiveType.BreakFormation
      }
      break
    }
    case "BreakFormation": {
      // we should veer off left or right based on our position in the wingman list
      if (blackboard.breakFormation == undefined) {
        let leaderEntity: Entity
        let checkBoard = blackboard
        while (checkBoard.holdFormation?.leader != undefined) {
          leaderEntity = EntityForId(checkBoard.holdFormation.leader)
          checkBoard = leaderEntity.ai?.blackboard
        }
        const ourPosition = leaderEntity.wingleader.wingmen.indexOf(entity.id)
        const remainder = (ourPosition - 1) % BreakFormationPattern.length
        const veeringData = BreakFormationPattern[remainder]
        DEBUG && debugLog(`[ShipIntelligence][Wingman] Ship ${entity.id} breaking formation!`)
        blackboard.breakFormation = {
          holdState: {
            finished: false,
            headingHoldLength: 0,
            headingIndex: 0,
          } as SteeringBehaviours.HeadingHoldState,
          headings: veeringData.headings,
          timings: veeringData.timings,
        }
      }
      const maneuverBlackboard = blackboard.breakFormation
      const input = SteeringBehaviours.headingHold(
        blackboard.dt,
        entity,
        maneuverBlackboard.headings,
        maneuverBlackboard.timings,
        maneuverBlackboard.holdState,
        SteeringHardTurnClamp
      )
      // DEBUG && debugLog(`[AI wingleader] steering:`, input)
      let movementCommand: MovementCommand = {
        pitch: input.pitch,
        yaw: input.yaw,
        roll: input.roll,
        afterburner: 0,
        drift: 0,
        brake: 0,
        deltaSpeed: 0,
      }
      SetComponent(entity, "movementCommand", movementCommand)
      if (blackboard.breakFormation.holdState.finished == true) {
        DEBUG && debugLog(`[ShipIntelligence][Wingman] Ship ${entity.id} break off complete!`)
        blackboard.breakFormation = undefined
        entity.ai.blackboard.intelligence.maneuver = undefined
        blackboard.intelligence.objective = ObjectiveType.Engage
      }
      break
    }
    default: {
      blackboard.intelligence.objective = "HoldFormation"
      break
    }
  }
}

/****
 * DESTROY MISSION
 * Approach and engage your designated target
 */
const DestroyMission = (entity: Entity, blackboard: intelligenceBlackboard) => {
  const objective = blackboard.intelligence.objective
  switch (objective) {
    case "Engage": {
      Engage(entity, blackboard)
      break
    }
    case "ApproachTarget": {
      if (entity.ai.blackboard.targeting?.target == undefined) {
        entity.ai.blackboard.targeting.target = entity.missionDetails.destroy
        DEBUG && debugLog("[ShipIntelligence][Destroy] engaging target!", entity.missionDetails.destroy)
      }
      if (
        EntityForId(entity.ai.blackboard.targeting.target) == undefined ||
        EntityForId(entity.ai.blackboard.targeting.target).deathRattle
      ) {
        DEBUG && debugLog("[ShipIntelligence][Destroy] target dead or missing, disengaging")
        blackboard.intelligence.objective = "Disengage"
        blackboard.intelligence.tactic = undefined
        blackboard.intelligence.maneuver = undefined
        return
      }
      const distancetoTarget = ApproachTarget(entity, blackboard)
      if (distancetoTarget <= 2500) {
        blackboard.intelligence.objective = "Engage"
        blackboard.intelligence.tactic = undefined
        blackboard.intelligence.maneuver = undefined
        return
      }
      break
    }
    case "Disengage": {
      AIManeuvers.Flee(entity, blackboard)
      break
    }
    default: {
      blackboard.intelligence.objective = "ApproachTarget"
      break
    }
  }
}

/****
 * ESCORTED MISSION
 * Navigate from nav point to nav point
 */
const EscortedMission = (entity: Entity, blackboard: intelligenceBlackboard) => {
  const objective = blackboard.intelligence.objective
  switch (objective) {
    case "Caravan": {
      Caravan(entity, blackboard)
      break
    }
    case "Park": {
      // just sit here
      break
    }
    default: {
      blackboard.intelligence.objective = "Caravan"
      break
    }
  }
}

/**
 * Move from nav point to nav point
 *
 * @param entity
 * @param blackboard
 */
const Caravan = (entity: Entity, blackboard: AIBlackboard) => {
  // set the bloackboard state
  if (blackboard.caravan == undefined) {
    const mission = entity.missionDetails
    const currentNavPosition = mission.missionLocations[0].position
    const currentNavIndex = 0
    blackboard.caravan = {
      currentNavPosition,
      currentNavIndex,
      greeted: false,
    }
    DEBUG &&
      debugLog(
        `[ShipIntelligence][Caravan] Ship ${entity.id} Approaching Nav ${mission.missionLocations[0].name}`,
        mission.missionLocations[0].position
      )
  }
  // check if near the next nav point
  const entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[0])
  const entityRotation = QuaternionFromObj(entity.rotationQuaternion, TmpVectors.Quaternion[0])
  const navPossition = Vector3FromObj(blackboard.caravan.currentNavPosition, TmpVectors.Vector3[1])
  const distance = entityPosition.subtractToRef(navPossition, TmpVectors.Vector3[2]).length()
  if (blackboard.caravan.greeted == false) {
    const player = AppContainer.instance.player.playerEntity
    const playerDistance = Vector3FromObj(player.position).subtract(entityPosition).length()
    if (playerDistance < 1500) {
      blackboard.caravan.greeted = true
      const greeting = randomItem(barks.escortedArival)
      VoiceSound(greeting.ipa, entity.voice).then((greetingSound) => {
        PlayVoiceSound(greetingSound, entity)
      })
      DEBUG && debugLog(`[ShipIntelligence][Caravan] greetings: ${greeting.english}`)
    }
  }
  if (distance < 150) {
    // increment next nav point by one
    const nextIndex = blackboard.caravan.currentNavIndex + 1
    // if final nav point
    if (nextIndex >= entity.missionDetails.missionLocations.length) {
      // TODO
      // assign next mission objective
      if (entity.setSpeed != undefined) {
        entity.setSpeed = 0
      } else {
        world.addComponent(entity, "setSpeed", 0)
      }
      DEBUG &&
        debugLog(
          `[ShipIntelligence][Caravan] Ship ${entity.id} Sitting at final Nav ${
            entity.missionDetails.missionLocations[blackboard.caravan.currentNavIndex].name
          }`
        )
      blackboard.caravan = undefined
      blackboard.intelligence.objective = "Park"
      return
    } else {
      const nextPosition = entity.missionDetails.missionLocations[nextIndex].position
      blackboard.caravan.currentNavPosition.x = nextPosition.x
      blackboard.caravan.currentNavPosition.y = nextPosition.y
      blackboard.caravan.currentNavPosition.z = nextPosition.z
      blackboard.caravan.currentNavIndex = nextIndex
      DEBUG &&
        debugLog(
          `[ShipIntelligence][Caravan] Ship ${entity.id} Heading to next Nav ${
            entity.missionDetails.missionLocations[blackboard.caravan.currentNavIndex].name
          }`,
          blackboard.caravan.currentNavPosition
        )
    }
  }
  // approach next nav point
  const nextNavPossition = Vector3FromObj(blackboard.caravan.currentNavPosition, TmpVectors.Vector3[1])
  const input = SteeringBehaviours.seek(
    blackboard.dt,
    entityPosition,
    entityRotation,
    nextNavPossition,
    PlanarUp,
    SteeringSoftNormalizeClamp
  )
  const movementCommand: MovementCommand = {
    pitch: input.pitch,
    yaw: input.yaw,
    roll: input.roll,
    afterburner: 0,
    brake: 0,
    drift: 0,
    deltaSpeed: 0,
  }
  SetComponent(entity, "movementCommand", movementCommand)
}

/****
 * PATROL MISSION
 * Wander around the patrol point
 * Approach and engage enemies within range
 */
const PatrolMission = (entity: Entity, blackboard: intelligenceBlackboard) => {
  const objective = blackboard.intelligence.objective
  switch (objective) {
    case "Engage": {
      Engage(entity, blackboard)
      break
    }
    case "Wander": {
      PatrolArea(entity, blackboard)
      break
    }
    default: {
      blackboard.intelligence.objective = "Wander"
      break
    }
  }
}

/***
 * PATROL MISSION TACTICS
 */
const PatrolTactics = {
  LookOut: "LookOut",
  HeadHome: "HeadHome",
  ApproachTarget: "ApproachTarget",
} as const
export type PatrolTactics = (typeof PatrolTactics)[keyof typeof PatrolTactics]

const PATROL_LOOKOUT_DISTANCE = 10000
const PATROL_WANDER_DISTANCE = 3000
const PATROL_HEADHOME_DISTANCE = 8000
const PatrolArea = (entity: Entity, blackboard: AIBlackboard) => {
  const tactic = blackboard.intelligence.tactic as PatrolTactics
  switch (tactic) {
    case "LookOut": {
      if (blackboard.lookout == undefined) {
        // pick a random point just outside the patrol area
        const randomDirection = new Vector3(
          randFloat(-0.5, 0.5),
          randFloat(-0.5, 0.5),
          randFloat(-0.5, 0.5)
        ).normalize()
        // move to outside range
        const randomPoint = randomDirection.multiplyByFloats(
          PATROL_HEADHOME_DISTANCE + 1000,
          PATROL_HEADHOME_DISTANCE + 1000,
          PATROL_HEADHOME_DISTANCE + 1000
        )
        blackboard.lookout = {
          checkpoint: randomPoint,
        }
      }
      const nearbyEnemy = nearestEnemy(entity, PATROL_LOOKOUT_DISTANCE)
      if (nearbyEnemy) {
        blackboard.targeting.target = nearbyEnemy.id
        blackboard.intelligence.tactic = PatrolTactics.ApproachTarget
        blackboard.lookout = undefined
        DEBUG &&
          debugLog(`[ShipIntelligence][PatrolArea] Ship ${entity.id} Approaching Target ${blackboard.targeting.target}`)
        break
      }
      const missionDetails = entity.missionDetails
      const entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[0])
      const entityRotation = QuaternionFromObj(entity.rotationQuaternion)
      const missionNextPosition = Vector3FromObj(missionDetails.missionLocations[0].position, TmpVectors.Vector3[2])
      const distance = entityPosition.subtractToRef(missionNextPosition, TmpVectors.Vector3[1]).length()
      if (distance > PATROL_HEADHOME_DISTANCE) {
        blackboard.lookout = undefined
        blackboard.intelligence.tactic = PatrolTactics.HeadHome
        DEBUG && debugLog(`[ShipIntelligence][PatrolArea] Ship ${entity.id} Heading Home`)
        break
      }
      if (avoidObstaclesManeuver(entity, blackboard)) {
        break
      }
      const deltaSpeed = (entity.setSpeed ?? 0) < shipCruiseSpeed(entity) ? 1 : -1
      // wander around
      const input = SteeringBehaviours.seek(
        blackboard.dt,
        entityPosition,
        entityRotation,
        blackboard.lookout.checkpoint,
        PlanarUp,
        SteeringSoftNormalizeClamp
      )
      const movementCommand: MovementCommand = {
        pitch: input.pitch,
        yaw: input.yaw,
        roll: input.roll,
        afterburner: 0,
        brake: 0,
        drift: 0,
        deltaSpeed: deltaSpeed,
      }
      SetComponent(entity, "movementCommand", movementCommand)
      break
    }
    case "HeadHome": {
      const missionDetails = entity.missionDetails
      const entityPosition = Vector3FromObj(entity.position)
      const entityRotation = QuaternionFromObj(entity.rotationQuaternion)
      const missionNextPosition = Vector3FromObj(missionDetails.missionLocations[0].position, TmpVectors.Vector3[2])
      const distance = entityPosition.subtractToRef(missionNextPosition, TmpVectors.Vector3[1]).length()
      if (distance < PATROL_WANDER_DISTANCE) {
        blackboard.intelligence.tactic = PatrolTactics.LookOut
        DEBUG && debugLog(`[ShipIntelligence][PatrolArea] Ship ${entity.id} looking out`)
        break
      }
      const nearbyEnemy = nearestEnemy(entity, PATROL_LOOKOUT_DISTANCE)
      if (nearbyEnemy) {
        blackboard.targeting.target = nearbyEnemy.id
        blackboard.intelligence.tactic = PatrolTactics.ApproachTarget
        blackboard.lookout = undefined
        DEBUG &&
          debugLog(`[ShipIntelligence][PatrolArea] Ship ${entity.id} Approaching Target ${blackboard.targeting.target}`)
        break
      }
      // head back to patrol point
      if (avoidObstaclesManeuver(entity, blackboard)) {
        break
      }
      let input = SteeringBehaviours.seek(
        blackboard.dt,
        entityPosition,
        entityRotation,
        missionNextPosition,
        PlanarUp,
        SteeringSoftNormalizeClamp
      )
      let deltaSpeed = (entity.setSpeed ?? 0) < shipCruiseSpeed(entity) ? 1 : -1
      const movementCommand: MovementCommand = {
        pitch: input.pitch,
        yaw: input.yaw,
        roll: input.roll,
        afterburner: 0,
        brake: 0,
        drift: 0,
        deltaSpeed: deltaSpeed,
      }
      SetComponent(entity, "movementCommand", movementCommand)
      break
    }
    case "ApproachTarget": {
      // head towards suspected target
      const targetEntity = EntityForId(blackboard.targeting.target)
      if (targetEntity == undefined) {
        blackboard.intelligence.tactic = PatrolTactics.LookOut
        break
      }
      if (avoidObstaclesManeuver(entity, blackboard)) {
        break
      }
      const distanceToTarget = ApproachTarget(entity, blackboard)
      if (distanceToTarget < 3000) {
        blackboard.intelligence.objective = "Engage"
        blackboard.intelligence.tactic = undefined
        DEBUG && debugLog(`[ShipIntelligence][PatrolArea] Ship ${entity.id} Engaging!`)
      }
      break
    }
    default: {
      blackboard.intelligence.tactic = PatrolTactics.HeadHome
      break
    }
  }
}

const ApproachTarget = (entity: Entity, blackboard: AIBlackboard): number => {
  const targetEntity = EntityForId(blackboard.targeting.target)
  const input = SteeringBehaviours.pursuit(blackboard.dt, entity, targetEntity, SteeringHardNormalizeClamp)
  const distanceToTarget = Vector3FromObj(targetEntity.position, TmpVectors.Vector3[0])
    .subtractToRef(Vector3FromObj(entity.position, TmpVectors.Vector3[1]), TmpVectors.Vector3[2])
    .length()
  const targetSpeed = shipCruiseSpeed(entity)
  let throttle = 0
  if (entity.setSpeed < targetSpeed) {
    throttle += 1
  } else if (entity.setSpeed > targetSpeed) {
    throttle -= 1
  }
  let afterburner = 0
  if (distanceToTarget > 5000) {
    afterburner = 1
  }
  const movementCommand: MovementCommand = {
    pitch: input.pitch,
    yaw: input.yaw,
    roll: input.roll,
    afterburner,
    brake: 0,
    drift: 0,
    deltaSpeed: throttle,
  }
  SetComponent(entity, "movementCommand", movementCommand)
  return distanceToTarget
}

/** below this distance is near */
const NEAR = 4000
/** below this speed is slow */
const SLOW = 150
/** degrees forward or back if infront / behind */
const TRAILING = 30
/** how long do we chase fleeing targets */
const FLEE_CHASE_LIMIT = 10000

// TODO: we need a way to clean in progress maneuvers
const Engage = (entity: Entity, blackboard: AIBlackboard) => {
  if (entity.ai.pilot == undefined) {
    entity.ai.pilot = "Light01"
  }

  /// check State of Health
  let stateOfHealth: StateOfHealth = "LittleDamage"
  const shields = entity.shields
  const armor = entity.armor
  const healthPercent = entity.health.current / entity.health.base
  let missingArmorCount = 0
  if (armor.back == 0) {
    missingArmorCount += 1
  }
  if (armor.front == 0) {
    missingArmorCount += 1
  }
  if (armor.left == 0) {
    missingArmorCount += 1
  }
  if (armor.right == 0) {
    missingArmorCount += 1
  }
  if (missingArmorCount > 1 || healthPercent < 0.5) {
    stateOfHealth = "HeavyDamage"
  } else if (shields.currentAft <= 1 || shields.currentFore <= 1 || missingArmorCount == 1) {
    stateOfHealth = "MediumDamage"
  }
  blackboard.intelligence.stateOfHealth = stateOfHealth

  //// Check State of Confrontation

  /// Avoid Obstacles
  if (avoidObstaclesManeuver(entity, blackboard)) {
    debugLog(`[ShipIntelligence] Ship ${entity.id} avoiding obstacle`)
    return
  }

  /// Enemy Destroyed
  if (
    blackboard.targeting.target == undefined ||
    EntityForId(blackboard.targeting.target) == undefined ||
    EntityForId(blackboard.targeting.target).deathRattle
  ) {
    blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.EnemyDestroyed
    DEBUG &&
      debugLog(
        `[ShipIntelligence] Ship ${entity.id} veering off, enemy destroyed ${blackboard.intelligence.stateOfConfrontation} ${stateOfHealth}`
      )
    execute(entity, blackboard, shipPilot(entity).EnemyDestroyed[stateOfHealth])
    if (blackboard.veerOff == undefined) {
      // veer finished
      blackboard.intelligence.objective = undefined
      blackboard.intelligence.tactic = undefined
      blackboard.intelligence.maneuver = undefined
      blackboard.targeting.target = undefined
    }
    return
  }

  const entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[0])
  const entityDirection = Vector3FromObj(entity.direction, TmpVectors.Vector3[1])
  const targetEntity = EntityForId(blackboard.targeting.target)

  if (targetEntity?.ai?.blackboard?.intelligence?.maneuver == ManeuverType.Flee) {
    // enemy target is fleeing, chase until chase limit
    if (blackboard.chasing == undefined) {
      blackboard.chasing = {
        count: 0,
      }
    }
    blackboard.chasing.count += blackboard.dt
    if (blackboard.chasing.count > FLEE_CHASE_LIMIT) {
      blackboard.chasing = undefined
      // act like enemy destroyed
      blackboard.targeting.target = undefined
      DEBUG &&
        debugLog(
          `[ShipIntelligence] Ship ${entity.id} veering off, enemy fleed ${blackboard.intelligence.stateOfConfrontation} ${stateOfHealth}`
        )
      return
    }
  }
  /// LaserHit
  if (entity.hitsTaken && entity.hitsTaken.hitCountRecent >= 5) {
    // set the last person who hit me as my target
    blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.LaserHit
    blackboard.targeting.target = entity.hitsTaken.hits[entity.hitsTaken.hits.length - 1].shooter
    DEBUG &&
      debugLog(
        `[ShipIntelligence] Ship ${entity.id} laser hit ${blackboard.intelligence.stateOfConfrontation} ${stateOfHealth}`
      )
    execute(entity, blackboard, shipPilot(entity).LaserHit[stateOfHealth])
    return
  }

  /// MissileIncoming
  for (let missile of queries.missiles.entities) {
    if (entity.id != missile.missileRange.target) {
      continue
    }
    // missile is live and targeting us
    blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.LaserHit
    DEBUG &&
      debugLog(
        `[ShipIntelligence] Ship ${entity.id} missile incoming ${blackboard.intelligence.stateOfConfrontation} ${stateOfHealth}`
      )
    execute(entity, blackboard, shipPilot(entity).MissileIncoming[stateOfHealth])
    return
  }

  const targetPosition = Vector3FromObj(targetEntity.position, TmpVectors.Vector3[2])
  const targetDirection = Vector3FromObj(targetEntity.direction, TmpVectors.Vector3[3])
  /// OnEnemyTail
  const targetInfront = isPointBehind(entityPosition, entityDirection, targetPosition) == false
  if (targetInfront) {
    const directionsAngle = AngleBetweenVectors(targetDirection, entityDirection)
    // DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} on enemy tail angle ${ToDegree(directionsAngle)}!`)
    if (directionsAngle <= ToRadians(TRAILING / 2)) {
      blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.OnEnemyTail
      DEBUG &&
        debugLog(
          `[ShipIntelligence] Ship ${entity.id} on enemy tail ${blackboard.intelligence.stateOfConfrontation} ${stateOfHealth}`
        )
      execute(entity, blackboard, shipPilot(entity).OnEnemyTail[stateOfHealth])
      return
    }
  }
  /// HeadToHead
  if (targetInfront) {
    const directionsAngle = AngleBetweenVectors(targetDirection, entityDirection)
    // DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} head to head angle ${ToDegree(directionsAngle)}!`)
    if (directionsAngle <= ToRadians(TRAILING / 2)) {
      blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.HeadToHead
      DEBUG &&
        debugLog(
          `[ShipIntelligence] Ship ${entity.id} head to head ${blackboard.intelligence.stateOfConfrontation} ${stateOfHealth}`
        )
      execute(entity, blackboard, shipPilot(entity).HeadToHead[stateOfHealth])
      return
    }
  }

  /// EnemyTailing
  for (let otherEntity of queries.targets.entities) {
    if (otherEntity.teamId == entity.teamId) {
      continue
    }
    if (otherEntity.isTargetable == "missile" || otherEntity.isTargetable == "nav") {
      continue
    }
    const enemyPosition = Vector3FromObj(otherEntity.position, TmpVectors.Vector3[4])
    const enemyDirection = Vector3FromObj(otherEntity.direction, TmpVectors.Vector3[5])
    if (isPointBehind(entityPosition, entityDirection, enemyPosition) == false) {
      continue
    }
    if (enemyPosition.subtractToRef(enemyPosition, TmpVectors.Vector3[6]).length() > NEAR) {
      continue
    }
    const directionsAngle = AngleBetweenVectors(entityDirection, enemyDirection)
    // DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} enemy tailing angle ${ToDegree(directionsAngle)} > ${TRAILING/2} : ${directionsAngle > ToRadians(TRAILING/2)}!`)
    if (directionsAngle > ToRadians(TRAILING / 2)) {
      continue
    }
    blackboard.enemyTailing = otherEntity.id
    blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.EnemyTailing
    DEBUG &&
      debugLog(
        `[ShipIntelligence] Ship ${entity.id} enemy tailing me ${blackboard.intelligence.stateOfConfrontation} ${stateOfHealth}`
      )
    execute(entity, blackboard, shipPilot(entity).EnemyTailing[stateOfHealth])
    return
  }

  /// EnemySlow
  const enemyVelocity = totalVelocityFrom(targetEntity)
  const enemySpeed = enemyVelocity.length()
  if (enemySpeed < SLOW) {
    blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.EnemySlow
    DEBUG &&
      debugLog(
        `[ShipIntelligence] Ship ${entity.id} enemy slow ${blackboard.intelligence.stateOfConfrontation} ${stateOfHealth}`
      )
    execute(entity, blackboard, shipPilot(entity).EnemySlow[stateOfHealth])
    return
  }

  /// Continue current maneuver
  if (blackboard.intelligence.maneuver != undefined) {
    const maneuver = AIManeuvers[blackboard.intelligence.maneuver] as AIManeuvers.AIManeuver
    maneuver(entity, blackboard)
    return
  }

  /// EnemyFar / EnemyNear
  const otherEntityPosition = Vector3FromObj(targetEntity.position, TmpVectors.Vector3[7])
  const distance = otherEntityPosition.subtractToRef(entityPosition, TmpVectors.Vector3[8]).length()
  let distanceManeuver: "EnemyNear" | "EnemyFar"
  if (distance > NEAR) {
    blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.EnemyFar
    distanceManeuver = "EnemyFar"
  } else {
    blackboard.intelligence.stateOfConfrontation = StateOfConfrontation.EnemyNear
    distanceManeuver = "EnemyNear"
  }

  const possibleManeuvers = shipPilot(entity)[distanceManeuver][stateOfHealth]
  DEBUG &&
    debugLog(
      `[ShipIntelligence] Ship ${entity.id} picked based on ${distanceManeuver} ${stateOfHealth} from: `,
      possibleManeuvers
    )
  const maneuverName = pickManeuverType(possibleManeuvers)
  DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} picked ${maneuverName}`)
  blackboard.intelligence.maneuver = maneuverName
  const maneuver = AIManeuvers[maneuverName] as AIManeuvers.AIManeuver
  maneuver(entity, blackboard)

  // check fire decision
  FireDecision(entity, blackboard)
}

function FireDecision(entity: Entity, blackboard: AIBlackboard) {
  const targetEntity = EntityForId(blackboard.targeting?.target)
  if (targetEntity == undefined) {
    return
  }
  let fireCommand = entity.fireCommand
  if (fireCommand == undefined) {
    fireCommand = {}
    world.addComponent(entity, "fireCommand", fireCommand)
  }
  const distanceToTarget = Vector3FromObj(entity.position, TmpVectors.Vector3[0])
    .subtractInPlace(Vector3FromObj(targetEntity.position, TmpVectors.Vector3[1]))
    .length()
  const firingAngle = SteeringBehaviours.firingPosition(entity, targetEntity)
  // is there an enemy fighter in your gunsights?
  if (firingAngle < ToRadians(2.5)) {
    /// yes: is it within optimum range of your primary weapon
    const gunGroup = entity.guns.groups[entity.guns.selected]
    if (gunGroup == undefined) {
      return undefined
    }
    let gunsRange = 0
    for (let mountIdx of gunGroup) {
      const gun = entity.guns.mounts[mountIdx].stats as GunStats
      gunsRange += gun.range / gunGroup.length
    }
    gunsRange = Math.round(gunsRange)
    if (distanceToTarget <= gunsRange) {
      //// yes: fire primary weapon, done
      fireCommand.gun = 1
      return
    } else {
      //// no: is it within range of your secondary weapon
      let canFire = false
      let weaponRange = 0
      entity.weapons.mounts.forEach((weaponMount, index) => {
        if ((weaponMount.type == "dumbfire" || weaponMount.type == "enemyDumbfire") && weaponMount.count > 0) {
          entity.weapons.selected = index
          weaponRange = Weapons[weaponMount.type].range
          canFire = true
        }
      })
      if (canFire && distanceToTarget <= weaponRange) {
        fireCommand.weapon = 1
        return
      }
    }
  }
  // is there an enemy fighter less than 1500 units in front of you?
  if (firingAngle < ToRadians(45) && distanceToTarget < 1500) {
    const entityDirection = Vector3FromObj(entity.direction, TmpVectors.Vector3[2])
    const targetDirection = Vector3FromObj(targetEntity.direction, TmpVectors.Vector3[3])
    const facingDelta = Vector3.Dot(entityDirection, targetDirection)
    /// yes: is he facing away from you?
    if (facingDelta > 0) {
      //// yes: fire heat seeking
      let canFire = false
      entity.weapons.mounts.forEach((weaponMount, index) => {
        if (weaponMount.type == "heatseeking" && weaponMount.count > 0) {
          entity.weapons.selected = index
          canFire = true
        }
      })
      if (canFire) {
        fireCommand.weapon = 1
        return
      }
    } else {
      //// no: fire IR
      let canFire = false
      entity.weapons.mounts.forEach((weaponMount, index) => {
        if (weaponMount.type == "imagerecognition" && weaponMount.count > 0) {
          entity.weapons.selected = index
          canFire = true
        }
      })
      if (canFire) {
        fireCommand.weapon = 1
        return
      }
    }
    /// no: continue
  }
  // is your target within 1000 units?
  if (distanceToTarget < 1000) {
    /// fire IFF
    let canFire = false
    entity.weapons.mounts.forEach((weaponMount, index) => {
      if (weaponMount.type == "friendorfoe" && weaponMount.count > 0) {
        entity.weapons.selected = index
        canFire = true
      }
    })
    if (canFire) {
      fireCommand.weapon = 1
      return
    }
  }
}

function execute(
  entity: Entity,
  blackboard: AIBlackboard,
  possibleManeuvers: [weight: number, maneuver: ManeuverType[]][]
) {
  for (const weights of possibleManeuvers) {
    for (const maneuverType of weights[1]) {
      if (blackboard.intelligence.maneuver == maneuverType) {
        const maneuver = AIManeuvers[blackboard.intelligence.maneuver] as AIManeuvers.AIManeuver
        maneuver(entity, blackboard)
        return
      }
    }
  }
  const maneuverName = pickManeuverType(possibleManeuvers)
  blackboard.intelligence.maneuver = maneuverName
  const maneuver = AIManeuvers[maneuverName] as AIManeuvers.AIManeuver
  maneuver(entity, blackboard)
}

function pickManeuverType(taskOptions: [weight: number, maneuver: ManeuverType[]][]): ManeuverType {
  const maneuversIndex = RouletteSelectionStochastic(taskOptions.map((to) => to[0]))
  const maneuvers = taskOptions[maneuversIndex][1]
  const maneuver = randomItem(maneuvers)
  return maneuver
}

export function nearestEnemy(entity: Entity, threshold: number = Number.MAX_SAFE_INTEGER): Entity | undefined {
  // check State of Confrontation
  const entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[0])
  /// Enemy Distances
  let nearestEnemyDistance: number = Number.MAX_SAFE_INTEGER
  let nearestEnemy: Entity

  for (let otherEntity of queries.targets.entities) {
    if (otherEntity.teamId == entity.teamId) {
      continue
    }
    if (otherEntity.isTargetable == "nav" || otherEntity.isTargetable == "missile") {
      continue
    }
    const otherEntityPosition = Vector3FromObj(otherEntity.position, TmpVectors.Vector3[1])
    const distance = otherEntityPosition.subtractToRef(entityPosition, TmpVectors.Vector3[2]).length()
    if (distance < nearestEnemyDistance) {
      nearestEnemyDistance = distance
      nearestEnemy = otherEntity
    }
  }
  if (nearestEnemyDistance < threshold) {
    return nearestEnemy
  }
  return undefined
}

namespace AIManeuvers {
  export type AIManeuver = (entity: Entity, blackboard: AIBlackboard) => void
  export const BreakLeft = (entity: Entity, blackboard: AIBlackboard) => {
    headingManeuver(entity, blackboard, "breakLeft", BreakLeftData)
  }
  export const BreakRight = (entity: Entity, blackboard: AIBlackboard) => {
    headingManeuver(entity, blackboard, "breakRight", BreakRightData)
  }

  const BURNOUT_LIMIT = 5000
  export const Burnout = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.burnout == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} starting burnout maneuver!`)
      blackboard.burnout = {
        burnoutTime: 0,
      }
    }
    const burnoutBlackboard = blackboard.burnout as {
      burnoutTime: number
    }
    if (burnoutBlackboard.burnoutTime > BURNOUT_LIMIT) {
      blackboard.burnout = undefined
      entity.ai.blackboard.intelligence.maneuver = "Thinking"
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} burnout maneuver complete!`)
      return
    }
    burnoutBlackboard.burnoutTime += blackboard.dt
    // DEBUG && debugLog(`[AI wingleader] steering:`, input)
    let movementCommand: MovementCommand = {
      pitch: 0,
      yaw: 0,
      roll: 0,
      afterburner: 1,
      drift: 0,
      brake: 0,
      deltaSpeed: entity.engine.accelleration,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  const CORKSCREW_LIMIT = 5000
  export const Corkscrew = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.burnout == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} starting corkscrew maneuver!`)
      blackboard.corkscrew = {
        corkscrewTime: 0,
      }
    }
    const corkscrewBlackboard = blackboard.corkscrew as {
      corkscrewTime: number
    }
    if (corkscrewBlackboard.corkscrewTime > CORKSCREW_LIMIT) {
      blackboard.corkscrew = undefined
      entity.setSpeed = shipCruiseSpeed(entity)
      entity.ai.blackboard.intelligence.maneuver = "Thinking"
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} corkscrew maneuver complete!`)
      return
    }
    corkscrewBlackboard.corkscrewTime += blackboard.dt
    // DEBUG && debugLog(`[AI wingleader] steering:`, input)
    let movementCommand: MovementCommand = {
      pitch: 0.5,
      yaw: 0,
      roll: 1,
      afterburner: 0,
      drift: 0,
      brake: 0,
      deltaSpeed: 1,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  export const FishHook = (entity: Entity, blackboard: AIBlackboard) => {
    headingManeuver(entity, blackboard, "fishHook", FishHookData)
  }

  const FLEE_DESPAWN_RANGE = 15000
  export const Flee = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.flee == undefined) {
      blackboard.flee = {}
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} fleeing!`)
    }
    let nearestEntity = nearestEnemy(entity, FLEE_DESPAWN_RANGE)
    if (nearestEntity == undefined) {
      // we have cleared the battlefield
      if (!entity.outOfCombat) {
        world.addComponent(entity, "outOfCombat", true)
        queueMicrotask(() => {
          world.remove(entity)
        })
      }
      return
    }
    let movementCommand: MovementCommand = {
      pitch: 0,
      yaw: 0,
      roll: 0,
      afterburner: 1,
      drift: 0,
      brake: 0,
      deltaSpeed: entity.engine.accelleration,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  const HARD_BRAKE_LIMIT = 1500
  export const HardBrake = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.hardBrake == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} starting hardBrake maneuver!`)
      blackboard.hardBrake = {
        brakeTime: 0,
      }
    }
    const brakeBlackboard = blackboard.hardBrake as {
      brakeTime: number
    }
    if (brakeBlackboard.brakeTime > HARD_BRAKE_LIMIT) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} hardBrake maneuver complete!`)
      blackboard.hardBrake = undefined
      entity.ai.blackboard.intelligence.maneuver = "Thinking"
      return
    }
    brakeBlackboard.brakeTime += blackboard.dt
    let movementCommand: MovementCommand = {
      pitch: 0,
      yaw: 0,
      roll: 0,
      afterburner: 1,
      drift: 0,
      brake: 0,
      deltaSpeed: -entity.engine.accelleration,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  const INTERCEPT_DISTANCE = 4000
  export const Intercept = (entity: Entity, blackboard: AIBlackboard) => {
    const entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[0])
    const targetEntity = EntityForId(blackboard.targeting.target)
    const targetPosition = Vector3FromObj(targetEntity.position, TmpVectors.Vector3[1])
    const distance = entityPosition.subtractToRef(targetPosition, TmpVectors.Vector3[2]).length()
    if (distance < INTERCEPT_DISTANCE) {
      entity.ai.blackboard.intelligence.maneuver = undefined
      return
    }
    const input = SteeringBehaviours.pursuit(blackboard.dt, entity, targetEntity, SteeringHardNormalizeClamp)
    let movementCommand: MovementCommand = {
      pitch: input.pitch,
      yaw: input.yaw,
      roll: input.roll,
      afterburner: 0,
      drift: 0,
      brake: 0,
      deltaSpeed: 0,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  export const Kickstop = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.kickstop == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} starting kickstop maneuver!`)
      const breakDirection = randomItem([BreakLeftData, BreakRightData])
      blackboard.kickstop = {
        holdState: {
          finished: false,
          headingHoldLength: 0,
          headingIndex: 0,
        } as SteeringBehaviours.HeadingHoldState,
        headings: breakDirection.headings,
        timings: breakDirection.timings,
        kick: false,
        flip: false,
      }
    }
    const input = SteeringBehaviours.headingHold(
      blackboard.dt,
      entity,
      blackboard.kickstop.headings,
      blackboard.kickstop.timings,
      blackboard.kickstop.holdState,
      SteeringHardTurnClamp
    )
    // DEBUG && debugLog(`[AI wingleader] steering:`, input)
    let movementCommand: MovementCommand = {
      pitch: input.pitch,
      yaw: input.yaw,
      roll: input.roll,
      afterburner: 0,
      drift: 0,
      brake: 0,
      deltaSpeed: 0,
    }
    SetComponent(entity, "movementCommand", movementCommand)
    if (blackboard.kickstop.holdState.finished == true) {
      if (blackboard.kickstop.kick == false) {
        blackboard.kickstop.kick = true
        ;(blackboard.kickstop.holdState = {
          finished: false,
          headingHoldLength: 0,
          headingIndex: 0,
        } as SteeringBehaviours.HeadingHoldState),
          (blackboard.kickstop.headings = FlipData.headings)
        blackboard.kickstop.timings = FlipData.timings
      } else {
        // TODO reset to top of decision tree
        DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} kickstop maneuver complete!`)
        blackboard.kickstop = undefined
        entity.ai.blackboard.intelligence.maneuver = "Thinking"
      }
    }
  }

  const ROLL_COUNT = 1500
  export const Roll = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.roll == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} starting Roll maneuver!`)
      blackboard.roll = {
        rollTime: 0,
      }
    }
    blackboard.roll.rollTime += blackboard.dt
    if (blackboard.roll.rollTime > ROLL_COUNT) {
      blackboard.roll = undefined
      entity.ai.blackboard.intelligence.maneuver = undefined
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} Roll maneuver complete!`)
    }
    let movementCommand: MovementCommand = {
      pitch: 0,
      yaw: 0,
      roll: 1,
      afterburner: 0,
      drift: 0,
      brake: 0,
      deltaSpeed: 0,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  export const RollAndStrafe = (entity: Entity, blackboard: AIBlackboard) => {
    // strafe...
    Strafe(entity, blackboard)
    // and roll
    if (entity.movementCommand) {
      entity.movementCommand.roll = 1
    }
  }

  export const Shake = (entity: Entity, blackboard: AIBlackboard) => {
    headingManeuver(entity, blackboard, "shake", SmallWaggleData)
  }

  export const ShakeRattleAndRoll = (entity: Entity, blackboard: AIBlackboard) => {
    headingManeuver(entity, blackboard, "shake", SmallWaggleData)
    if (entity.movementCommand) {
      entity.movementCommand.roll = 1
    }
  }

  const SITKICK_ENGINE_OFF_COUNT = 1000
  const SITKICK_FIRE_COUNT = 1000

  // Is it me or are these are describing the same thing??
  // Turn-'n'-Spin is a flight maneuver in which a fighter makes a hard 90º turn and then kills its engine power in the hopes of forcing a pursuer to overshoot it. If this succeeds then the maneuver is followed by a 180º spin to return fire.
  // Sit-'n'-Kick is a flight maneuver in which a fighter makes a random 90º turn, shuts off its engines and spins to fire on a target. After firing it makes another random 90º turn afterburns ahead.
  export const SitAndKick = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.SitAndKick == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} starting SitAndKick maneuver!`)
      const breakDirections = [BreakLeftData, BreakRightData]
      const firstBreakDirection = randomItem(breakDirections)
      const secondBreakDirection = randomItem(breakDirections)
      blackboard.SitAndKick = {
        firstTurn: {
          holdState: {
            finished: false,
            headingHoldLength: 0,
            headingIndex: 0,
          } as SteeringBehaviours.HeadingHoldState,
          headings: firstBreakDirection.headings,
          timings: firstBreakDirection.timings,
        },
        engineOff: {
          count: 0,
        },
        fire: {
          count: 0,
        },
        secondTurn: {
          holdState: {
            finished: false,
            headingHoldLength: 0,
            headingIndex: 0,
          } as SteeringBehaviours.HeadingHoldState,
          headings: secondBreakDirection.headings,
          timings: secondBreakDirection.timings,
        },
      }
    }
    let input: SteeringResult
    let afterburner = 0
    if (blackboard.SitAndKick.firstTurn.holdState.finished == false) {
      input = SteeringBehaviours.headingHold(
        blackboard.dt,
        entity,
        blackboard.SitAndKick.firstTurn.headings,
        blackboard.SitAndKick.firstTurn.timings,
        blackboard.SitAndKick.firstTurn.holdState,
        SteeringHardTurnClamp
      )
    } else if (blackboard.SitAndKick.engineOff.count < SITKICK_ENGINE_OFF_COUNT) {
      blackboard.SitAndKick.engineOff.count += blackboard.dt
      input = {
        pitch: 0,
        yaw: 0,
        roll: 0,
        throttle: -3000, // engine off
      }
    } else if (blackboard.SitAndKick.fire.count < SITKICK_FIRE_COUNT) {
      blackboard.SitAndKick.fire.count += blackboard.dt
      const targetEntity = EntityForId(blackboard.targeting.target)
      input = SteeringBehaviours.gunPursuit(blackboard.dt, entity, targetEntity, SteeringHardTurnClamp)
      let fireCommand: FireCommand = {
        gun: 1,
        lock: false,
        weapon: 0,
      }
      world.addComponent(entity, "fireCommand", fireCommand)
    } else if (blackboard.SitAndKick.secondTurn.holdState.finished == false) {
      input = SteeringBehaviours.headingHold(
        blackboard.dt,
        entity,
        blackboard.SitAndKick.secondTurn.headings,
        blackboard.SitAndKick.secondTurn.timings,
        blackboard.SitAndKick.secondTurn.holdState,
        SteeringHardTurnClamp
      )
      afterburner = 1
    } else {
      blackboard.SitAndKick = undefined
      entity.ai.blackboard.intelligence.maneuver = "Thinking"
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} SitAndKick maneuver complete!`)
      return
    }
    // DEBUG && debugLog(`[AI wingleader] steering:`, input)
    let movementCommand: MovementCommand = {
      pitch: input.pitch,
      yaw: input.yaw,
      roll: input.roll,
      afterburner: afterburner,
      drift: 0,
      brake: 0,
      deltaSpeed: input.throttle ?? 0,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  const STRAFE_FIRE_COUNT = 1000
  const STRAFE_FIRE_DISTANCE = 1500
  const STRAFE_BREAKOFF = 250
  export const Strafe = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.strafe == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} starting strafing run!`)
      blackboard.strafe = {
        flyPast: false,
        flyPastCount: 0,
      }
    }
    const targetEntity = EntityForId(blackboard.targeting.target)
    const targetPosition = Vector3FromObj(targetEntity.position, TmpVectors.Vector3[0])
    const entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[1])
    const distanceToTarget = targetPosition.subtractToRef(entityPosition, TmpVectors.Vector3[2]).length()
    let afterburner = 0
    const input = SteeringBehaviours.gunPursuit(blackboard.dt, entity, targetEntity, SteeringHardTurnClamp)
    if (distanceToTarget < STRAFE_FIRE_DISTANCE) {
      let fireCommand: FireCommand = {
        gun: input.firePosition ?? false ? 1 : 0,
        lock: false,
        weapon: 0,
      }
      SetComponent(entity, "fireCommand", fireCommand)
    }
    const avoidCollision = SteeringBehaviours.collisionAvoidance(
      blackboard.dt,
      entity,
      queries.targets.entities.filter((t) => t.isTargetable != "missile" && t.isTargetable != "nav")
    )
    if (blackboard.strafe.flyPast) {
      if (blackboard.strafe.flyPastCount > STRAFE_FIRE_COUNT) {
        blackboard.strafe = undefined
        entity.ai.blackboard.intelligence.maneuver = randomItem([ManeuverType.BreakLeft, ManeuverType.BreakRight])
        DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} strafing run complete!`)
        return
      }
      let movementCommand: MovementCommand = {
        pitch: 0,
        yaw: 0,
        roll: 0,
        afterburner: 0,
        drift: 0,
        brake: 0,
        deltaSpeed: 0,
      }
      if (avoidCollision) {
        movementCommand.pitch = avoidCollision.pitch
        movementCommand.yaw = avoidCollision.yaw
        movementCommand.deltaSpeed = avoidCollision.throttle
      }
      SetComponent(entity, "movementCommand", movementCommand)
      blackboard.strafe.flyPastCount += blackboard.dt
    }
    let movementCommand: MovementCommand = {
      pitch: input.pitch,
      yaw: input.yaw,
      roll: input.roll,
      afterburner: afterburner,
      drift: 0,
      brake: 0,
      deltaSpeed: input.throttle ?? 0,
    }
    if (avoidCollision) {
      movementCommand.pitch = avoidCollision.pitch
      movementCommand.yaw = avoidCollision.yaw
      movementCommand.deltaSpeed = avoidCollision.throttle
    }
    SetComponent(entity, "movementCommand", movementCommand)
    if (distanceToTarget < STRAFE_BREAKOFF) {
      blackboard.strafe.flyPast = true
    }
  }

  const TAIL_DISTANCE = 400
  const TAIL_TIMEOUT = 5000
  export const Tail = (entity: Entity, blackboard: AIBlackboard) => {
    const targetEntity = EntityForId(blackboard.targeting.target)
    const targetPosition = Vector3FromObj(targetEntity.position, TmpVectors.Vector3[0])
    const entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[1])
    const distanceToTarget = targetPosition.subtractToRef(entityPosition, TmpVectors.Vector3[2]).length()
    if (blackboard.tail == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} tailing!`)
      blackboard.tail = {
        count: 0,
        offset: new Vector3(0, 0, -1).multiplyByFloats(TAIL_DISTANCE, TAIL_DISTANCE, TAIL_DISTANCE),
      }
    }
    blackboard.tail.count += blackboard.dt
    if (blackboard.tail.count > TAIL_TIMEOUT) {
      blackboard.tail = undefined
      if (distanceToTarget < STRAFE_BREAKOFF) {
        blackboard.intelligence.maneuver = randomItem([ManeuverType.BreakLeft, ManeuverType.BreakRight])
      } else {
        blackboard.intelligence.maneuver = undefined
      }
      entity.setSpeed = shipCruiseSpeed(entity)
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} tail complete!`)
      return
    }
    let input = SteeringBehaviours.offsetPursuit(
      blackboard.dt,
      entity,
      targetEntity,
      blackboard.tail.offset,
      SteeringHardTurnClamp
    )
    if (distanceToTarget <= TAIL_DISTANCE + 50 && distanceToTarget > TAIL_DISTANCE - 50) {
      input = SteeringBehaviours.gunPursuit(blackboard.dt, entity, targetEntity, SteeringHardTurnClamp)
      if (distanceToTarget < STRAFE_FIRE_DISTANCE) {
        let fireCommand: FireCommand = {
          gun: input.firePosition ?? false ? 1 : 0,
          lock: false,
          weapon: 0,
        }
        world.addComponent(entity, "fireCommand", fireCommand)
      }
    }
    const movementCommand: MovementCommand = {
      pitch: input.pitch,
      yaw: input.yaw,
      roll: input.roll,
      afterburner: 0,
      drift: 0,
      brake: 0,
      deltaSpeed: input.throttle ?? 0,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  // TODO: The time it takes to think of the next move could be reduced by pilot skill
  const THINK_LIMIT = 3000
  export const Thinking = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.thinking == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} thinking!`)
      blackboard.thinking = {
        count: 0,
      }
    }
    blackboard.thinking.count += blackboard.dt
    if (blackboard.thinking.count > TAIL_TIMEOUT) {
      blackboard.thinking = undefined
      blackboard.intelligence.maneuver = undefined
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} thinking complete!`)
      return
    }
    const movementCommand: MovementCommand = {
      pitch: 0,
      yaw: 0,
      roll: 1,
      afterburner: 0,
      drift: 0,
      brake: 0,
      deltaSpeed: 0,
    }
    SetComponent(entity, "movementCommand", movementCommand)
  }

  // TODO: There is no explaination of a "turn and kick" anywhere
  export const TurnAndKick = (entity: Entity, blackboard: AIBlackboard) => {
    SitAndKick(entity, blackboard)
  }
  // Turn-'n'-Spin is a flight maneuver in which a fighter makes a hard 90º turn and then kills its engine power in the hopes of forcing a pursuer to overshoot it. If this succeeds then the maneuver is followed by a 180º spin to return fire.
  // this sounds a lot like Turn-'n'-Kick...
  export const TurnAndSpin = (entity: Entity, blackboard: AIBlackboard) => {
    SitAndKick(entity, blackboard)
  }
  export const TightLoop = (entity: Entity, blackboard: AIBlackboard) => {
    headingManeuver(entity, blackboard, "tightLoop", LoopData)
  }
  const SIT_AND_FIRE_TIMEOUT = 5000
  export const SitAndFire = (entity: Entity, blackboard: AIBlackboard) => {
    if (blackboard.sitAnfFire == undefined) {
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} sit and fire!`)
      blackboard.sitAnfFire = {
        count: 0,
      }
    }
    blackboard.sitAnfFire.count += blackboard.dt
    const targetEntity = EntityForId(blackboard.targeting.target)
    if (blackboard.sitAnfFire.count > SIT_AND_FIRE_TIMEOUT || targetEntity == undefined) {
      blackboard.sitAnfFire = undefined
      blackboard.intelligence.maneuver = undefined
      entity.setSpeed = shipCruiseSpeed(entity)
      DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} site and fire complete!`)
      return
    }
    const input = SteeringBehaviours.gunPursuit(blackboard.dt, entity, targetEntity, SteeringHardTurnClamp)
    const movementCommand: MovementCommand = {
      pitch: input.pitch,
      yaw: input.yaw,
      roll: input.roll,
      afterburner: 0,
      drift: 0,
      brake: 1,
      deltaSpeed: -100,
    }
    SetComponent(entity, "movementCommand", movementCommand)
    if (input.firePosition) {
      const fireCommand = {
        gun: 1,
        weapon: 0,
      } as FireCommand
      SetComponent(entity, "fireCommand", fireCommand)
    }
  }
  // Turn-'n'-Spin is a flight maneuver in which a fighter makes a hard 90º turn and then kills its engine power in the hopes of forcing a pursuer to overshoot it. If this succeeds then the maneuver is followed by a 180º spin to return fire.
  // Same thing but you gut engines......
  export const SitAndSpin = (entity: Entity, blackboard: AIBlackboard) => {
    SitAndKick(entity, blackboard)
  }
  export const Veer = (entity: Entity, blackboard: AIBlackboard) => {
    headingManeuver(entity, blackboard, "veerOff", VeerOffData)
  }
}

/** Avoids obstacles, if maneuvering around an obstacal returns true */
const avoidObstaclesManeuver = (entity: Entity, blackboard: AIBlackboard): boolean => {
  const obstacles = queries.obstacles.entities
  const avoidance = SteeringBehaviours.obstacleAvoidance(blackboard.dt, entity, obstacles, 500, 100)
  if (avoidance) {
    let movementCommand: MovementCommand = {
      pitch: avoidance.pitch,
      yaw: avoidance.yaw,
      roll: avoidance.roll,
      afterburner: 0,
      drift: 0,
      brake: 0,
      deltaSpeed: avoidance.throttle ?? 0,
    }
    SetComponent(entity, "movementCommand", movementCommand)
    debugLog(`[ShipIntelligence] Ship ${entity.id} avoiding obstacle`, movementCommand)
    return true
  }
  return false
}

const headingManeuver = (
  entity: Entity,
  blackboard: AIBlackboard,
  stateName: string,
  maneuver: HeadingManeuverData
) => {
  if (blackboard[stateName] == undefined || blackboard[stateName]?.finished) {
    DEBUG && debugLog(`[ShipIntelligence] Ship ${entity.id} starting ${stateName} maneuver!`)
    blackboard[stateName] = {
      holdState: {
        finished: false,
        headingHoldLength: 0,
        headingIndex: 0,
      } as SteeringBehaviours.HeadingHoldState,
      headings: maneuver.headings,
      timings: maneuver.timings,
    }
  }
  const maneuverBlackboard = blackboard[stateName]
  const input = SteeringBehaviours.headingHold(
    blackboard.dt,
    entity,
    maneuverBlackboard.headings,
    maneuverBlackboard.timings,
    maneuverBlackboard.holdState,
    SteeringHardTurnClamp
  )
  let movementCommand: MovementCommand = {
    pitch: input.pitch,
    yaw: input.yaw,
    roll: input.roll,
    afterburner: 0,
    drift: 0,
    brake: 0,
    deltaSpeed: 0,
  }
  SetComponent(entity, "movementCommand", movementCommand)
  if (blackboard[stateName].holdState.finished == true) {
    blackboard[stateName] = undefined
    entity.ai.blackboard.intelligence.maneuver = "Thinking"
    // TODO reset to top of decision tree?
  }
}

function shipCruiseSpeed(entity: Entity): number {
  return Math.floor(entity.engine.cruiseSpeed * 0.75)
}

function shipPilot(entity: Entity): ExecutionTree {
  return PilotAIs[entity.ai?.pilot ?? "Light01"]
}
