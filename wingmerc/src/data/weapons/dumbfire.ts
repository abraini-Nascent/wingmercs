import { Weapon } from "./weapon";

export const dumbfire: Weapon = Object.seal({
  /** id */
  class: "dumbfire",
  /** display name */
  name: "Dumbfire",
  /** range before dissipating */
  range: 5000,
  /** damage done on contact */
  damage: 500,
  /** explosive force */
  force: 10000,
  /** delay in milliseconds */
  delay: 250,
  /** time to lock in milliseconds */
  timeToLock: 0,
  /** travel speed in mps */
  speed: 1000,
})