import { Vector3 } from "@babylonjs/core";
import { heatseeking } from "./data/weapons";
import { createLiveWeapon } from "./world/factories";
import { Entity, world } from "./world/world";
import { AppContainer } from "./app.container";

// Commands to run from the browser console to help with development and debugging
export class DebugConsole {
  constructor() {
  }
  spawnMissile(target?: string) {
    let toHit = target ?? AppContainer.instance.player.playerEntity.id
    const firingEntity: Pick<Entity, "targeting" | "rotationQuaternion" | "direction" | "rotation" > = {
      direction: Vector3.Forward(),
      rotationQuaternion: Vector3.Forward().toQuaternion(),
      rotation: Vector3.Forward().rotateByQuaternionToRef(Vector3.Forward().toQuaternion(), new Vector3()),
      targeting: {
        locked: true,
        missileLocked: true,
        target: toHit,
        targetingTime: 100,
        targetingDirection: undefined,
        gunInterceptPosition: undefined
      }
    }
    createLiveWeapon(heatseeking, firingEntity, Vector3.Zero())
  }
  damagePlayer() {
    let player = AppContainer.instance.player.playerEntity
    if (player == undefined) { return }
    player.shields.currentAft = 0
    player.shields.currentFore = 0
    player.armor.front = 5
    player.armor.back = 5
    player.armor.right = 5
    player.armor.left = 5
    player.health.current = player.health.base / 5
  }
}