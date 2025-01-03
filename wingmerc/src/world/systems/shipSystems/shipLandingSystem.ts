import { TmpVectors } from "@babylonjs/core"
import { AppContainer } from "../../../app.container"
import { Vector3FromObj } from "../../../utils/math"
import { LandingDetails, LandingDetailsForEntity, queries, world } from "../../world"
import { PlayVoiceSound, VoiceSound } from "../../../utils/speaking"
import { barks } from "../../../data/barks"
import { debugLog } from "../../../utils/debuglog"

export function shipLandingSystem(dt: number) {
  const player = AppContainer.instance.player?.playerEntity
  if (player == undefined) {
    return // no player, nothing to do
  }
  const playerPosition = Vector3FromObj(player.position, TmpVectors.Vector3[0])
  const hangers = queries.carriers
  for (const hanger of hangers) {
    const hangerPosition = Vector3FromObj(hanger.position, TmpVectors.Vector3[1])
    const distance = playerPosition.subtractToRef(hangerPosition, TmpVectors.Vector3[2]).length()
    if (distance > 5000 && player?.landing && player.landing[hanger.id]?.warned) {
      player.landing[hanger.id].lastWarned += dt
      if (player.landing[hanger.id].lastWarned > 20000) {
        player.landing[hanger.id].lastWarned = 0
        player.landing[hanger.id].warned = false
        debugLog("[ShipLandingSystem]: Now leaving automated landing zone")
      }
    } else if (distance < 2000) {
      // warning
      let landingDetails = player.landing ?? ({} as LandingDetails)
      if (player.landing == undefined) {
        world.addComponent(player, "landing", landingDetails)
      }
      let hangerDetails = landingDetails[hanger.id] ?? ({} as LandingDetailsForEntity)
      if (landingDetails[hanger.id] == undefined) {
        landingDetails[hanger.id] = hangerDetails
      }
      if (!hangerDetails.permisionGranted) {
        continue
      }
      if (hangerDetails.lastWarned == undefined || hangerDetails.lastWarned == 0 || hangerDetails.lastWarned > 20000) {
        hangerDetails.lastWarned = 0 + dt
        hangerDetails.warned = true
        VoiceSound(barks.hangerLandingWarning.ipa, hanger.voice).then((greetingSound) => {
          PlayVoiceSound(greetingSound, hanger)
        })
        debugLog("[ShipLandingSystem]: Now entering automated landing zone")
      }
    }
    if (
      distance < 1000 &&
      player?.landing &&
      player.landing[hanger.id] &&
      player.landing[hanger.id].permisionGranted &&
      !player.landing[hanger.id].landing
    ) {
      player.landing[hanger.id].landing = true
      VoiceSound(barks.hangerLanding.ipa, hanger.voice).then((greetingSound) => {
        PlayVoiceSound(greetingSound, hanger)
      })
      debugLog("[ShipLandingSystem]: Landing")
      setTimeout(() => {
        player.landing[hanger.id].landed = true
        debugLog("[ShipLandingSystem]: Landed")
      }, 1000)
    }
  }
}
