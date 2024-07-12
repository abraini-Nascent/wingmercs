import { MissionType } from './systems/ai/engagementState';
import {
  IDisposable,
  InstancedMesh,
  Mesh,
  PhysicsBody,
  Sound,
  TrailMesh,
  TransformNode,
  Vector3,
} from "@babylonjs/core"
import { World } from "miniplex"
import { net } from "./systems/netSystems/net"
import { AIType } from "./systems/ai/aiSystem"
import { PilotAIType } from '../data/pilotAI/pilotAI';
import { WeaponType } from '../data/weapons/weapon';
import { GunStats } from '../data/guns/gun';
import { GunAffix } from '../data/affixes/gunAffix';
import { UtilityModifierDetails } from '../data/ships/shipTemplate';
import { Voice } from '../utils/speaking';
import { SerializableType, SerializeAs, serialize } from '../utils/serialize';
import { generateUUIDv4 } from '../utils/random';
import { Pool } from '../utils/pool';


export type EntityUUID = string
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
  target: EntityUUID
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
  hits: { shooter: EntityUUID; victim: EntityUUID; }[]
}
export type MissionDetails = {
  mission: MissionType
  destroy?: EntityUUID
  patrolPoints?: Vector3[]
}
// TODO: organize this... :S
export type Entity = {
  // net code components
  id: EntityUUID
  local?: boolean // local to client
  owner?: string // who owns the state of this entity
  relinquish?: boolean // give the state of the entity to the server
  // end netcode components

  // AI Components
  ai?: { type: AIType; pilot: PilotAIType, blackboard: AIBlackboard }
  teamId?: number
  groupId?: number
  wingleader?: { wingmen: EntityUUID[] }
  missionDetails?: MissionDetails

  // UI Components
  targetName?: string
  camera?: "cockpit" | "follow" | "debug"
  vduState?: VDUState
  paused?: true

  // Position and Movement Components
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

  // Input Components
  movementCommand?: MovementCommand
  fireCommand?: FireCommand

  // Modeling and Rendering Components
  visible?: boolean
  scale?: { x: number; y: number; z: number }
  engineMesh?: Mesh
  shieldMeshName?: string
  shieldMesh?: Mesh
  physicsMeshName?: string
  physicsMesh?: Mesh
  physicsRadius?: number
  meshName?: string
  meshColor?: { r: number; g: number; b: number; a?: number }
  meshInstance?: InstancedMesh
  nerdStats?: NerdStats
  trail?: true
  trailOptions?: {
    width?: number
    length?: number
    color?: { r: number; g: number; b: number; a?: number }
    start?: { x: number; y: number; z: number; a?: number }
  }[]
  trailMeshs?: {
    trails: {trail: TrailMesh, node: TransformNode}[]
    disposables: IDisposable[]
  }
  bodyType?: "animated" | "static" | "dynamic"
  body?: PhysicsBody
  node?: TransformNode

  // Gameplay Stats Components
  worth?: number
  totalScore?: number
  score?: Score

  // Ship Stats Components
  health?: {
    current: number
    base: number
  }
  playerId?: string
  planeTemplate?: string
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
  armor?: ShipArmor
  hitsTaken?: HitsTracked
  deathRattle?: boolean
  voice?: Voice
  speaking?: Sound

  // Gun Particle Components
  particleRange?: {
    max: number
    total: number
    lastPosition: { x: number; y: number; z: number }
  }
  originatorId?: string
  
  // Weapon Particle Components
  missileRange?: {
    max: number
    total: number
    lastPosition: { x: number; y: number; z: number }
    type: string
    target: EntityUUID
  }
  missileEngine?: true
  damage?: number
}

export const world = new World<Entity>()
export const worldIds = new Map<string, Partial<Entity>>()
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
export const CreateEntity = (entity: Partial<Entity>): Entity => {
  if (entity.id == undefined) {
    const uuid = generateUUIDv4()
    entity.id = uuid
    worldIds.set(uuid, entity)
  } else {
    worldIds.set(entity.id, entity)
  }
  world.add(entity as Entity)
  return entity as Entity
}
export const HandoffEntity = (entity: Entity): Entity => {
  entity.local = true
  entity.relinquish = true
  entity.owner = net.id
  return entity
}
export const LocalEntity = (entity: Entity): Entity => {
  entity.local = true
  entity.owner = net.id
  return entity
}
export const EntityForId = (id: string) => {
  return worldIds.get(id) as Entity
}
world.onEntityRemoved.subscribe((entity) => {
  worldIds.delete(entity.id)
})

