import { EntityUUID } from "../../world/world";

export const MissionType = {
  Destroy: "Destroy",
  Patrol: "Patrol",
  Wingman: "Wingman",
  Escorted: "Escorted",
} as const;
export type MissionType = typeof MissionType[keyof typeof MissionType];

export interface LocationPoint {
  /** A unique id number so we can reference this location point */
  id: number
  /** Name of the navigation point */
  name: string
  /** Indicates if this is a navigation point the player can auto-fly to */
  isNavPoint: boolean
  /** Indicates that this is the position that the player starts at */
  isEntryPoint?: true
  /** Indicates that this is the position that the player exists at */
  isExitPoint?: true
  /** Position of the navigation point on the map */
  position: { x: number; y: number; z: number }
}

export type MissionDetails = {
  mission: MissionType
  destroy?: EntityUUID
  missionLocations?: LocationPoint[]
}

export type ObjectiveDetails = {
  visitedLocations?: LocationPoint[]
  objectivesComplete?: Objective[]
}

export type SubObjectiveTypes =
  | "Escort"
  | "Repair"
  | "Destroy"
  | "Defend"
  | "Navigate"
export type Targets =
  | "Waypoints"
  | "Repair Ship"
  | "Capital Ship"
  | "Enemy Fighters"
export interface SubObjective {
  /** A unique id number so we can reference this sub objective */
  id: number
  /** Sub-objective type (e.g., "Escort", "Repair", "Destroy", "Defend") */
  type: SubObjectiveTypes
  /** Any encounters that a required to pass to complete the objective */
  encounters?: number[]
  /** Target of the sub-objective (e.g., "Waypoints", "Capital Ship", "Enemy Fighters") */
  target: Targets
  /** Amount of targets (for destroy or defend objectives) */
  amount?: number
  /** Specific location for the sub-objective (e.g., "Nav Point 1") */
  location?: LocationPoint
}

export interface Objective {
  /** A unique id number so we can reference this objective */
  id: number
  /** Any encounters that a required to pass to complete the objective */
  encounters?: number[]
  /** Description of the objective */
  description: string
  /** Sequence of sub-objectives */
  steps: SubObjective[]
}
export type EncounterType = "Fighter" | "Bomber" | "Capital Ship" | "Cargo"
export type EncounterFormation = "V-Formation" | "Line" | "Random"
export type EncounterTeam = "Friendly" | "Neutral" | "Enemy"
export interface Encounter {
  /** unique id for the encounter so we can keep track of it */
  id: number
  /** Type of enemy ship (e.g., "Fighter", "Bomber", "Capital Ship") */
  shipClass: string
  /** Number of enemies */
  quantity: number
  /** Formation type (e.g., "V-Formation", "Line", "Random") */
  formation: EncounterFormation
  /** Team ID to denote friendly, neutral, or enemy (e.g., "Friendly", "Neutral", "Enemy") */
  teamId: EncounterTeam
  /** Location point where the encounter occurs */
  location: LocationPoint
  /** The mission the ships at the encounter should be running */
  missionDetails: MissionDetails
}

export type EnvironmentHazard = "Asteroids" | "Nebula" | "Radiation"
export interface Environment {
  /** Location type (e.g., "Asteroid Field", "Deep Space", "Planetary Orbit") */
  location: LocationPoint
  /** Environmental hazards (e.g., "Asteroids", "Nebula", "Radiation") */
  hazards?: EnvironmentHazard[]
}

export interface Mission {
  /** Briefing text for the mission */
  briefing: string
  /** Map of navigation points */
  locations: LocationPoint[]
  /** Map of navigation points */
  navigationOrder: LocationPoint[]
  /** Array of encounters during the mission */
  encounters: Encounter[]
  /** Array of mission objectives */
  objectives: Objective[]
  /** Environment settings for the mission */
  environment: Environment[]
  /** Reward for completing the mission */
  reward: number
}

export interface Campaign {
  /**  Array of missions in the a campaign */
  missions: Mission[]
}

// example mission:

const missionLocationPoints = {
  spawn: {
    id: 1,
    name: "Jump Point",
    isEntryPoint: true,
    isExitPoint: true,
    position: { x: 200000, y: 0, z: 100000 },
    isNavPoint: true,
  } as LocationPoint,
  nav1: {
    id: 2,
    name: "Nav Point 1",
    position: { x: 100000, y: 0, z: 100000 },
    isNavPoint: true,
  },
  nav2: {
    id: 3,
    name: "Nav Point 2",
    position: { x: -100000, y: 0, z: -100000 },
    isNavPoint: true,
  },
  ast1: {
    id: 4,
    name: "Asteroid Field",
    position: { x: 0, y: 0, z: 0 },
    isNavPoint: false,
  },
}

export const exampleMultiStepMission: Mission = {
  briefing:
    "Escort the repair ship to Nav Point 1, then ensure it completes repairs on the capital ship at Nav Point 2.",
  locations: Object.values(missionLocationPoints),
  navigationOrder: [
    missionLocationPoints.nav1,
    missionLocationPoints.nav2
  ],
  encounters: [
    {
      id: 1,
      shipClass: "LiteCarrier",
      quantity: 1,
      formation: "Line",
      teamId: "Friendly",
      location: missionLocationPoints.spawn,
      missionDetails: {
        mission: "Escorted",
        missionLocations: [
          missionLocationPoints.nav1,
          missionLocationPoints.nav2
        ]
      }
    },
    {
      id: 2,
      shipClass: "EnemyLight01",
      quantity: 3,
      formation: "V-Formation",
      teamId: "Enemy",
      location: missionLocationPoints.nav2,
      missionDetails: { 
        mission: "Patrol", 
        missionLocations: [
          missionLocationPoints.nav2
        ] 
      },
    },
    {
      id: 3,
      shipClass: "EnemyMedium02",
      quantity: 2,
      formation: "Line",
      teamId: "Enemy",
      location: missionLocationPoints.nav2,
      missionDetails: { 
        mission: "Destroy", 
        missionLocations: [
          missionLocationPoints.nav1
        ] 
      },
    },
  ],
  objectives: [
    {
      id: 1,
      description: "Escort and Repair",
      steps: [
        {
          id: 1,
          type: "Escort",
          target: "Repair Ship",
          location: missionLocationPoints.nav1,
        },
        {
          id: 2,
          type: "Defend",
          target: "Repair Ship",
          location: missionLocationPoints.nav2,
          encounters: [2]
        },
        {
          id: 3,
          type: "Repair",
          target: "Capital Ship",
          location: missionLocationPoints.nav2,
        },
      ],
    },
  ],
  environment: [
    // {
    //   location: missionLocationPoints.ast1,
    //   hazards: ["Asteroids"],
    // },
  ],
  reward: 10000,
}
