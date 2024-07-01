import { Gun } from "./gun";

export const chemLaser: Gun = Object.seal({
  /** id */
  class: "chemLaser",
  /** display name */
  name: "Chemical Laser Cannon",
  ammo: "chemLaser",
  ammoPerBin: 200,
  /** color of the trail */
  color: {r: 187/100, g: 30/100, b: 57/100, a: 1},
  /** stats per tier */
  tiers: [{
      /** tier */
      tier: 0,
      /** range before dissipating */
      range: 4800,
      /** damage done on contact */
      damage: 16,
      /** energy consumer per shot */
      energy: 8,
      /** delay in milliseconds */
      delay: 250,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 8
    },
    {
      /** tier */
      tier: 1,
      /** range before dissipating */
      range: 4800,
      /** damage done on contact */
      damage: 18,
      /** energy consumer per shot */
      energy: 8,
      /** delay in milliseconds */
      delay: 250,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 10
    },
    {
      /** tier */
      tier: 2,
      /** range before dissipating */
      range: 4800,
      /** damage done on contact */
      damage: 18,
      /** energy consumer per shot */
      energy: 7.5,
      /** delay in milliseconds */
      delay: 250,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 12
    },
    {
      /** tier */
      tier: 3,
      /** range before dissipating */
      range: 4900,
      /** damage done on contact */
      damage: 19,
      /** energy consumer per shot */
      energy: 7.5,
      /** delay in milliseconds */
      delay: 250,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 13
    },
    {
      /** tier */
      tier: 4,
      /** range before dissipating */
      range: 4900,
      /** damage done on contact */
      damage: 19,
      /** energy consumer per shot */
      energy: 7,
      /** delay in milliseconds */
      delay: 250,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 14
    },
    {
      /** tier */
      tier: 5,
      /** range before dissipating */
      range: 5000,
      /** damage done on contact */
      damage: 20,
      /** energy consumer per shot */
      energy: 7,
      /** delay in milliseconds */
      delay: 250,
      /** travel speed in mps */
      speed: 2000,
      /** how much damage it can take before being destroyed */
      health: 15
    }
  ]
})