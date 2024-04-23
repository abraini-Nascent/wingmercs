import { DefensiveManeuvers, OffensiveManeuvers, StrafeAttacks } from "../../world/systems/ai/engagementState";
import { ExecutionTree } from "./executionTree";

export const Heavy02: ExecutionTree = {
  EnemyNear: {
    LittleDamage: [[40, ["Tail"]], [60, StrafeAttacks]],
    MediumDamage: [[40, ["Tail"]], [60, StrafeAttacks]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemySlow: {
    LittleDamage: [[1, ["SitAndFire"]]],
    MediumDamage: [[1, ["SitAndFire"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyFar: {
    LittleDamage: [[1, ["Intercept"]]],
    MediumDamage: [[1, ["Intercept"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyTailing: {
    LittleDamage: [[30, ["Burnout"]], [70, StrafeAttacks]],
    MediumDamage: [[98, DefensiveManeuvers], [2, StrafeAttacks]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  HeadToHead: {
    LittleDamage: [[100, StrafeAttacks]],
    MediumDamage: [[100, StrafeAttacks]],
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
    HeavyDamage: [[1, DefensiveManeuvers]]
  },
  LaserHit: {
    LittleDamage: [[10, ["TurnAndSpin"]], [90, DefensiveManeuvers]],
    MediumDamage: [[1, DefensiveManeuvers]],
    HeavyDamage: [[1, DefensiveManeuvers]]
  },
  EnemyDestroyed: {
    LittleDamage: [[1, ["Veer"]]],
    MediumDamage: [[1, ["Veer"]]],
    HeavyDamage: [[1, ["Veer"]]]
  }
}