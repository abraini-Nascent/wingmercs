import { Weapon } from "./weapon"

export const imagerecognition: Weapon = Object.seal({
  /** id */
  class: "imagerecognition",
  /** structure slot type */
  type: "Weapon",
  /** weapon type */
  weaponType: "imagerecognition",
  /** display name */
  name: "Image Recognition",
  /** the weight in tonnes of the weapon */
  weight: 0.25,
  /** range before dissipating */
  range: 8000,
  /** damage done on contact */
  damage: 350,
  /** explosive force */
  force: 9500,
  /** delay in milliseconds */
  delay: 250,
  /** time to lock in milliseconds */
  timeToLock: 2000,
  /** travel speed in mps */
  speed: 800,
  /** the yaw turn rate in degrees per second */
  yaw: 100,
  /** the pitch turn rate in degrees per second */
  pitch: 100,
  /** the roll turn rate in degrees per second */
  roll: 100,
})
