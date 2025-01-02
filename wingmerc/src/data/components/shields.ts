import { ShieldGeneratorModifierDetails } from "../ships/shipTemplate"

export const BasicShields = {
  id: "BasicShields",
  type: "Shields",
  name: "Basic Shield Booster",
  size: "Medium",
  cost: 10000,
  weight: 1,
  fore: {
    value: 5,
  },
  aft: {
    value: 5,
  },
} as ShieldGeneratorModifierDetails

export const LightningShields = {
  id: "LightningShields",
  type: "Shields",
  name: "Lightning Shields",
  size: "Medium",
  cost: 10000,
  weight: 1,
  shieldRechargeRate: {
    value: 0.15,
    percent: true,
  },
  energyDrain: {
    value: 0.1,
    percent: true,
  },
} as ShieldGeneratorModifierDetails

export const JellyShields = {
  id: "JellyShields",
  type: "Shields",
  name: "Jelly Shields",
  size: "Medium",
  cost: 10000,
  weight: 1,
  shieldRechargeRate: {
    value: -0.1,
    percent: true,
  },
  energyDrain: {
    value: -0.15,
    percent: true,
  },
} as ShieldGeneratorModifierDetails

export const SnapShields = {
  id: "SnapShields",
  type: "Shields",
  name: "SnapBack Shields",
  size: "Medium",
  cost: 10000,
  weight: 1,
  fore: {
    value: -0.25,
    percent: true,
  },
  aft: {
    value: -0.25,
    percent: true,
  },
  shieldRechargeRate: {
    value: 0.5,
    percent: true,
  },
  energyDrain: {
    value: -0.1,
    percent: true,
  },
} as ShieldGeneratorModifierDetails

export const HeavyShields = {
  id: "HeavyShields",
  type: "Shields",
  name: "Heavy Shields",
  size: "Large",
  cost: 10000,
  weight: 1,
  fore: {
    value: 0.25,
    percent: true,
  },
  aft: {
    value: 0.25,
    percent: true,
  },
  shieldRechargeRate: {
    value: -0.1,
    percent: true,
  },
  energyDrain: {
    value: 0.1,
    percent: true,
  },
} as ShieldGeneratorModifierDetails

export const ShieldTypes = {
  BasicShields: "BasicShields",
  LightningShields: "LightningShields",
  JellyShields: "JellyShields",
  SnapShields: "SnapShields",
  HeavyShields: "HeavyShields",
} as const

export type ShieldTypes = (typeof ShieldTypes)[keyof typeof ShieldTypes]
export type Shields = { [shieldType in ShieldTypes]: ShieldGeneratorModifierDetails }
export const Shields = {
  BasicShields: BasicShields,
  LightningShields: LightningShields,
  JellyShields: JellyShields,
  SnapShields: SnapShields,
  HeavyShields: HeavyShields,
}
