export type Weapon = {
  /** id */
  class: string,
  /** display name */
  name: string,
  /** range before dissipating */
  range: number,
  /** damage done on contact */
  damage: number,
  /** explosive force */
  force: number,
  /** delay in milliseconds */
  delay: number,
  /** time to lock in milliseconds */
  timeToLock: number,
  /** travel speed in mps */
  speed: number,
}