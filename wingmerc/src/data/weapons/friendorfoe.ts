import { Weapon } from "./weapon";

export const friendorfoe: Weapon = Object.seal({
  /** id */
  class: "friendorfoe",
  /** type */
  type: "friendorfoe",
  /** display name */
  name: "Friend or For",
  /** range before dissipating */
  range: 12000,
  /** damage done on contact */
  damage: 400,
  /** explosive force */
  force: 9500,
  /** delay in milliseconds */
  delay: 250,
  /** time to lock in milliseconds */
  timeToLock: 3000,
  /** travel speed in mps */
  speed: 800,
  /** the yaw turn rate in degrees per second */
  yaw: 200,
  /** the pitch turn rate in degrees per second */
  pitch: 200,
  /** the roll turn rate in degrees per second */
  roll: 200
})