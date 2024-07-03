import { MissionType } from './systems/ai/engagementState';
import {
  IDisposable,
  InstancedMesh,
  Mesh,
  PhysicsBody,
  TrailMesh,
  TransformNode,
  Vector3,
} from "@babylonjs/core"
import { World } from "miniplex"
import { net } from "../net"
import { AIType } from "./systems/ai/aiSystem"
import { PilotAIType } from '../data/pilotAI/pilotAI';
import { WeaponType } from '../data/weapons/weapon';
import { GunStats } from '../data/guns/gun';
import { GunAffix } from '../data/affixes/gunAffix';
import { UtilityModifierDetails } from '../data/ships/shipTemplate';
import { Voice } from '../utils/speaking';

export type MovementCommand = {
  pitch: number
  roll: number
  yaw: number
  afterburner: number
  drift: number
  brake: number
  deltaSpeed: number
}
export type FireCommand = { gun: number; weapon: number; lock: boolean }
export type ShipPowerPlant = {
  rate: number
  maxCapacity: number
  currentCapacity: number
}
export type FuelTank = {
  currentCapacity: number
  /** unit is number or seconds of afterburner on a standard afterburner */
  maxCapacity: number
}
export type ShipShields = {
  maxFore: number
  maxAft: number
  currentFore: number
  currentAft: number
  rechargeRate: number
  energyDrain: number
}
export type ShipArmor = {
  front: number
  back: number
  left: number
  right: number
  base: {
    front: number
    back: number
    left: number
    right: number
  }
}
export type ShipEngine = {
  cruiseSpeed: number;
  accelleration: number;
  maxSpeed: number;
  afterburnerAccelleration: number;
  fuelConsumeRate: number;
}
export type ShipThrusters = {
  pitch: number;
  roll: number;
  yaw: number;
  breakingForce: number;
  breakingLimit: number;
}
export type ShipGunsMount = {
  class: string
  name: string
  stats: GunStats
  modifier?: GunAffix
  ammo?: string
  delta: number
  possition: { x: number; y: number; z: number }
  currentHealth: number
}
export type ShipUtility = {
  name: string
  modifier: UtilityModifierDetails
  currentHealth: number
}
export type ShipUtilities = ShipUtility[]
export type ShipGuns = {
  mounts: { [gunId: number]: ShipGunsMount },
  selected: number,
  groups: number[][],
}
export type ShipGunAmmoCounts = { [type: string]: { base: number, current: number } }
export type ShipWeaponMount = { type: WeaponType; count: number, baseCount: number }
export type ShipWeapons = {
  mounts: ShipWeaponMount[]
  selected: number
  delta: number
}
export type ShipSystems = {
  quadrant: {
    fore: {
      system:
        | "afterburners"
        | "battery"
        | "engines"
        | "guns"
        | "power"
        | "radar"
        | "shield"
        | "targeting"
        | "thrusters"
        | "weapons"
      weight: number
    }[]
    aft: {
      system:
        | "afterburners"
        | "battery"
        | "engines"
        | "guns"
        | "power"
        | "radar"
        | "shield"
        | "targeting"
        | "thrusters"
        | "weapons"
      weight: number
    }[]
  }
  state: {
    afterburners: number
    battery: number
    engines: number
    guns: number
    power: number
    radar: number
    shield: number
    targeting: number
    thrusters: number
    weapons: number
  }
  base: {
    afterburners: number
    battery: number
    engines: number
    guns: number
    power: number
    radar: number
    shield: number
    targeting: number
    thrusters: number
    weapons: number
  }
}
export type Display = "damage" | "target" | "armor" | "weapons" | "guns"
export type VDUState = {
  left: Display
  right: Display
}
export type TargetState = {
  gunInterceptPosition: { x: number; y: number; z: number }
  targetingDirection: { x: number; y: number; z: number }
  targetingTime: number
  target: number
  locked: boolean
  missileLocked: boolean
}
export type NerdStats = {
  missilesDodged: number
  missilesEaten: number
  missilesLaunched: number
  missilesHit: number
  roundsMissed: number
  roundsHit: number
  shieldDamageTaken: number
  armorDamageTaken: number
  shieldDamageGiven: number
  armorDamageGiven: number
  afterburnerFuelSpent: number
  driftTime: number
  totalKills: number
}
export type Score = {
  total: number
  timeLeft: number
  livesLeft: number
}
export type AIBlackboard = { [key: string]: any }
export type HitsTracked = {
  hitCount: number
  hitCountRecent: number
  recentResetCountdown: number
  hits: { shooter: number; victim: number; }[]
}
export type MissionDetails = {
  mission: MissionType
  destroy?: number
  patrolPoints?: Vector3[]
}
// TODO: organize this... :S
export type Entity = {
  ai?: { type: AIType; pilot: PilotAIType, blackboard: AIBlackboard }
  teamId?: number
  groupId?: number
  wingleader?: { wingmen: number[] }
  targetName?: string
  position?: { x: number; y: number; z: number }
  velocity?: { x: number; y: number; z: number }
  afterburnerVelocity?: { x: number; y: number; z: number }
  afterburnerActive?: true
  driftActive?: true
  brakingActive?: true
  barkedSpooked?: true
  driftVelocity?: { x: number; y: number; z: number }
  breakingPower?: number
  breakingVelocity?: { x: number; y: number; z: number }
  setSpeed?: number
  currentSpeed?: number
  acceleration?: { x: number; y: number; z: number }
  direction?: { x: number; y: number; z: number }
  up?: { x: number; y: number; z: number }
  rotationalVelocity?: { roll: number; pitch: number; yaw: number }
  rotationQuaternion?: { x: number; y: number; z: number; w: number }
  rotation?: { x: number; y: number; z: number }
  scale?: { x: number; y: number; z: number }
  asteroidSize?: number
  engineMesh?: Mesh
  shieldMeshName?: string
  shieldMesh?: Mesh
  physicsMeshName?: string
  physicsMesh?: Mesh
  physicsRadius?: number
  meshName?: string
  mesh?: Mesh
  meshColor?: { r: number; g: number; b: number; a: number }
  meshInstance?: InstancedMesh
  movementCommand?: MovementCommand
  missionDetails?: MissionDetails
  nerdStats?: NerdStats
  fireCommand?: FireCommand
  trail?: true
  trailOptions?: {
    width?: number
    length?: number
    color?: { r: number; g: number; b: number }
    start?: { x: number; y: number; z: number }
  }[]
  trailMeshs?: {
    trails: TrailMesh[]
    disposables: IDisposable[]
  }
  bodyType?: "animated" | "static" | "dynamic"
  body?: PhysicsBody
  node?: TransformNode
  health?: {
    current: number
    base: number
  }
  totalScore?: number
  worth?: number
  paused?: true
  playerId?: string
  originatorId?: string
  planeTemplate?: string
  visible?: boolean
  missileEngine?: true
  // net code components
  local?: boolean // local to client
  owner?: string // who owns the state of this entity
  relinquish?: boolean // give the state of the entity to the server
  damage?: number
  targeting?: TargetState
  isTargetable?: "player" | "enemy" | "missile"
  guns?: ShipGuns
  gunAmmo?: ShipGunAmmoCounts
  weapons?: ShipWeapons
  utilities?: ShipUtilities
  engine?: ShipEngine
  powerPlant?: ShipPowerPlant
  shields?: ShipShields
  systems?: ShipSystems
  thrusters?: ShipThrusters
  fuel?: FuelTank
  systemsDamaged?: boolean
  score?: Score
  armor?: ShipArmor
  hitsTaken?: HitsTracked
  vduState?: VDUState
  deathRattle?: boolean
  voice?: Voice
  particleRange?: {
    max: number
    total: number
    lastPosition: { x: number; y: number; z: number }
  }
  missileRange?: {
    max: number
    total: number
    lastPosition: { x: number; y: number; z: number }
    type: string
    target: number
  }
  camera?: "cockpit" | "follow" | "debug"
}

