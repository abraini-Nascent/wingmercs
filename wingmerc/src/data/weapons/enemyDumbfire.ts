import { Weapon } from "./weapon";

export const enemyDumbfire: Weapon = Object.seal({
  /** id */
  class: "enemyDumbfire",
  /** type */
  type: "dumbfire",
  /** display name */
  name: "EnemyDumbfire",
  /** range before dissipating */
  range: 5000,
  /** damage done on contact */
  damage: 150,
  /** explosive force */
  force: 10000,
  /** delay in milliseconds */
  delay: 250,
  /** time to lock in milliseconds */
  timeToLock: 0,
  /** travel speed in mps */
  speed: 1000,
})