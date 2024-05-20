import { AfterburnerModifierDetails } from "../ships/shipTemplate";

/**
 * - consumes more fuel but has a higher top end
 * - has a higher top end but slower accelleration
 * - has a lower top end but a much faster accelleration
 * - has a lower top end and uses less fuel
 */
/** consumes more fuel but has a higher top end */
export const LightAfterburners = {
  name: "Hot",
  size: "Medium",
  cost: 10000,
  maxSpeed: {
    value: 0.15,
    percent: true
  },
  fuelConsumeRate: {
    value: 0.1,
    percent: true
  },
} as AfterburnerModifierDetails

/** has a higher top end but slower accelleration */
export const MediumAfterburners = {
  name: "Dragster",
  size: "Medium",
  cost: 10000,
  maxSpeed: {
    value: 0.15,
    percent: true
  },
  accelleration: {
    value: -0.1,
    percent: true
  },
} as AfterburnerModifierDetails

/** has a lower top end but a much faster accelleration */
export const ThickAfterburners = {
  name: "Jackrabbit",
  size: "Medium",
  cost: 10000,
  maxSpeed: {
    value: -0.1,
    percent: true
  },
  accelleration: {
    value: 0.15,
    percent: true
  },
} as AfterburnerModifierDetails

/** has a lower top end and uses less fuel */
export const HeavyAfterburners = {
  name: "Turtle",
  size: "Large",
  cost: 10000,
  maxSpeed: {
    value: -0.1,
    percent: true
  },
  fuelConsumeRate: {
    value: -0.15,
    percent: true
  },
} as AfterburnerModifierDetails

export const AfterburnerTypes = {
  Light: "Light",
  Medium: "Medium",
  Thick: "Thick",
  Heavy: "Heavy"
} as const

export type AfterburnerTypes = typeof AfterburnerTypes[keyof typeof AfterburnerTypes];
export type Afterburners = { [engineType in AfterburnerTypes]: AfterburnerModifierDetails };

export const Afterburners: Afterburners = {
  Light: LightAfterburners,
  Medium: MediumAfterburners,
  Thick: ThickAfterburners,
  Heavy: HeavyAfterburners
}