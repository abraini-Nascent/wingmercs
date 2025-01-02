import { Gun } from "./gun"

export const massdriver: Gun = Object.seal({
  /** id */
  class: "massdriver",
  type: "Gun",
  /** display name */
  name: "Mass Driver",
  /** the weight in tonnes of the gun */
  weight: 0.5,
  /** color of the trail */
  color: { r: 78 / 100, g: 92 / 100, b: 95 / 100, a: 1 },
  /** stats per tier */
  tiers: [
    {
      /** tier */
      tier: 0,
      /** range before dissipating */
      range: 3000,
      /** damage done on contact */
      damage: 28,
      /** energy consumer per shot */
      energy: 12,
      /** delay in milliseconds */
      delay: 300,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 10,
    },
    {
      /** tier */
      tier: 1,
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
      health: 10,
    },
    {
      /** tier */
      tier: 2,
      /** range before dissipating */
      range: 3100,
      /** damage done on contact */
      damage: 30,
      /** energy consumer per shot */
      energy: 11,
      /** delay in milliseconds */
      delay: 300,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 14,
    },
    {
      /** tier */
      tier: 3,
      /** range before dissipating */
      range: 3200,
      /** damage done on contact */
      damage: 31,
      /** energy consumer per shot */
      energy: 11,
      /** delay in milliseconds */
      delay: 300,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 16,
    },
    {
      /** tier */
      tier: 4,
      /** range before dissipating */
      range: 3100,
      /** damage done on contact */
      damage: 31,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 300,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 18,
    },
    {
      /** tier */
      tier: 5,
      /** range before dissipating */
      range: 3200,
      /** damage done on contact */
      damage: 32,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 300,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 20,
    },
  ],
})