export const world = new World<Entity>()

/* Create some queries: */
export const queries = {
  updateRender: world.with("position", "node"),
  moving: world.with("position", "velocity", "acceleration"),
  moveCommanded: world.with("movementCommand"),
  rotating: world.with(
    "direction",
    "rotation",
    "rotationQuaternion",
    "rotationalVelocity"
  ),
  meshed: world.with("meshName"),
  physics: world.with("node", "bodyType"),
  colliders: world.with("body"),
  guns: world.with("guns"),
  weapons: world.with("weapons"),
  powerPlant: world.with("powerPlant"),
  fuel: world.with("fuel"),
  afterburnerTrails: world.with("afterburnerActive", "trailMeshs"),
  afterburner: world.with("afterburnerActive"),
  drift: world.with("driftActive"),
  brake: world.with("brakingActive"),
  shields: world.with("shields"),
  particle: world.with("particleRange"),
  missiles: world.with("missileRange"),
  targeting: world.with("targeting"),
  local: world.with("local"),
  players: world.with("playerId"),
  trailers: world.with("trail"),
  fireCommands: world.with("fireCommand"),
  targets: world.with("isTargetable"),
  ai: world.with("ai"),
  systemsDamaged: world.with("systemsDamaged"),
  deathComes: world.with("deathRattle"),
  damageable: world.with("health"),
  cameras: world.with("camera"),
  hits: world.with("hitsTaken"),
  missileEngine: world.with("missileEngine", "node"),
}

