import { StructureSlotType } from "../ships/shipTemplate"
import { gaussrifle } from "./gaussRifle"
import { literifle } from "./liteRifle"
import { mediumrifle } from "./mediumRifle"

export type GunStats = {
  /** tier */
  tier: 0 | 1 | 2 | 3 | 4 | 5
  /** range before dissipating */
  range: number
  /** damage done on contact */
  damage: number
  /** energy or ammo consumed per shot */
  energy: number
  /** delay in milliseconds */
  delay: number
  /** travel speed in mps */
  speed: number
  /** how much damage it can take before being destroyed */
  health: number
}

export type Gun = {
  /** id */
  class: GunType
  /** component slot type */
  type: StructureSlotType
  /** display name */
  name: string
  /** the weight in tonnes of the gun */
  weight: number
  /** hex color of the trail */
  color: { r: number; g: number; b: number; a: 1 }
  /** the type of ammo used */
  ammo?: string
  /** the amount of ammo per utility slot */
  ammoPerBin?: number
  /** stats per tier */
  tiers: GunStats[]
}

export const GunType = {
  laser: "laser",
  chemLaser: "chemLaser",
  massdriver: "massdriver",
  neutron: "neutron",
  particleCannon: "particleCannon",
  plasma: "plasma",
  literifle: "literifle",
  mediumrifle: "mediumrifle",
  gaussrifle: "gaussrifle",
} as const

export type GunType = (typeof GunType)[keyof typeof GunType]
export type Guns = { [gunType in GunType]: Gun }
