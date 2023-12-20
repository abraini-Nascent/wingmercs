import { Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"

export function engineRechargeSystem(dt: number) {
  for (const entity of queries.engines) {
    const { engine } = entity
    engine.currentCapacity += engine.rate * (dt / 1000)
    if (engine.currentCapacity > engine.maxCapacity) {
      engine.currentCapacity = engine.maxCapacity
    }
  }
}