import { queries } from "../world"

export function fuelConsumptionSystem(dt: number) {
  for (const entity of queries.fuel) {
    const { afterburnerActive, systems, fuel } = entity
    if (afterburnerActive == undefined) {
      // we don't consume fuel unless we are running the afterburner
      continue
    }
    // scale burn rate based on damage, min 20% burn rate
    // TODO burn rate should come from the afterburner quality
    const rate = 1 * Math.max(0.2, (systems?.state.afterburners ?? 100) / (systems?.base.afterburners ?? 100))
    const newFuel = Math.max(0, fuel.currentCapacity - (rate * (dt / 1000)))
    fuel.currentCapacity = newFuel
  }
}