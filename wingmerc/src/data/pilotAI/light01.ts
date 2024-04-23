import { DefensiveManeuvers, OffensiveManeuvers } from "../../world/systems/ai/engagementState";
import { ExecutionTree } from "./executionTree";

export const Light01: ExecutionTree = {
  EnemyNear: {
    LittleDamage: [[70, ["Tail"]], [30, OffensiveManeuvers]],
    MediumDamage: [[80, ["Tail"]], [20, OffensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemySlow: {
    LittleDamage: [[80, ["Strafe"]], [20, ["Burnout"]]],
    MediumDamage: [[50, ["Strafe"]], [50, ["Tail"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyFar: {
    LittleDamage: [[1, ["Intercept"]]],
    MediumDamage: [[1, ["Intercept"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyTailing: {
    LittleDamage: [[90, ["BreakLeft"]], [10, DefensiveManeuvers]],
    MediumDamage: [[90, ["BreakLeft"]], [10, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  HeadToHead: {
    LittleDamage: [[50, OffensiveManeuvers], [50, DefensiveManeuvers]],
    MediumDamage: [[80, OffensiveManeuvers], [20, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  OnEnemyTail: {
    LittleDamage: [[1, OffensiveManeuvers]],
    MediumDamage: [[1, OffensiveManeuvers]],
    HeavyDamage: [[1, OffensiveManeuvers]]
  },
  MissileIncoming: {
    LittleDamage: [[1, DefensiveManeuvers]],
    MediumDamage: [[80, ["BreakLeft"]], [20, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  LaserHit: {
    LittleDamage: [[1, DefensiveManeuvers]],
    MediumDamage: [[25, ["BreakLeft"]], [75, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyDestroyed: {
    LittleDamage: [[1, ["Veer"]]],
    MediumDamage: [[1, ["Veer"]]],
    HeavyDamage: [[1, ["Veer"]]]
  }
}