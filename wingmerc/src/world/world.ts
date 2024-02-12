import { IDisposable, InstancedMesh, Mesh, Node, PhysicsBody, TrailMesh, TransformNode, Vector3 } from "@babylonjs/core";
import { World } from "miniplex"
import { encode, decode } from "@msgpack/msgpack";
import { net } from "../net";
import { rotationalVelocitySystem } from "./systems/rotationalVelocitySystem";
import { ShapeType } from "@babylonjs/havok";

export type MovementCommand = { pitch: number, roll: number, yaw: number, afterburner: number, drift: number, brake: number, deltaSpeed: number }
export type FireCommand = { gun: number, weapon: number, lock: boolean }
export type ShipEngine = {
  rate: number,
  maxCapacity: number,
  currentCapacity: number,
}
export type ShipShields = {
  maxFore: number,
  maxAft: number,
  currentFore: number,
  currentAft: number,
  rechargeRate: number,
  energyDrain: number,
}
export type ShipArmor = {
  front: number,
  back: number,
  left: number,
  right: number,
}
export type AIType = "basicCombat" | "demoLoop"
export type ShipSystems = {
  quadrant: {
    fore: {
      system: "afterburners"|"battery"|"engines"|"guns"|"power"|"radar"|"shield"|"targeting"|"thrusters"|"weapons",
      weight: number
    }[],
    aft: {
      system: "afterburners"|"battery"|"engines"|"guns"|"power"|"radar"|"shield"|"targeting"|"thrusters"|"weapons",
      weight: number
    }[]
  },
  state: {
    afterburners: number,
    battery: number,
    engines: number,
    guns: number,
    power: number,
    radar: number,
    shield: number,
    targeting: number,
    thrusters: number,
    weapons: number,
  },
  base: {
    afterburners: number,
    battery: number,
    engines: number,
    guns: number,
    power: number,
    radar: number,
    shield: number,
    targeting: number,
    thrusters: number,
    weapons: number,
  }
}
export type Display = "damage" | "target" | "armor" | "weapons" | "guns"
export type VDUState = {
  left: Display
  right: Display
}
export type TargetState = {
  gunInterceptPosition: { x: number, y: number, z: number }
  targetingDirection: { x: number, y: number, z: number }
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
export type Entity = {
  ai?: { type: AIType, blackboard: {[key: string]: any} }
  targetName?: string
  position?: { x: number; y: number; z: number }
  velocity?: { x: number; y: number; z: number }
  afterburnerVelocity?: { x: number; y: number; z: number }
  afterburnerActive?: boolean
  brakingActive?: boolean
  driftVelocity?: { x: number; y: number; z: number }
  breakingPower?: number
  breakingVelocity?: { x: number; y: number; z: number }
  setSpeed?: number
  currentSpeed?: number
  acceleration?: { x: number; y: number; z: number }
  direction?: { x: number; y: number; z: number }
  up?: { x: number; y: number; z: number }
  rotationalVelocity?: {roll: number, pitch: number, yaw: number }
  rotationQuaternion?: {x: number; y: number; z: number; w: number}
  rotation?: {x: number; y: number; z: number}
  scale?: {x: number; y: number; z: number}
  asteroidSize?: number
  engineMesh?: Mesh
  shieldMeshName?: string
  shieldMesh?: Mesh
  physicsMeshName?: string
  physicsMesh?: Mesh
  meshName?: string
  mesh?: Mesh
  meshColor?: { r: number, g: number, b: number, a: number }
  meshInstance?: InstancedMesh
  movementCommand?: MovementCommand
  nerdStats?: NerdStats
  fireCommand?: FireCommand
  trail?: true
  trailOptions?: { width?: number, length?: number, color?: { r: number, g: number, b: number, a: number }, start?: {x: number; y: number; z: number;} }[]
  trailMeshs?: {
    trails: TrailMesh[],
    disposables: IDisposable[]
  }
  bodyType?: "animated" | "static" | "dynamic"
  body?: PhysicsBody
  node?: TransformNode
  health?: number
  totalScore?: number
  worth?: number
  paused?: true
  playerId?: string
  originatorId?: string
  planeTemplate?: string
  visible?: boolean
  // net code components
  local?: boolean // local to client
  owner?: string // who owns the state of this entity
  relinquish?: boolean // give the state of the entity to the server
  damage?: number
  targeting?: TargetState
  isTargetable?: "player" | "enemy" | "missile"
  guns?: {
    [gunId: number]: {
      class: string,
      delta: number,
      possition: { x: number, y: number, z: number },
      currentHealth: number
    }
  }
  weapons?: {
    mounts: { type: string, count: number }[]
    selected: number
    delta: number
  }
  engine?: ShipEngine
  shields?: ShipShields
  systems?: ShipSystems
  score?: Score
  armor?: ShipArmor
  vduState?: VDUState
  deathRattle?: boolean
  particleRange?: { 
    max: number,
    total: number,
    lastPosition: { x: number; y: number; z: number },
  }
  missileRange?: { 
    max: number,
    total: number,
    lastPosition: { x: number; y: number; z: number },
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
  rotating: world.with("direction", "rotation", "rotationQuaternion", "rotationalVelocity"),
  meshed: world.with("meshName"),
  physics: world.with("node", "bodyType"),
  colliders: world.with("body"),
  guns: world.with("guns"),
  weapons: world.with("weapons"),
  engines: world.with("engine"),
  afterburnerTrails: world.with("afterburnerActive", "trailMeshs"),
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
  deathComes: world.with("deathRattle"),
  damageable: world.with("health"),
  cameras: world.with("camera")
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
        if (entity.local !== true) { continue; }
      }
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
        rotationQuaternion: entity.rotationQuaternion ? {
          x: entity.rotationQuaternion?.x ?? 0,
          y: entity.rotationQuaternion?.y ?? 0,
          z: entity.rotationQuaternion?.z ?? 0,
          w: entity.rotationQuaternion?.w ?? 0,
        } : undefined,
        rotationalVelocity: entity.rotationalVelocity ? {
          pitch: entity.rotationalVelocity.pitch,
          roll: entity.rotationalVelocity.roll,
          yaw: entity.rotationalVelocity.yaw
        } : undefined,
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
      if (entity.gun) {
        payload['gun'] = {
          delay: entity.gun.delay,
          delta: entity.gun.delta,
        }
      }
      if (entity.range) {
        payload['range'] = entity.range
      }
      toSerialize.push(payload)
    }
    this.payload = toSerialize //encode(toSerialize)
  }
}