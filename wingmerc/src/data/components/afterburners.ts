import { AfterburnerModifierDetails } from "../ships/shipTemplate";

/**
 * - consumes more fuel but has a higher top end
 * - has a higher top end but slower accelleration
 * - has a lower top end but a much faster accelleration
 * - has a lower top end and uses less fuel
 */
/** consumes more fuel but has a higher top end */
export const HotAfterburners: AfterburnerModifierDetails = {
  id: "HotAfterburners",
  name: "Hot",
  type: "Afterburner",
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
export const DragsterAfterburners = {
  id: "DragsterAfterburners",
  type: "Afterburner",
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
export const JackrabbitAfterburners = {
  id: "JackrabbitAfterburners",
  type: "Afterburner",
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
export const TurtleAfterburners = {
  id: "TurtleAfterburners",
  type: "Afterburner",
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
  HotAfterburners: "HotAfterburners",
  DragsterAfterburners: "DragsterAfterburners",
  JackrabbitAfterburners: "JackrabbitAfterburners",
  TurtleAfterburners: "TurtleAfterburners",
} as const

export type AfterburnerTypes = typeof AfterburnerTypes[keyof typeof AfterburnerTypes];
export type Afterburners = { [engineType in AfterburnerTypes]: AfterburnerModifierDetails };

export const Afterburners: Afterburners = {
  HotAfterburners: HotAfterburners,
  DragsterAfterburners: DragsterAfterburners,
  JackrabbitAfterburners: JackrabbitAfterburners,
  TurtleAfterburners: TurtleAfterburners
}