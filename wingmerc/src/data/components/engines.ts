import { EngineModifierDetails } from "../ships/shipTemplate";

export const BasicEngines = {
  name: "Basic Engines",
  size: "Medium",
  cost: 10000,
  cruiseSpeed: {
    value: 0.1
  },
  accelleration: {
    value: 0.1
  }
} as EngineModifierDetails

export const LightEngines = {
  name: "Light Engines",
  size: "Medium",
  cost: 10000,
  cruiseSpeed: {
    value: 0.1
  },
  accelleration: {
    value: 0.1
  }
} as EngineModifierDetails

export const MediumEngines = {
  name: "Medium Engines",
  size: "Medium",
  cost: 10000,
  accelleration: {
    value: 0.25
  }
} as EngineModifierDetails

export const ThickEngines = {
  name: "Thick Engines",
  size: "Medium",
  cost: 10000,
  cruiseSpeed: {
    value: -0.1
  },
  accelleration: {
    value: 0.5
  }
} as EngineModifierDetails

export const HeavyEngines = {
  name: "Heavy Engines",
  size: "Large",
  cost: 10000,
  health: {
    value: 0.5
  },
  cruiseSpeed: {
    value: 0.5
  },
} as EngineModifierDetails

export const EngineTypes = {
  Basic: "Basic",
  Light: "Light",
  Medium: "Medium",
  Thick: "Thick",
  Heavy: "Heavy"
} as const

export type EngineTypes = typeof EngineTypes[keyof typeof EngineTypes];
export type Engines = { [engineType in EngineTypes]: EngineModifierDetails };