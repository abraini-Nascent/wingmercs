import { TmpVectors } from "@babylonjs/core"
import { Vector3FromObj } from "../../../utils/math"
import { Entity, EntityForId, LandingDetails, LandingDetailsForEntity, queries, world } from "./../../world"
import { PlayVoiceSound, VoiceSound } from "../../../utils/speaking"
import { barks } from "../../../data/barks"
import { debugLog } from "../../../utils/debuglog"
import { random } from "../../../utils/random"
import { shipIntelligence } from "./shipIntelligence"

const MAX_HANGER_DISTANCE = 5000

export function CommunicationsOptions(ship: Entity): Array<{ label: string; action: () => void }> {
  if (ship.openComms == undefined) {
    world.addComponent(ship, "openComms", ship.id)
    ship.openComms = ship.id
  }
  const commId = ship.openComms
  if (ship.id == commId) {
    debugLog("[communications] finding comms for around", ship.targetName)
    // Targeted ship (if any)
    const targetedShip = EntityForId(ship.targeting?.target)

    // Wing members (same team and group as the player)
    const wingMembers = world.entities.filter((entity) => entity.teamId === ship.teamId && entity.id !== ship.id)

    // Nearby hangar bay (in range, e.g., within 1000 units)
    const nearbyHangars = queries.carriers.entities.filter(
      (entity) =>
        Vector3FromObj(ship.position, TmpVectors.Vector3[0])
          .subtractToRef(Vector3FromObj(entity.position, TmpVectors.Vector3[1]), TmpVectors.Vector3[2])
          .length() < MAX_HANGER_DISTANCE
    )

    debugLog("[communications] nearby hangers", nearbyHangars)

    const communicationOptions: Array<{ label: string; action: () => void }> = []
    for (const hanger of nearbyHangars) {
      communicationOptions.push({ label: hanger.targetName, action: () => openComms(ship, hanger) })
    }
    if (targetedShip && nearbyHangars.some((h) => h.id == targetedShip.id) == false) {
      communicationOptions.push({ label: targetedShip.targetName, action: () => openComms(ship, targetedShip) })
    }
    for (const wingMember of wingMembers) {
      if (targetedShip && targetedShip.id == wingMember.id) {
        continue
      }
      if (nearbyHangars.some((hanger) => hanger.id == wingMember.id)) {
        continue
      }
      communicationOptions.push({ label: wingMember.targetName, action: () => openComms(ship, wingMember) })
    }
    return communicationOptions
  }
  const communicationOptions: Array<{ label: string; action: () => void }> = []
  const commShip = EntityForId(commId)
  debugLog("[communications] commShip", commShip)
  if (commShip.hangerBay) {
    debugLog("[communications] commShip has hangerBay", commShip.hangerBay)
    communicationOptions.push({
      label: "Request Landing",
      action: () => {
        requestLanding(ship, commShip)
      },
    })
    communicationOptions.push({
      label: "Close Comms",
      action: () => {
        closeComms(ship)
      },
    })
  } else if (commShip.teamId != ship.teamId) {
    debugLog("[communications] commShip is enemy", commShip.hangerBay)
    communicationOptions.push({
      label: "Taunt",
      action: () => {
        tauntEnemy(ship, commShip)
      },
    })
    communicationOptions.push({
      label: "Close Comms",
      action: () => {
        closeComms(ship)
      },
    })
  } else if (commShip.teamId == ship.teamId && commShip.groupId == ship.groupId) {
    return openWingCommands(ship, commShip)
  } else {
    communicationOptions.push({
      label: "Join my wing",
      action: () => {
        joinMyWing(ship, commShip)
      },
    })
    communicationOptions.push({
      label: "Close Comms",
      action: () => {
        closeComms(ship)
      },
    })
  }
  return communicationOptions
}

function openComms(ship: Entity, target: Entity) {
  ship.openComms = target.id
}

function closeComms(ship: Entity): void {
  world.removeComponent(ship, "openComms")
}

function requestLanding(ship: Entity, hanger: Entity) {
  debugLog(`[Comms] ship ${ship.targetName} requesting landing on ${hanger.targetName}`)
  const landing = ship.landing ?? ({} as LandingDetails)
  if (!ship.landing) {
    world.addComponent(ship, "landing", landing)
  }
  if (!landing[hanger.id]) {
    landing[hanger.id] = {} as LandingDetailsForEntity
  }
  landing[hanger.id].permisionGranted = true
  VoiceSound(barks.hangerLandingRequestGranted.ipa, hanger.voice).then((greetingSound) => {
    PlayVoiceSound(greetingSound, hanger)
  })
  closeComms(ship)
}

function tauntEnemy(ship: Entity, enemy: Entity) {
  debugLog(`[Comms] ship ${ship.targetName} taunting enemy ${enemy.targetName}`)
  shipIntelligence.taunt(ship, enemy)
  closeComms(ship)
}

function openWingCommands(wingLeader: Entity, wingMember: Entity) {
  const wingCommands = [
    {
      label: "Break and Engage",
      action: () => {
        breakAndEngage(wingLeader, wingMember)
      },
    },
    // TODO: if targeted ship is friendly change this to "Guard my target"
    {
      label: "Attack My Target",
      action: () => {
        attackMyTarget(wingLeader, wingMember)
      },
    },
    // { label: "Help Me Out", action: () => helpMeOut(wingLeader, wingMember) },
    {
      label: "Follow My Lead",
      action: () => {
        followMyLead(wingLeader, wingMember)
      },
    },
    // { label: "Retreat", action: () => retreat(wingLeader, wingMember) },
    {
      label: "Close Comms",
      action: () => {
        closeComms(wingLeader)
      },
    },
  ]

  return wingCommands
}

function closeAfterAction(ship: Entity, action: () => void) {
  action()
  closeComms(ship)
}

function joinMyWing(ship: Entity, enemy: Entity) {
  debugLog(`[Comms] ship ${ship.targetName} joining group ${enemy.targetName}`)
  shipIntelligence.joinMyWing(ship, enemy)
  closeComms(ship)
}

function breakAndEngage(wingLeader: Entity, wingMember: Entity) {
  debugLog(`[Comms] ${wingMember.targetName} breaking and engaging!`)
  shipIntelligence.breakAndEngage(wingLeader, wingMember)
}

function attackMyTarget(wingLeader: Entity, wingMember: Entity) {
  debugLog(`[Comms] ${wingMember.targetName} attacking my target!`)
  shipIntelligence.attackMyTarget(wingLeader, wingMember)
  closeComms(wingLeader)
}

function helpMeOut(wingLeader: Entity, wingMember: Entity) {
  debugLog(`[Comms] ${wingMember.targetName} helping out!`)
  shipIntelligence.attackMyTarget(wingLeader, wingMember)
  closeComms(wingLeader)
}

function followMyLead(wingLeader: Entity, wingMember: Entity) {
  debugLog(`[Comms] ${wingMember.targetName} following my lead!`)
  shipIntelligence.followMyLead(wingLeader, wingMember)
  closeComms(wingLeader)
}

function retreat(wingLeader: Entity, wingMember: Entity) {
  debugLog(`${wingMember.targetName} retreating!`)
  // Clear target, change mission to "Flee"
}
