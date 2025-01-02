import { StructureSlotType } from "../ships/shipTemplate"

export type Weapon = {
  /** id */
  class: WeaponType
  /** slot type */
  type: StructureSlotType
  /** weapon type */
  weaponType: WeaponType
  /** display name */
  name: string
  /** the weight in tonnes of the weapon */
  weight: number
  /** range before dissipating */
  range: number
  /** damage done on contact */
  damage: number
  /** explosive force */
  force: number
  /** delay in milliseconds */
  delay: number
  /** time to lock in milliseconds */
  timeToLock: number
  /** travel speed in mps */
  speed: number
  /** the yaw turn rate in degrees per second */
  yaw: number
  /** the pitch turn rate in degrees per second */
  pitch: number
  /** the roll turn rate in degrees per second */
  roll: number
}

export const WeaponType = {
  heatseeking: "heatseeking",
  dumbfire: "dumbfire",
  enemyDumbfire: "enemyDumbfire",
  imagerecognition: "imagerecognition",
  friendorfoe: "friendorfoe",
} as const

export type WeaponType = (typeof WeaponType)[keyof typeof WeaponType]
export type Weapons = { [gunType in WeaponType]: Weapon }
