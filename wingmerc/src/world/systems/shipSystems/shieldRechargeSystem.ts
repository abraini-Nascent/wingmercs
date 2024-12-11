import { Entity, queries } from "../../world"

const SharedPower = false
export function shieldRechargeSystem(dt: number) {
  for (const entity of queries.shields) {
    shieldRecharge(dt, entity)
  }
}

export function shieldRecharge(dt: number, entity: Entity) {
  const { shields, powerPlant, systems } = entity
  if (powerPlant != undefined) {
    if (SharedPower && powerPlant.currentCapacity < shields.energyDrain * (dt / 1000)) {
      return
    }
  }
  if (entity.inHazard && entity.inHazard.radiation) {
    // shields do not recharge inside a radiation bubble
    return
  }
  if (shields.currentAft == shields.maxAft && shields.currentFore == shields.maxFore) {
    // shields are full
    return
  }
  // recharge rate is scaled based on damage, min 50% charge rate
  // I think in WC that the max shield amounts were also scaled by damage, maybe even individually by quadrant
  // for now we will leave the max values alone
  const recharge = shields.rechargeRate * Math.max(0.5, systems.state.shield / systems.base.shield) * (dt / 1000)
  shields.currentFore += recharge
  shields.currentAft += recharge
  shields.currentFore = Math.min(shields.currentFore, shields.maxFore)
  shields.currentAft = Math.min(shields.currentAft, shields.maxAft)
  if (SharedPower && powerPlant != undefined) {
    powerPlant.currentCapacity -= shields.energyDrain * (dt / 1000)
  }
}
