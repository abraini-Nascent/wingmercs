import { FuelTankModifierDetails } from "./../ships/shipTemplate"

export const ShieldedFuelTank = {
  cost: 10000,
  size: "Medium",
  type: "FuelTank",
  name: "Shielded Fuel Tank",
  weight: 1,
  extraHealth: {
    value: 50,
  },
} as FuelTankModifierDetails

export const ExpandedFuelTank = {
  cost: 10000,
  size: "Medium",
  type: "FuelTank",
  name: "Expanded Fuel Tank",
  weight: 1,
  fuelCapacity: {
    value: 1,
    percent: true,
  },
} as FuelTankModifierDetails

export const ReinforcedFuelTank = {
  cost: 10000,
  size: "Medium",
  type: "FuelTank",
  name: "Reinforced Fuel Tank",
  weight: 1,
  fuelCapacity: {
    value: 0.5,
    percent: true,
  },
  extraHealth: {
    value: 25,
  },
} as FuelTankModifierDetails

export const FuelTankTypes = {
  ShieldedFuelTank: "ShieldedFuelTank",
  ExpandedFuelTank: "ExpandedFuelTank",
  ReinforcedFuelTank: "ReinforcedFuelTank",
} as const

export type FuelTankTypes = (typeof FuelTankTypes)[keyof typeof FuelTankTypes]
export type FuelTanks = { [powerPlant in FuelTankTypes]: FuelTankModifierDetails }

export const FuelTanks: FuelTanks = {
  ShieldedFuelTank: ShieldedFuelTank,
  ExpandedFuelTank: ExpandedFuelTank,
  ReinforcedFuelTank: ReinforcedFuelTank,
}
