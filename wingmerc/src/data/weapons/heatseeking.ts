import { Weapon } from "./weapon"

export const heatseeking: Weapon = Object.seal({
  /** id */
  class: "heatseeking",
  /** structure slot type */
  type: "Weapon",
  /** weapon type */
  weaponType: "heatseeking",
  /** display name */
  name: "Heat Seeking",
  /** the weight in tonnes of the weapon */
  weight: 0.25,
  /** range before dissipating */
  range: 9000,
  /** damage done on contact */
  damage: 200,
  /** explosive force */
  force: 10000,
  /** delay in milliseconds */
  delay: 250,
  /** time to lock in milliseconds */
  timeToLock: 3000,
  /** travel speed in mps */
  speed: 800,
  /** the yaw turn rate in degrees per second */
  yaw: 100,
  /** the pitch turn rate in degrees per second */
  pitch: 100,
  /** the roll turn rate in degrees per second */
  roll: 100,
})