const DeepCloneTransform = (value) => { return structuredClone(value) }
SerializableType("GFrame")
// net code components
SerializeAs("GFrame", "id")
// SerializeAs("GFrame", "local") // local belongs to the client only
SerializeAs("GFrame", "owner")
SerializeAs("GFrame", "relinquish")

// world code

// AI Components
// SerializeAs("GFrame", "ai") ai is handled by the server
SerializeAs("GFrame", "teamId")
SerializeAs("GFrame", "groupId")
SerializeAs("GFrame", "wingleader")
SerializeAs("GFrame", "missionDetails")

// UI Components
SerializeAs("GFrame", "targetName")
SerializeAs("GFrame", "vduState")
SerializeAs("GFrame", "paused")

// Position and Movement Components
SerializeAs("GFrame", "position")
SerializeAs("GFrame", "velocity")
SerializeAs("GFrame", "afterburnerVelocity")
SerializeAs("GFrame", "afterburnerActive")
SerializeAs("GFrame", "driftActive")
SerializeAs("GFrame", "brakingActive")
SerializeAs("GFrame", "barkedSpooked")
SerializeAs("GFrame", "driftVelocity")
SerializeAs("GFrame", "breakingPower")
SerializeAs("GFrame", "breakingVelocity")
SerializeAs("GFrame", "setSpeed")
SerializeAs("GFrame", "currentSpeed")
SerializeAs("GFrame", "acceleration")
SerializeAs("GFrame", "direction")
SerializeAs("GFrame", "up")
SerializeAs("GFrame", "rotationalVelocity")
SerializeAs("GFrame", "rotationQuaternion")
SerializeAs("GFrame", "rotation")

// Input Components
SerializeAs("GFrame", "movementCommand")
SerializeAs("GFrame", "fireCommand")

// Modeling and Rendering Components
// SerializeAs("GFrame", "visible") // only used in local game to hide cockpit
SerializeAs("GFrame", "scale")
SerializeAs("GFrame", "shieldMeshName")
SerializeAs("GFrame", "physicsMeshName")
SerializeAs("GFrame", "physicsRadius")
SerializeAs("GFrame", "bodyType")
SerializeAs("GFrame", "meshName")
SerializeAs("GFrame", "meshColor")
SerializeAs("GFrame", "nerdStats")
SerializeAs("GFrame", "trail")
SerializeAs("GFrame", "trailOptions", DeepCloneTransform)

// Ship Stats Components
SerializeAs("GFrame", "health")
SerializeAs("GFrame", "totalScore")
SerializeAs("GFrame", "worth")
SerializeAs("GFrame", "planeTemplate")
SerializeAs("GFrame", "targeting")
SerializeAs("GFrame", "isTargetable")
SerializeAs("GFrame", "guns")
SerializeAs("GFrame", "gunAmmo")
SerializeAs("GFrame", "weapons")
SerializeAs("GFrame", "utilities")
SerializeAs("GFrame", "engine")
SerializeAs("GFrame", "powerPlant")
SerializeAs("GFrame", "shields")
SerializeAs("GFrame", "systems")
SerializeAs("GFrame", "thrusters")
SerializeAs("GFrame", "fuel")
SerializeAs("GFrame", "systemsDamaged")
SerializeAs("GFrame", "score")
SerializeAs("GFrame", "armor")
SerializeAs("GFrame", "hitsTaken")
SerializeAs("GFrame", "deathRattle")
SerializeAs("GFrame", "voice")

// Weapon and Particle Components
SerializeAs("GFrame", "originatorId")
SerializeAs("GFrame", "particleRange")
SerializeAs("GFrame", "missileRange")
SerializeAs("GFrame", "missileEngine")
SerializeAs("GFrame", "damage")

/**
 * Game Frame serialized the game state to send over the net
 */
export class GFrame {
  /** the state of the world */
  payload: any
  constructor(client = false) {
    const toSerialize = []
    for (const entity of world.entities) {
      const id = entity.id
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
      let framePayload = serialize("GFrame", entity)
      framePayload["_id"] = id

      toSerialize.push(framePayload)
    }
    this.payload = toSerialize //encode(toSerialize)
  }
}

/**
 *       const payload = {
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
 */