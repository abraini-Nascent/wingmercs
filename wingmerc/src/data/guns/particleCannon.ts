import { Gun } from "./gun";

export const particleCannon: Gun = Object.seal({
  /** id */
  class: "particleCannon",
  /** display name */
  name: "Particle Cannon",
  /** color of the trail */
  color: {r: 187/100, g: 30/100, b: 57/100, a: 1},
  /** stats per tier */
  tiers: [{
      /** tier */
      tier: 0,
      /** range before dissipating */
      range: 3500,
      /** damage done on contact */
      damage: 37,
      /** energy consumer per shot */
      energy: 11,
      /** delay in milliseconds */
      delay: 500,
      /** travel speed in mps */
      speed: 1000,
      /** how much damage it can take before being destroyed */
      health: 10
    },
    {
      /** tier */
      tier: 1,
      /** range before dissipating */
      range: 3500,
      /** damage done on contact */
      damage: 43,
      /** energy consumer per shot */
      energy: 11,
      /** delay in milliseconds */
      delay: 500,
      /** travel speed in mps */
      speed: 1100,
      /** how much damage it can take before being destroyed */
      health: 13
    },
    {
      /** tier */
      tier: 2,
      /** range before dissipating */
      range: 3700,
      /** damage done on contact */
      damage: 44,
      /** energy consumer per shot */
      energy: 11,
      /** delay in milliseconds */
      delay: 500,
      /** travel speed in mps */
      speed: 1100,
      /** how much damage it can take before being destroyed */
      health: 13
    },
    {
      /** tier */
      tier: 3,
      /** range before dissipating */
      range: 3700,
      /** damage done on contact */
      damage: 44,
      /** energy consumer per shot */
      energy: 11,
      /** delay in milliseconds */
      delay: 450,
      /** travel speed in mps */
      speed: 1100,
      /** how much damage it can take before being destroyed */
      health: 15
    },
    {
      /** tier */
      tier: 4,
      /** range before dissipating */
      range: 3700,
      /** damage done on contact */
      damage: 44,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 450,
      /** travel speed in mps */
      speed: 1100,
      /** how much damage it can take before being destroyed */
      health: 17
    },
    {
      /** tier */
      tier: 5,
      /** range before dissipating */
      range: 3700,
      /** damage done on contact */
      damage: 45,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 450,
      /** travel speed in mps */
      speed: 1200,
      /** how much damage it can take before being destroyed */
      health: 20
    }
  ]
})