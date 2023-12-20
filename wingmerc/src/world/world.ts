import { InstancedMesh, Mesh, Node, PhysicsBody, TrailMesh, TransformNode, Vector3 } from "@babylonjs/core";
import { World } from "miniplex"
import { encode, decode } from "@msgpack/msgpack";
import { net } from "../net";
import { rotationalVelocitySystem } from "./systems/rotationalVelocitySystem";
import { ShapeType } from "@babylonjs/havok";

export type MovementCommand = { pitch: number, roll: number, yaw: number, afterburner: number, drift: number, brake: number, deltaSpeed: number }
export type FireCommand = { gun: number, weapon: number }
export type ShipEngine = {
  rate: number,
  maxCapacity: number,
  currentCapacity: number,
}
export type Entity = {
  position?: { x: number; y: number; z: number }
  velocity?: { x: number; y: number; z: number }
  afterburnerVelocity?: { x: number; y: number; z: number }
  driftVelocity?: { x: number; y: number; z: number }
  breakingPower?: number
  breakingVelocity?: { x: number; y: number; z: number }
  setSpeed?: number
  currentSpeed?: number
  acceleration?: { x: number; y: number; z: number }
  direction?: { x: number; y: number; z: number }
  rotationalVelocity?: {roll: number, pitch: number, yaw: number }
  rotationQuaternion?: {x: number; y: number; z: number; w: number}
  rotation?: {x: number; y: number; z: number}
  scale?: {x: number; y: number; z: number}
  asteroidSize?: number
  meshName?: string
  mesh?: Mesh
  meshColor?: { r: number, g: number, b: number, a: number }
  meshInstance?: InstancedMesh
  movementCommand?: MovementCommand,
  fireCommand?: FireCommand,
  trail?: true
  trailOptions?: { width: number, length: number, color: { r: number, g: number, b: number, a: number } }
  trailMesh?: TrailMesh
  bodyType?: string
  body?: PhysicsBody
  node?: TransformNode
  health?: number
  totalScore?: number
  worth?: number
  paused?: true
  playerId?: string
  originatorId?: string
  planeTemplate?: string
  // net code components
  local?: boolean // local to client
  owner?: string // who owns the state of this entity
  relinquish?: boolean // give the state of the entity to the server
  damage?: number
  guns?: {
    [gunId: number]: {
      class: string,
      delta: number,
      possition: { x: number, y: number, z: number }
    }
  }
  engine?: ShipEngine
  range?: { 
    max: number,
    total: number,
    lastPosition: { x: number; y: number; z: number },
  }
}

export const world = new World<Entity>()

/* Create some queries: */
export const queries = {
  updateRender: world.with("position", "node"),
  moving: world.with("position", "velocity", "acceleration"),
  rotating: world.with("direction", "rotation", "rotationQuaternion", "rotationalVelocity"),
  meshed: world.with("meshName"),
  physics: world.with("bodyType"),
  guns: world.with("guns"),
  engines: world.with("engine"),
  particle: world.with("range"),
  local: world.with("local"),
  players: world.with("playerId"),
  trailers: world.with("trail", "node"),
  fireCommands: world.with("fireCommand"),
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