export type Gun = {
  /** id */
  class: GunType,
  /** display name */
  name: string,
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

export const GunType = {
  laser: "laser",
  massdriver: "massdriver",
  neutron: "neutron",
} as const

export type GunType = typeof GunType[keyof typeof GunType];
export type Guns = { [gunType in GunType]: Gun };