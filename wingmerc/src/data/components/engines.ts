import { EngineModifierDetails } from "../ships/shipTemplate";

export const BasicEngines = {
  id: "BasicEngines",
  type: "Engine",
  name: "Basic Engines",
  size: "Medium",
  cost: 10000,
  weight: 1,
  cruiseSpeed: {
    value: 0.1
  },
  accelleration: {
    value: 0.1
  }
} as EngineModifierDetails

export const LightEngines = {
  id: "LightEngines",
  type: "Engine",
  name: "Light Engines",
  size: "Medium",
  cost: 10000,
  weight: 1,
  cruiseSpeed: {
    value: 0.1
  },
  accelleration: {
    value: 0.1
  }
} as EngineModifierDetails

export const MediumEngines = {
  id: "MediumEngines",
  type: "Engine",
  name: "Medium Engines",
  size: "Medium",
  cost: 10000,
  weight: 1,
  accelleration: {
    value: 0.25
  }
} as EngineModifierDetails

export const ThickEngines = {
  id: "ThickEngines",
  type: "Engine",
  name: "Thick Engines",
  size: "Medium",
  cost: 10000,
  weight: 1,
  cruiseSpeed: {
    value: -0.1
  },
  accelleration: {
    value: 0.5
  }
} as EngineModifierDetails

export const HeavyEngines = {
  id: "HeavyEngines",
  type: "Engine",
  name: "Heavy Engines",
  size: "Large",
  cost: 10000,
  weight: 1,
  health: {
    value: 0.5
  },
  cruiseSpeed: {
    value: 0.5
  },
} as EngineModifierDetails

export const EngineTypes = {
  BasicEngines: "BasicEngines",
  LightEngines: "LightEngines",
  MediumEngines: "MediumEngines",
  ThickEngines: "ThickEngines",
  HeavyEngines: "HeavyEngines",
} as const

export type EngineTypes = typeof EngineTypes[keyof typeof EngineTypes];
export type Engines = { [engineType in EngineTypes]: EngineModifierDetails };
export const Engines = {
  BasicEngines: BasicEngines,
  LightEngines: LightEngines,
  MediumEngines: MediumEngines,
  ThickEngines: ThickEngines,
  HeavyEngines: HeavyEngines,
}