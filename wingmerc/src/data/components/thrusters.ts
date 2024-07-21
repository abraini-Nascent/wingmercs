import { ThrustersModifierDetails } from './../ships/shipTemplate';

export const HighRoller = {
  cost: 10000,
  size: "Medium",
  name: "HighRoller",
  roll: {
    value: 360
  }
} as ThrustersModifierDetails

export const Overdrive = {
  cost: 10000,
  size: "Medium",
  name: "Overdrive",
  weight: 1,
  roll: {
    value: 0.25,
    percent: true
  },
  pitch: {
    value: 0.25,
    percent: true
  },
  yaw: {
    value: 0.25,
    percent: true
  },
} as ThrustersModifierDetails

export const HardReverse = {
  cost: 10000,
  size: "Medium",
  name: "Hard Reverse",
  weight: 1,
  breakingForce: {
    value: 1,
    percent: true
  },
  breakingLimit: {
    value: 1,
    percent: true
  }
} as ThrustersModifierDetails

export const Reinforced = {
  cost: 10000,
  size: "Medium",
  name: "Reinforced",
  weight: 1,
  health: {
    value: 50
  }
} as ThrustersModifierDetails

export const ThrusterTypes = {
  HighRoller: "HighRoller",
  Overdrive: "Overdrive",
  HardReverse: "HardReverse",
  Reinforced: "Reinforced",
} as const

export type ThrusterTypes = typeof ThrusterTypes[keyof typeof ThrusterTypes];
export type Thrusters = { [powerPlant in ThrusterTypes]: ThrustersModifierDetails };

export const Thrusters: Thrusters = {
  HighRoller: HighRoller,
  Overdrive: Overdrive,
  HardReverse: HardReverse,
  Reinforced: Reinforced
}