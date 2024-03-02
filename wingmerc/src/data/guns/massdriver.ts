import { Gun } from "./gun";

export const massdriver: Gun = Object.seal({
  /** id */
  class: "massdriver",
  /** display name */
  name: "Mass Driver",
  /** range before dissipating */
  range: 3000,
  /** damage done on contact */
  damage: 30,
  /** energy consumer per shot */
  energy: 12,
  /** delay in milliseconds */
  delay: 300,
  /** travel speed in mps */
  speed: 2000,
  /** how much damage it can take before being destroyed */
  health: 10
})