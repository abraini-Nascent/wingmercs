import { DefensiveManeuvers, OffensiveManeuvers, StrafeAttacks } from "../../world/systems/ai/engagementState";
import { ExecutionTree } from "./executionTree";

export const Medium02: ExecutionTree = {
  EnemyNear: {
    LittleDamage: [[80, ["Tail"]], [20, StrafeAttacks]],
    MediumDamage: [[80, ["Tail"]], [20, StrafeAttacks]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemySlow: {
    LittleDamage: [[80, StrafeAttacks], [20, ["Burnout"]]],
    MediumDamage: [[50, StrafeAttacks], [50, ["Tail"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyFar: {
    LittleDamage: [[1, ["Intercept"]]],
    MediumDamage: [[1, ["Intercept"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyTailing: {
    LittleDamage: [[60, DefensiveManeuvers], [40, OffensiveManeuvers]],
    MediumDamage: [[60, DefensiveManeuvers], [40, OffensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  HeadToHead: {
    LittleDamage: [[70, StrafeAttacks], [30, ["Veer"]]],
    MediumDamage: [[70, StrafeAttacks], [30, ["Veer"]]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  OnEnemyTail: {
    LittleDamage: [[1, StrafeAttacks]],
    MediumDamage: [[1, OffensiveManeuvers]],
    HeavyDamage: [[1, OffensiveManeuvers]]
  },
  MissileIncoming: {
    LittleDamage: [[1, DefensiveManeuvers]],
    MediumDamage: [[1, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  LaserHit: {
    LittleDamage: [[50, StrafeAttacks], [50, DefensiveManeuvers]],
    MediumDamage: [[1, DefensiveManeuvers]],
    HeavyDamage: [[1, ["Flee"]]]
  },
  EnemyDestroyed: {
    LittleDamage: [[1, ["Veer"]]],
    MediumDamage: [[1, ["Veer"]]],
    HeavyDamage: [[1, ["Veer"]]]
  }
}