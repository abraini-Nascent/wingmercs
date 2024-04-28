import { queries } from "../../world"

export function powerPlantRechargeSystem(dt: number) {
  for (const entity of queries.powerPlant) {
    const { powerPlant, systems, driftActive } = entity
    if (driftActive === true) {
      // we don't recharge capacity if the ship is drifting
      continue
    }
    // scale recharge rate based on damage, min 20% charge rate
    const rate = powerPlant.rate * Math.max(0.2, systems.state.power / systems.base.power)
    powerPlant.currentCapacity += rate * (dt / 1000)
    // scale max capacity based on damage, min 20% storage
    const maxCapacity = powerPlant.maxCapacity * Math.max(0.2, systems.state.battery / systems.base.battery)
    if (powerPlant.currentCapacity > maxCapacity) {
      powerPlant.currentCapacity = maxCapacity
    }
  }
}