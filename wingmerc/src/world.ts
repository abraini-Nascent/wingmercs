import { InstancedMesh, Mesh, Node } from "@babylonjs/core";
import { World } from "miniplex"
import { encode, decode } from "@msgpack/msgpack";

export type Entity = {
  position?: { x: number; y: number; z: number }
  velocity?: { x: number; y: number; z: number }
  acceleration?: { x: number; y: number; z: number }
  direction?: { x: number; y: number; z: number }
  rotationQuaternion?: {x: number; y: number; z: number; w: number}
  rotation?: {x: number; y: number; z: number}
  meshName?: string
  mesh?: Mesh
  meshInstance?: InstancedMesh
  node?: Node
  health?: number
  paused?: true
}

export const world = new World<Entity>()


/**
 * Game Frame serialized the game state to send over the net
 */
export class GFrame {
  /** the state of the world */
  payload: any
  constructor() {
    const toSerialize = []
    for (const entity of world.entities) {
      const id = world.id(entity)
      toSerialize.push({
        _id: id,
        position: entity.position,
        velocity: entity.velocity,
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
        } : null,
        meshName: entity.meshName,
        health: entity.health
      })
    }
    this.payload = toSerialize //encode(toSerialize)
  }
}