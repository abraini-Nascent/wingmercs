import { Weapon } from "./weapon";

export const heatseeking: Weapon = Object.seal({
  /** id */
  class: "heatseeking",
  /** type */
  type: "heatseeking",
  /** display name */
  name: "Heat Seeking",
  /** range before dissipating */
  range: 5000,
  /** damage done on contact */
  damage: 200,
  /** explosive force */
  force: 10000,
  /** delay in milliseconds */
  delay: 250,
  /** time to lock in milliseconds */
  timeToLock: 3000,
  /** travel speed in mps */
  speed: 1200,
})