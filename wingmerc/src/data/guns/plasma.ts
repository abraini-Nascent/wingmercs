import { Gun } from "./gun"

export const plasma: Gun = Object.seal({
  /** id */
  class: "plasma",
  type: "Gun",
  /** display name */
  name: "Plasma Cannon",
  /** the weight in tonnes of the gun */
  weight: 0.5,
  /** color of the trail */
  color: { r: 187 / 100, g: 30 / 100, b: 57 / 100, a: 1 },
  /** stats per tier */
  tiers: [
    {
      /** tier */
      tier: 0,
      /** range before dissipating */
      range: 3000,
      /** damage done on contact */
      damage: 60,
      /** energy consumer per shot */
      energy: 44,
      /** delay in milliseconds */
      delay: 500,
      /** travel speed in mps */
      speed: 1500,
      /** how much damage it can take before being destroyed */
      health: 10,
    },
    {
      /** tier */
      tier: 1,
      /** range before dissipating */
      range: 3000,
      /** damage done on contact */
      damage: 67,
      /** energy consumer per shot */
      energy: 44,
      /** delay in milliseconds */
      delay: 500,
      /** travel speed in mps */
      speed: 1500,
      /** how much damage it can take before being destroyed */
      health: 10,
    },
    {
      /** tier */
      tier: 2,
      /** range before dissipating */
      range: 3000,
      /** damage done on contact */
      damage: 67,
      /** energy consumer per shot */
      energy: 40,
      /** delay in milliseconds */
      delay: 500,
      /** travel speed in mps */
      speed: 1500,
      /** how much damage it can take before being destroyed */
      health: 15,
    },
    {
      /** tier */
      tier: 3,
      /** range before dissipating */
      range: 3000,
      /** damage done on contact */
      damage: 70,
      /** energy consumer per shot */
      energy: 40,
      /** delay in milliseconds */
      delay: 500,
      /** travel speed in mps */
      speed: 1500,
      /** how much damage it can take before being destroyed */
      health: 20,
    },
    {
      /** tier */
      tier: 4,
      /** range before dissipating */
      range: 3000,
      /** damage done on contact */
      damage: 70,
      /** energy consumer per shot */
      energy: 40,
      /** delay in milliseconds */
      delay: 400,
      /** travel speed in mps */
      speed: 1500,
      /** how much damage it can take before being destroyed */
      health: 25,
    },
    {
      /** tier */
      tier: 4,
      /** range before dissipating */
      range: 3000,
      /** damage done on contact */
      damage: 70,
      /** energy consumer per shot */
      energy: 40,
      /** delay in milliseconds */
      delay: 400,
      /** travel speed in mps */
      speed: 1700,
      /** how much damage it can take before being destroyed */
      health: 30,
    },
  ],
})
