import { Gun } from "./gun";

export const neutron: Gun = Object.seal({
  /** id */
  class: "neutron",
  /** display name */
  name: "Neutron",
  /** range before dissipating */
  range: 2500,
  /** damage done on contact */
  damage: 45,
  /** energy consumer per shot */
  energy: 20,
  /** delay in milliseconds */
  delay: 350,
  /** travel speed in mps */
  speed: 2000,
  /** how much damage it can take before being destroyed */
  health: 10
})