import * as Guns from './../../data/guns';
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { firstOrderIntercept } from "../../utils/math"
import { Gun } from '../../data/guns/gun';


const TARGET_LOCK_SPEED = 120 // degrees per second
export function missileTargetingSystem(dt: number) {
  for (const entity of queries.targeting) {
    const { targeting, direction, position, rotationQuaternion } = entity

    if (targeting.targetLocked == -1) {
      // move to the front of the plane
      targeting.targetingDirection = { x: direction.x, y: direction.y, z: direction.z }
      targeting.targetingTime = 0
      targeting.gunInterceptPosition = undefined
      world.update(entity, "targeting", targeting)
      continue
    }
    const targetEntity = world.entity(targeting.targetLocked)
    if (targetEntity == undefined) {
      targeting.targetLocked = -1
      targeting.targetingDirection = { x: direction.x, y: direction.y, z: direction.z }
      targeting.targetingTime = 0
      targeting.gunInterceptPosition = undefined
      world.update(entity, "targeting", targeting)
      continue
    }
    const targetPosition = new Vector3(targetEntity.position.x, targetEntity.position.y, targetEntity.position.z)
    // check if target is within locking cone
    const entityPosition = new Vector3(position.x, position.y, position.z)
    const entityDirection = new Vector3(direction.x, direction.y, direction.z)
    const targetDirection = targetPosition.subtract(entityPosition).normalize()
    targetDirection.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion).invert())
    const delta = AngleBetweenVectors(Vector3.Forward(true), targetDirection)
    if (ToDegree(delta) > 45) {
      // target is out of cone of fire, reset
      targeting.targetingDirection = { x: direction.x, y: direction.y, z: direction.z }
      targeting.targetingTime = 0
      targeting.gunInterceptPosition = undefined
      world.update(entity, "targeting", targeting)
      continue
    }
    // start adding time to target lock
    targeting.targetingTime += dt
    const missileLocked = targeting.targetingTime > 3000 // three seconds to lock, this should come from the selected weapon
    targeting.missileLocked = missileLocked

    // calculate time to intercept
    const gunInterceptPosition = firstOrderIntercept(
      Vector3FromObj(entity.position),
      Vector3FromObj(entity.velocity),
      Vector3FromObj(targetEntity.position),
      Vector3FromObj(targetEntity.velocity),
      (Guns[entity.guns[0].class] as Gun).speed)
    targeting.gunInterceptPosition = gunInterceptPosition
    
    //// old radar tracking code to move from current targetingDirection towards target
    // let targetingDirection = Vector3FromObj(targeting.targetingDirection)
    // const angle = ToRadians(TARGET_LOCK_SPEED) * dt / 1000
    // const rotationMatrix = Matrix.RotationAxis(targetPosition.subtract(entityPosition).normalize(), angle);
    // targetingDirection.rotateByQuaternionToRef(Quaternion.FromRotationMatrix(rotationMatrix), targetDirection)
    // targeting.targetingDirection.x = targetingDirection.x
    // targeting.targetingDirection.y = targetingDirection.y
    // targeting.targetingDirection.z = targetingDirection.z

    // console.log("[Targeting] detla vs angle", ToDegree(delta), ToDegree(angle))
    // const missileLocked = AngleBetweenVectors(targetPosition.subtract(entityPosition).normalize(), targetingDirection.normalize()) <= angle
    // targeting.missileLocked = missileLocked
    if (missileLocked) {
      // console.log("[TARGETING] missile locked!")
    }
    world.update(entity, "targeting", targeting)
  }
}

function QuaternionFromObj(obj: {x: number, y: number, z: number, w: number}): Quaternion {
  return new Quaternion(obj.x, obj.y, obj.z, obj.w);
}

function Vector3FromObj(obj: {x: number, y: number, z: number}): Vector3 {
  return new Vector3(obj.x, obj.y, obj.z)
}

function ToDegree(radians: number): number {
  return radians * 180 / Math.PI
}

function ToRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// unsigned angle in radians between two vectors, smallest possible angle, between 0 and 180
function AngleBetweenVectors(vector1: Vector3, vector2: Vector3): number {
  // Calculate the dot product of normalized vectors
  const dotProduct = Vector3.Dot(vector1.normalize(), vector2.normalize());

  // Ensure dot product is within valid range [-1, 1]
  const clampedDotProduct = clamp(dotProduct, -1, 1);

  // Calculate the angle in radians using the arc cosine
  const angleRadians = Math.acos(clampedDotProduct);

  return angleRadians;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}