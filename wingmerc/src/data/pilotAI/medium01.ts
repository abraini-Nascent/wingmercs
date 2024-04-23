import { DefensiveManeuvers, OffensiveManeuvers } from "../../world/systems/ai/engagementState";
import { ExecutionTree } from "./executionTree";

export const Medium01: ExecutionTree = {
  EnemyNear: {
    LittleDamage: [[40, ["Tail"]], [60, OffensiveManeuvers]],
    MediumDamage: [[70, ["Tail"]], [30, OffensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemySlow: {
    LittleDamage: [[80, ["Strafe"]], [20, ["Burnout"]]],
    MediumDamage: [[50, ["Strafe"]], [50, ["Strafe"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyFar: {
    LittleDamage: [[1, ["Intercept"]]],
    MediumDamage: [[1, ["Intercept"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyTailing: {
    LittleDamage: [[50, ["TightLoop"]], [50, DefensiveManeuvers]],
    MediumDamage: [[50, ["Roll"]], [50, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  HeadToHead: {
    LittleDamage: [[70, OffensiveManeuvers], [30, DefensiveManeuvers]],
    MediumDamage: [[60, OffensiveManeuvers], [40, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  OnEnemyTail: {
    LittleDamage: [[1, OffensiveManeuvers]],
    MediumDamage: [[1, OffensiveManeuvers]],
    HeavyDamage: [[1, OffensiveManeuvers]]
  },
  MissileIncoming: {
    LittleDamage: [[1, DefensiveManeuvers]],
    MediumDamage: [[1, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  LaserHit: {
    LittleDamage: [[50, ["Corkscrew"]], [50, DefensiveManeuvers]],
    MediumDamage: [[1, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyDestroyed: {
    LittleDamage: [[1, ["Veer"]]],
    MediumDamage: [[1, ["Veer"]]],
    HeavyDamage: [[1, ["Veer"]]]
  }
}