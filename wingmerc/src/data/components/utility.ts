import { UtilityModifierDetails } from "../ships/shipTemplate"

export const AmmoUtility: UtilityModifierDetails = {
  name: "Ammo",
  cost: 1000,
  class: "Utility",
  type: "Utility",
  id: "AmmoUtility",
  weight: 1,
}

export const ShieldBank: UtilityModifierDetails = {
  name: "Shield Bank",
  cost: 1000,
  class: "Utility",
  type: "Utility",
  id: "ShieldBank",
  weight: 1,
  extraShields: {
    value: 0.1,
    percent: true,
  },
}

export const PowerBank: UtilityModifierDetails = {
  name: "Power Bank",
  cost: 1000,
  class: "Utility",
  type: "Utility",
  id: "PowerBank",
  weight: 1,
  extraEnergy: {
    value: 100,
  },
}

export const FuelTank: UtilityModifierDetails = {
  name: "Fuel Tank",
  cost: 1000,
  class: "Utility",
  type: "Utility",
  id: "FuelTank",
  weight: 1,
  extraFuel: {
    value: 100,
  },
}

export const UtilityTypes = {
  ShieldBank: "ShieldBank",
  PowerBank: "PowerBank",
} as const

export type UtilityTypes = (typeof UtilityTypes)[keyof typeof UtilityTypes]
export type Utilities = { [shieldType in UtilityTypes]: UtilityModifierDetails }
export const Utilities = {
  ShieldBank: ShieldBank,
  PowerBank: PowerBank,
  FuelTank: FuelTank,
}
