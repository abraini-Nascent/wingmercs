import { UtilityModifierDetails } from "../ships/shipTemplate";

export const AmmoUtility: UtilityModifierDetails = {
  name: "Ammo",
  type: "Utility",
  id: "AmmoUtility",
  weight: 1,
}

export const ShieldBank: UtilityModifierDetails = {
  name: "Shield Bank",
  type: "Utility",
  id: "ShieldBank",
  weight: 1,
  shields: {
    value: 0.1,
    percent: true
  }
}

export const PowerBank: UtilityModifierDetails = {
  name: "Power Bank",
  type: "Utility",
  id: "PowerBank",
  weight: 1,
  energy: {
    value: 100
  }
}

export const FuelTank: UtilityModifierDetails = {
  name: "Fuel Tank",
  type: "Utility",
  id: "FuelTank",
  weight: 1,
  fuel: {
    value: 100
  }
}

export const UtilityTypes = {
  ShieldBank: "ShieldBank",
  PowerBank: "PowerBank",
} as const

export type UtilityTypes = typeof UtilityTypes[keyof typeof UtilityTypes];
export type Utilities = { [shieldType in UtilityTypes]: UtilityModifierDetails }
export const Utilities = {
  ShieldBank: ShieldBank,
  PowerBank: PowerBank,
  FuelTank: FuelTank
}