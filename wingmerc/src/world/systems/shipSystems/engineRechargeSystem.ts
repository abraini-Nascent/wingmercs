import { queries } from "../../world"

export function engineRechargeSystem(dt: number) {
  for (const entity of queries.engines) {
    const { engine, systems, driftActive } = entity
    if (driftActive === true) {
      // we don't recharge capacity if the ship is drifting
      continue
    }
    // scale recharge rate based on damage, min 20% charge rate
    const rate = engine.rate * Math.max(0.2, systems.state.power / systems.base.power)
    engine.currentCapacity += rate * (dt / 1000)
    // scale max capacity based on damage, min 20% storage
    const maxCapacity = engine.maxCapacity * Math.max(0.2, systems.state.battery / systems.base.battery)
    if (engine.currentCapacity > maxCapacity) {
      engine.currentCapacity = maxCapacity
    }
  }
}