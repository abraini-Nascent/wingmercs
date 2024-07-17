import { FuelTankModifierDetails } from './../ships/shipTemplate';

export const ShieldedFuelTank = {
  cost: 10000,
  size: "Medium",
  name: "Shielded",
  health: {
    value: 50
  }
} as FuelTankModifierDetails

export const ExpandedFuelTank = {
  cost: 10000,
  size: "Medium",
  name: "Expanded",
  capacity: {
    value: 1,
    percent: true
  }
} as FuelTankModifierDetails

export const ReinforcedFuelTank = {
  cost: 10000,
  size: "Medium",
  name: "Reinforced",
  capacity: {
    value: .5,
    percent: true
  },
  health: {
    value: 25
  }
} as FuelTankModifierDetails

export const FuelTankTypes = {
  ShieldedFuelTank: "ShieldedFuelTank",
  ExpandedFuelTank: "ExpandedFuelTank",
  ReinforcedFuelTank: "ReinforcedFuelTank",
} as const

export type FuelTankTypes = typeof FuelTankTypes[keyof typeof FuelTankTypes];
export type FuelTanks = { [powerPlant in FuelTankTypes]: FuelTankModifierDetails };

export const FuelTanks: FuelTanks = {
  ShieldedFuelTank: ShieldedFuelTank,
  ExpandedFuelTank: ExpandedFuelTank,
  ReinforcedFuelTank: ReinforcedFuelTank,
}