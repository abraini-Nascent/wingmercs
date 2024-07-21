import { Weapon } from "./weapon";

export const dumbfire: Weapon = Object.seal({
  /** id */
  class: "dumbfire",
  /** type */
  type: "dumbfire",
  /** display name */
  name: "Dumbfire",
  /** the weight in tonnes of the weapon */
  weight: 0.25,
  /** range before dissipating */
  range: 10000,
  /** damage done on contact */
  damage: 500,
  /** explosive force */
  force: 11000,
  /** delay in milliseconds */
  delay: 250,
  /** time to lock in milliseconds */
  timeToLock: 0,
  /** travel speed in mps */
  speed: 900,
  /** the yaw turn rate in degrees per second */
  yaw: 0,
  /** the pitch turn rate in degrees per second */
  pitch: 0,
  /** the roll turn rate in degrees per second */
  roll: 0
})