/**
 * Game Frame serialized the game state to send over the net
 */
export class GFrame {
  /** the state of the world */
  payload: any
  constructor(client = false) {
    const toSerialize = []
    for (const entity of world.entities) {
      const id = world.id(entity)
      // if we are the client we should only send local entities to the server
      if (client) {
        if (entity.local && entity.owner != net.id) {
          // the server removed my ownership status of this entity
          // remove my local flag for it
          delete entity.local
        }
        if (entity.local !== true) {
          continue
        }
      }
      // todo we should have a better way to manage what is sent over the wire
      const payload = {
        _id: id,
        owner: entity.owner,
        relinquish: entity.relinquish,
        position: entity.position,
        velocity: entity.velocity,
        movementCommand: entity.movementCommand,
        setSpeed: entity.setSpeed,
        currentSpeed: entity.currentSpeed,
        acceleration: entity.acceleration,
        direction: entity.direction,
        rotation: {
          x: entity.rotation?.x ?? 0,
          y: entity.rotation?.y ?? 0,
          z: entity.rotation?.z ?? 0,
        },
        rotationQuaternion: entity.rotationQuaternion
          ? {
              x: entity.rotationQuaternion?.x ?? 0,
              y: entity.rotationQuaternion?.y ?? 0,
              z: entity.rotationQuaternion?.z ?? 0,
              w: entity.rotationQuaternion?.w ?? 0,
            }
          : undefined,
        rotationalVelocity: entity.rotationalVelocity
          ? {
              pitch: entity.rotationalVelocity.pitch,
              roll: entity.rotationalVelocity.roll,
              yaw: entity.rotationalVelocity.yaw,
            }
          : undefined,
        scale: entity.scale,
        asteroidSize: entity.asteroidSize,
        meshName: entity.meshName,
        bodyType: entity.bodyType,
        health: entity.health,
        worth: entity.worth,
        damage: entity.damage,
        trail: entity.trail,
        planeTemplate: entity.planeTemplate,

        originatorId: entity.originatorId,
        totalScore: entity.totalScore,
      }
      toSerialize.push(payload)
    }
    this.payload = toSerialize //encode(toSerialize)
  }
}
