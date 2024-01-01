import { Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"

export function shieldRechargeSystem(dt: number) {
  for (const entity of queries.shields) {
    const { shields, engine } = entity
    if (engine != undefined) {
      if (engine.currentCapacity < shields.energyDrain * (dt / 1000)) {
        continue;
      }
    }
    const recharge = shields.rechargeRate * (dt / 1000)
    shields.currentFore += recharge
    shields.currentAft += recharge
    shields.currentFore = Math.min(shields.currentFore, shields.maxFore)
    shields.currentAft = Math.min(shields.currentAft, shields.maxAft)
    if (engine != undefined) {
      engine.currentCapacity -= shields.energyDrain * (dt / 1000)
    }
  }
}