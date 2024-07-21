import { Gun } from "./gun"

export const neutron: Gun = Object.seal({
  /** id */
  class: "neutron",
  /** display name */
  name: "Neutron",
  /** the weight in tonnes of the gun */
  weight: 0.5,
  /** color of the trail */
  color: { r: 1 / 100, g: 98 / 100, b: 149 / 100, a: 1 },
  /** tiers */
  tiers: [
    {
      /** tier */
      tier: 0,
      /** range before dissipating */
      range: 2500,
      /** damage done on contact */
      damage: 43,
      /** energy consumer per shot */
      energy: 20,
      /** delay in milliseconds */
      delay: 350,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 10,
    },
    {
      /** tier */
      tier: 1,
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
      health: 10,
    },

    {
      /** tier */
      tier: 3,
      /** range before dissipating */
      range: 2600,
      /** damage done on contact */
      damage: 45,
      /** energy consumer per shot */
      energy: 19,
      /** delay in milliseconds */
      delay: 350,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 10,
    },
    {
      /** tier */
      tier: 3,
      /** range before dissipating */
      range: 2600,
      /** damage done on contact */
      damage: 46,
      /** energy consumer per shot */
      energy: 19,
      /** delay in milliseconds */
      delay: 350,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 10,
    },
    {
      /** tier */
      tier: 4,
      /** range before dissipating */
      range: 2600,
      /** damage done on contact */
      damage: 46,
      /** energy consumer per shot */
      energy: 18,
      /** delay in milliseconds */
      delay: 350,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 10,
    },
    {
      /** tier */
      tier: 5,
      /** range before dissipating */
      range: 2700,
      /** damage done on contact */
      damage: 47,
      /** energy consumer per shot */
      energy: 18,
      /** delay in milliseconds */
      delay: 350,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 10,
    },
  ],
})
