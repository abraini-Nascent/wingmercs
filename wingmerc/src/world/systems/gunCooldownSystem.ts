import { Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"

export function gunCooldownSystem(dt: number) {
  for (const entity of queries.guns) {
    const { guns } = entity
    for (const [gunIndex, gun] of Object.entries(guns)) {
      gun.delta -= dt
      if (gun.delta < 0) {
        gun.delta = 0
      }
    }
  }
}