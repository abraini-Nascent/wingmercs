import { PowerPlantModifierDetails } from "./../ships/shipTemplate"

export const HighCapPowerPlant = {
  cost: 10000,
  size: "Medium",
  type: "PowerPlant",
  weight: 1,
  powerMaxCapacity: {
    value: 1.0,
    percent: true,
  },
  name: "High Capacity Power Plant",
} as PowerPlantModifierDetails

export const HighRatePowerPlant = {
  cost: 10000,
  size: "Medium",
  type: "PowerPlant",
  weight: 1,
  powerRechargeRate: {
    value: 1.0,
    percent: true,
  },
  name: "High Rate Power Plant",
} as PowerPlantModifierDetails

export const OverChargedPowerPlant = {
  cost: 10000,
  size: "Medium",
  type: "PowerPlant",
  weight: 1,
  powerMaxCapacity: {
    value: 0.25,
    percent: true,
  },
  powerRechargeRate: {
    value: 0.25,
    percent: true,
  },
  name: "Over Charged Power Plant",
} as PowerPlantModifierDetails

export const SuperChargedPowerPlant = {
  cost: 10000,
  size: "Medium",
  type: "PowerPlant",
  weight: 1,
  powerMaxCapacity: {
    value: 0.5,
    percent: true,
  },
  powerRechargeRate: {
    value: 0.5,
    percent: true,
  },
  name: "Super Charged Power Plant",
} as PowerPlantModifierDetails

export const PowerPlantTypes = {
  HighCapPowerPlant: "HighCapPowerPlant",
  HighRatePowerPlant: "HighRatePowerPlant",
  OverChargedPowerPlant: "OverChargedPowerPlant",
  SuperChargedPowerPlant: "SuperChargedPowerPlant",
} as const

export type PowerPlantTypes = (typeof PowerPlantTypes)[keyof typeof PowerPlantTypes]
export type PowerPlants = { [powerPlant in PowerPlantTypes]: PowerPlantModifierDetails }

export const PowerPlants: PowerPlants = {
  HighCapPowerPlant: HighCapPowerPlant,
  HighRatePowerPlant: HighRatePowerPlant,
  OverChargedPowerPlant: OverChargedPowerPlant,
  SuperChargedPowerPlant: SuperChargedPowerPlant,
}
