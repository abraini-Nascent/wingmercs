import { Gun } from "./gun"

export const mediumrifle: Gun = Object.seal({
  /** id */
  class: "mediumrifle",
  type: "Gun",
  /** display name */
  name: "Medium Rifle",
  /** the weight in tonnes of the gun */
  weight: 1,
  ammo: "medium rifle round",
  ammoPerBin: 140, // ~3500 damage per bin
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
      damage: 25,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 1000,
      /** travel speed in mps */
      speed: 10000,
      /** how much damage it can take before being destroyed */
      health: 25,
    },
    {
      /** tier */
      tier: 1,
      /** range before dissipating */
      range: 3000,
      /** damage done on contact */
      damage: 25,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 1000,
      /** travel speed in mps */
      speed: 10000,
      /** how much damage it can take before being destroyed */
      health: 25,
    },
    {
      /** tier */
      tier: 2,
      /** range before dissipating */
      range: 3100,
      /** damage done on contact */
      damage: 25,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 1000,
      /** travel speed in mps */
      speed: 10000,
      /** how much damage it can take before being destroyed */
      health: 25,
    },
    {
      /** tier */
      tier: 3,
      /** range before dissipating */
      range: 3200,
      /** damage done on contact */
      damage: 27,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 800,
      /** travel speed in mps */
      speed: 10000,
      /** how much damage it can take before being destroyed */
      health: 25,
    },
    {
      /** tier */
      tier: 4,
      /** range before dissipating */
      range: 3300,
      /** damage done on contact */
      damage: 29,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 800,
      /** travel speed in mps */
      speed: 10000,
      /** how much damage it can take before being destroyed */
      health: 25,
    },
    {
      /** tier */
      tier: 5,
      /** range before dissipating */
      range: 3500,
      /** damage done on contact */
      damage: 33,
      /** energy consumer per shot */
      energy: 10,
      /** delay in milliseconds */
      delay: 800,
      /** travel speed in mps */
      speed: 10000,
      /** how much damage it can take before being destroyed */
      health: 25,
    },
  ],
})
