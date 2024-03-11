import { queries, world } from "../world"

export function shieldRechargeSystem(dt: number) {
  for (const entity of queries.shields) {
    const { shields, engine, systems } = entity
    if (engine != undefined) {
      if (engine.currentCapacity < shields.energyDrain * (dt / 1000)) {
        continue;
      }
    }
    if (shields.currentAft == shields.maxAft && shields.currentFore == shields.maxFore) {
      // shields are full
      continue;
    }
    // recharge rate is scaled based on damage, min 20% charge rate
    // I think in WC that the max shield amounts were also scaled by damage, maybe even individually by quadrant
    // for now we will leave the max values alone
    const recharge = shields.rechargeRate * Math.max(0.2, systems.state.shield / systems.base.shield ) * (dt / 1000)
    shields.currentFore += recharge
    shields.currentAft += recharge
    shields.currentFore = Math.min(shields.currentFore, shields.maxFore)
    shields.currentAft = Math.min(shields.currentAft, shields.maxAft)
    if (engine != undefined) {
      engine.currentCapacity -= shields.energyDrain * (dt / 1000)
    }
  }
}