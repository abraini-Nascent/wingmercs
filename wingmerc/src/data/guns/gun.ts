export type GunStats = {
    /** tier */
    tier: 0 | 1 | 2 | 3 | 4 | 5,
    /** range before dissipating */
    range: number,
    /** damage done on contact */
    damage: number,
    /** energy consumer per shot */
    energy: number,
    /** delay in milliseconds */
    delay: number,
    /** travel speed in mps */
    speed: number,
    /** how much damage it can take before being destroyed */
    health: number
}

export type Gun = {
  /** id */
  class: GunType,
  /** display name */
  name: string,
  /** hex color of the trail */
  color: {r: number, g: number, b: number, a: 1},
  /** stats per tier */
  tiers: GunStats[]
}

export const GunType = {
  laser: "laser",
  massdriver: "massdriver",
  neutron: "neutron",
  particleCannon: "particleCannon",
  plasma: "plasma",
} as const

export type GunType = typeof GunType[keyof typeof GunType];
export type Guns = { [gunType in GunType]: Gun };