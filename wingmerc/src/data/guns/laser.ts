import { Gun } from "./gun";

export const laser: Gun = Object.seal({
  /** id */
  class: "laser",
  /** display name */
  name: "Laser Cannon",
  /** range before dissipating */
  range: 5000,
  /** damage done on contact */
  damage: 18,
  /** energy consumer per shot */
  energy: 10,
  /** delay in milliseconds */
  delay: 250,
  /** travel speed in mps */
  speed: 2000,
})