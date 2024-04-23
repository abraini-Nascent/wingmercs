import { ExecutionTree } from "./executionTree";
import { Heavy01 } from "./heavy01";
import { Heavy02 } from "./heavy02";
import { Light01 } from "./light01";
import { Medium01 } from "./medium01";
import { Medium02 } from "./medium02";

export const PilotAIType = {
  "Light01": "Light01",
  "Medium01": "Medium01",
  "Medium02": "Medium02",
  "Heavy01": "Heavy01",
  "Heavy02": "Heavy02",
} as const
export type PilotAIType = typeof PilotAIType[keyof typeof PilotAIType];

export const PilotAIs = {
  "Light01": Light01,
  "Medium01": Medium01,
  "Medium02": Medium02,
  "Heavy01": Heavy01,
  "Heavy02": Heavy02,
} as {[pilotType in PilotAIType]: ExecutionTree}