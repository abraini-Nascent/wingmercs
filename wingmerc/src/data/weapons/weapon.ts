export type Weapon = {
  /** id */
  class: string,
  /** type */
  type: "heatseeking" | "dumbfire" | "imagerecognition" | "friendorfoe", 
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
  /** the yaw turn rate in degrees per second */
  yaw: number,
  /** the pitch turn rate in degrees per second */
  pitch: number,
  /** the roll turn rate in degrees per second */
  roll: number,
}