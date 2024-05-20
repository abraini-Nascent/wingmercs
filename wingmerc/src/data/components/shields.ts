import { ShieldGeneratorModifierDetails } from "../ships/shipTemplate";

export const BasicShields = {
  name: "Basic Shield Booster",
  size: "Medium",
  cost: 10000,
  fore: {
    value: 5
  },
  aft: {
    value: 5
  }
} as ShieldGeneratorModifierDetails

export const LightShields = {
  name: "Lightning Shields",
  size: "Medium",
  cost: 10000,
  rechargeRate: {
    value: 0.15,
    percent: true
  },
  energyDrain: {
    value: 0.1,
    percent: true
  },
} as ShieldGeneratorModifierDetails

export const MediumShields = {
  name: "Jelly Shields",
  size: "Medium",
  cost: 10000,
  rechargeRate: {
    value: -0.1,
    percent: true
  },
  energyDrain: {
    value: -0.15,
    percent: true
  },
} as ShieldGeneratorModifierDetails

export const ThickShields = {
  name: "SnapBack Shields",
  size: "Medium",
  cost: 10000,
  fore: {
    value: -0.25,
    percent: true
  },
  aft: {
    value: -0.25,
    percent: true
  },
  rechargeRate: {
    value: 0.5,
    percent: true
  },
  energyDrain: {
    value: -0.10,
    percent: true
  },
} as ShieldGeneratorModifierDetails

export const HeavyShields = {
  name: "Heavy Shields",
  size: "Large",
  cost: 10000,
  fore: {
    value: 0.25,
    percent: true
  },
  aft: {
    value: 0.25,
    percent: true
  },
  rechargeRate: {
    value: -0.10,
    percent: true
  },
  energyDrain: {
    value: 0.10,
    percent: true
  },
} as ShieldGeneratorModifierDetails

export const ShieldTypes = {
  Basic: "Basic",
  Light: "Light",
  Medium: "Medium",
  Thick: "Thick",
  Heavy: "Heavy"
} as const

export type ShieldTypes = typeof ShieldTypes[keyof typeof ShieldTypes];
export type Shields = { [shieldType in ShieldTypes]: ShieldGeneratorModifierDetails }