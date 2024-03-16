import { queries } from "../../world"

export function gunCooldownSystem(dt: number) {
  for (const entity of queries.guns) {
    const { guns } = entity
    for (const [gunIndex, gun] of Object.entries(guns.mounts)) {
      gun.delta -= dt
      if (gun.delta < 0) {
        gun.delta = 0
      }
    }
  }
  for (const entity of queries.weapons) {
    const { weapons } = entity
    weapons.delta -= dt
    if (weapons.delta < 0) {
      weapons.delta = 0
    }
  }
}