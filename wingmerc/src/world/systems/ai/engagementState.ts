import { HeadingManeuverData } from '../../../data/maneuvers/headingManeuvers';
/**
 * State of Confrontation:
 * Enemy Near -- enemy target is close by
 * Enemy Slow -- enemy target is moving slowly
 * Enemy Far -- enemy target is in the distance
 * Enemy Tailing -- enemy fighter is close behind
 * Head-to-Head -- enemy fighter approaching head on
 * On Enemy Tail -- close behind enemy target
 * Missile Incoming -- enemy missile approaches
 * Laser Hit -- fighter is hit by laser/gun fire
 * Enemy Destroyed -- fighter destroyed an enemy fighter
 * 
 * State of fighter health:
 * Little Damage -- little to no damage
 * Medium Damage -- medium damage
 * Heavy Damage -- almost destroyed
 * 
 * Defence Maneuvers:
 * Kickstop
 * Hard Brake
 * Turn and Kick
 * Burnout
 * Fish hook
 * Break Left/Right
 * Roll
 * Shake
 * Shake, Rattle, and Roll
 * Sit-'n'-Kick
 * Sit-'n'-Spin
 * Tight Loop
 * Turn-'n'-Spin
 */

export const NearDistance = 4000
export const FarDistance = 10000
export const SlowSpeed = 200

export const MissionType = {
  Destroy: "Destroy",
  Patrol: "Patrol",
  Wingman: "Wingman"
} as const;
export type MissionType = typeof MissionType[keyof typeof MissionType];

export const ObjectiveType = {
  HoldFormation: "HoldFormation",
  BreakFormation: "BreakFormation",
  /** enter the furball and pick the most oportunistic ship */
  Engage: "Engage",
  Disengage: "Disengage",
  Wander: "Wander",
  Return: "Return",
  ApproachTarget: "ApproachTarget"
} as const;
export type ObjectiveType = typeof ObjectiveType[keyof typeof ObjectiveType];

export const StateOfConfrontation = {
  EnemyNear: "EnemyNear",
  EnemySlow: "EnemySlow",
  EnemyFar: "EnemyFar",
  EnemyTailing: "EnemyTailing",
  HeadToHead: "HeadToHead",
  OnEnemyTail: "OnEnemyTail",
  MissileIncoming: "MissileIncoming",
  LaserHit: "LaserHit",
  EnemyDestroyed: "EnemyDestroyed",
} as const;
export type StateOfConfrontation = typeof StateOfConfrontation[keyof typeof StateOfConfrontation];

export const StateOfHealth = {
  LittleDamage: "LittleDamage",
  MediumDamage: "MediumDamage",
  HeavyDamage: "HeavyDamage",
} as const;
export type StateOfHealth = typeof StateOfHealth[keyof typeof StateOfHealth];

export const ManeuverType = {
  /** hard turn left and fly for 1.5 seconds, hope enemy overshoots */
  BreakLeft: "BreakLeft",
  /** hard turn right and fly for 1.5 seconds, hope enemy overshoots */
  BreakRight: "BreakRight",
  /** afterburns out of a pursuer's range or for 5 seconds and then makes a tight 180º turn to return fire */
  Burnout: "Burnout",
  Flee: "Flee",
  FishHook: "FishHook",
  HardBrake: "HardBrake",
  Intercept: "Intercept",
  Kickstop: "Kickstop",
  Roll: "Roll",
  RollAndStrafe: "RollAndStrafe",
  Shake: "Shake",
  ShakeRattleAndRoll: "ShakeRattleAndRoll",
  SitAndKick: "SitAndKick",
  // SitAndSpin: "SitAndSpin", no, this is dumb
  Strafe: "Strafe",
  Tail: "Tail",
  TightLoop: "TightLoop",
  TurnAndKick: "TurnAndKick",
  TurnAndSpin: "TurnAndSpin",
  Veer: "Veer",
} as const;
export type ManeuverType = typeof ManeuverType[keyof typeof ManeuverType];

export const OffensiveManeuvers: ManeuverType[] = ["Strafe", "RollAndStrafe", "Tail"]
export const DefensiveManeuvers: ManeuverType[] = ["BreakLeft", "BreakRight", "Burnout", "FishHook", "HardBrake", "Kickstop", "Shake", "ShakeRattleAndRoll", "TurnAndKick", "TurnAndSpin", "SitAndKick", "TightLoop"]

/**
 * The AI has three layers
 * The Top is MISSION which determins what the large scale goal of the AI and AI coordination should be
 * - examples of missions are: Patrol, Escort, Bomb Run
 * The Middle is OBJECTIVE which determins how the AI should be achieving the mission goal in the moment
 * - examples of objectives are: navigate to point, follow leader, engage enemy, flee enemy, return to base
 * The final layer is EXECUTION which determins how to execute the objective. 
 * - for example when the ai is engaged, is it strafing, dodging, or closing distance?
 * 
 * We should be able to compose a graph of these layers with reusable nodes. 
 * closing the distance to a patrol node and closing on an enemy are effectively the same
 * 
 */

// example execution layout for STRIKE objective 
export type ExecutionTree = {
  [situation in StateOfConfrontation]: 
  {
    [damage in StateOfHealth]: [weight: number, maneuver: ManeuverType[]][]
  } 
}
export const STRIKE: ExecutionTree = {
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