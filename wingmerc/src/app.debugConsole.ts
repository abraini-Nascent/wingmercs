import { Vector3 } from "@babylonjs/core"
import { Weapons } from "./data/weapons"
import { createLiveWeapon } from "./world/factories"
import { Entity, EntityForId, world } from "./world/world"
import { AppContainer } from "./app.container"
import { registerHit } from "./world/damage"
import { Vector3FromObj } from "./utils/math"

// Commands to run from the browser console to help with development and debugging
export class DebugConsole {
  constructor() {}
  spawnMissile(target?: string) {
    let toHit = target ?? AppContainer.instance.player.playerEntity.id
    const firingEntity: Pick<Entity, "id" | "targeting" | "rotationQuaternion" | "direction" | "rotation"> = {
      id: "",
      direction: Vector3.Forward(),
      rotationQuaternion: Vector3.Forward().toQuaternion(),
      rotation: Vector3.Forward().rotateByQuaternionToRef(Vector3.Forward().toQuaternion(), new Vector3()),
      targeting: {
        locked: true,
        missileLocked: true,
        target: toHit,
        targetingTime: 100,
        targetingDirection: { x: 0, y: 0, z: -1 },
        gunInterceptPosition: { x: 0, y: 0, z: 0, inRange: false, active: false },
      },
    }
    createLiveWeapon(Weapons.heatseeking, firingEntity, Vector3.Zero())
  }
  killEnemy() {
    let player = AppContainer.instance.player.playerEntity
    if (player.targeting.target) {
      let enemyEntity = EntityForId(player.targeting.target)
      if (enemyEntity != undefined) {
        registerHit(enemyEntity, player, Vector3FromObj(player.position), 200)
      }
    }
  }
  damagePlayer() {
    let player = AppContainer.instance.player.playerEntity
    if (player == undefined) {
      return
    }
    player.shields.currentAft = 0
    player.shields.currentFore = 0
    player.armor.front = 5
    player.armor.back = 5
    player.armor.right = 5
    player.armor.left = 5
    player.health.current = player.health.base / 5
  }
}
