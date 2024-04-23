import { ManeuverType, StateOfConfrontation, StateOfHealth } from "../../world/systems/ai/engagementState";

export type ExecutionTree = {
  [situation in StateOfConfrontation]: 
  {
    [damage in StateOfHealth]: [weight: number, maneuver: ManeuverType[]][]
  } 
}