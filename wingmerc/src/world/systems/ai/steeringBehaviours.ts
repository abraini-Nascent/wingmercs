import { Entity, Origin, world } from "./../../world"
import {
  Curve3,
  GreasedLineBaseMesh,
  LinesMesh,
  Mesh,
  MeshBuilder,
  Quaternion,
  TmpVectors,
  Vector3,
} from "@babylonjs/core"
import {
  AngleBetweenVectors,
  DegreeToRadian,
  QuaternionFromObj,
  ToRadians,
  Vector3FromObj,
  closestPointOnCurve,
  closestPointOnLineSegment,
  firstOrderIntercept,
} from "../../../utils/math"
import { AppContainer } from "../../../app.container"
import { totalVelocityFrom } from "../../helpers"
import { GunStats } from "../../../data/guns/gun"
import { randFloat } from "../../../utils/random"

const PlanarUp = Vector3.Up()
/** the steering error (-180 to 180 degrees) is clamped to -90 to 90 and normalized to -1 to 1, an error of < 1 degree is clamped to 0 */
export function SteeringHardNormalizeClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  // console.log("[SteeringHardNormalizeClamp] error", { pitch, roll, yaw})
  // remove less than 1 degree
  pitch = Math.abs(pitch) <= Math.PI / 180 ? 0 : pitch
  yaw = Math.abs(yaw) <= Math.PI / 180 ? 0 : yaw
  roll = Math.abs(roll) <= Math.PI / 180 ? 0 : roll
  // clamp
  pitch = clamp(pitch, -Math.PI / 2, Math.PI / 2)
  yaw = clamp(yaw, -Math.PI / 2, Math.PI / 2)
  roll = clamp(roll, -Math.PI / 2, Math.PI / 2)
  // console.log("[SteeringHardNormalizeClamp] clamp", { pitch, roll, yaw})
  // normalize
  pitch = pitch / (Math.PI / 2)
  yaw = yaw / (Math.PI / 2)
  roll = roll / (Math.PI / 2)
  // console.log("[SteeringHardNormalizeClamp] normalize", { pitch, roll, yaw})

  return { pitch, roll, yaw }
}
/** the steering error (-180 to 180 degrees) is normalized to -1 to 1, an error of < 1 degree is clamped to 0 */
export function SteeringSoftNormalizeClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  pitch = Math.abs(pitch) <= Math.PI / 180 ? 0 : pitch
  yaw = Math.abs(yaw) <= Math.PI / 180 ? 0 : yaw
  roll = Math.abs(roll) <= Math.PI / 180 ? 0 : roll
  pitch = pitch / Math.PI
  yaw = yaw / Math.PI
  roll = roll / Math.PI

  return { pitch, roll, yaw }
}
/** if the steering error is greater than 1 degree a full turn command is given */
export function SteeringHardTurnClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  pitch = Math.abs(pitch) > Math.PI / 180 ? (pitch < 0 ? -1 : 1) : 0
  yaw = Math.abs(yaw) > Math.PI / 180 ? (yaw < 0 ? -1 : 1) : 0
  roll = Math.abs(roll) > Math.PI / 180 ? (roll < 0 ? -1 : 1) : 0

  if (yaw != 0 || pitch != 0) {
    roll = 0
  }
  return { pitch, roll, yaw }
}
export type SteeringResult = {
  pitch: number
  roll: number
  yaw: number
  throttle?: number
  boost?: boolean
  firePosition?: boolean
}

export function calculateErrorSteering(
  _dt: number,
  error: Vector3,
  currentRotation: Quaternion,
  clampStrategy?: (input: SteeringResult) => SteeringResult
): SteeringResult {
  error = error.applyRotationQuaternion(Quaternion.Inverse(currentRotation)) // transform to local space

  let errorDirection = error.normalizeToNew()
  let pitchError = new Vector3(0, error.y, error.z).normalize()
  let rollError = new Vector3(error.x, error.y, 0).normalize()
  let yawError = new Vector3(error.x, 0, error.z).normalize()

  let pitch = signedAngle(Vector3.Forward(true), pitchError, Vector3.Right()) * -1 // pitch is inverted
  let yaw = signedAngle(Vector3.Forward(true), yawError, Vector3.Up())
  let roll = signedAngle(Vector3.Up(), rollError, Vector3.Forward(true))
  // we need to clamp from -1 to 1
  if (clampStrategy != undefined) {
    return clampStrategy({ pitch, roll, yaw })
  }
  pitch = clampInput(pitch)
  yaw = clampInput(yaw)
  roll = clampInput(roll)
  if (Math.floor(pitch * 100) == 0) {
    pitch = 0
  }
  if (Math.floor(roll * 100) == 0) {
    roll = 0
  }
  if (Math.floor(yaw * 100) == 0) {
    yaw = 0
  }

  return { pitch, roll, yaw }
}

export function calculateSteering(
  dt: number,
  currentPosition: Vector3,
  currentRotation: Quaternion,
  targetPosition: Vector3,
  clampStrategy?: (input: SteeringResult) => SteeringResult
): SteeringResult {
  let error = targetPosition.subtract(currentPosition)
  error = error.applyRotationQuaternion(Quaternion.Inverse(currentRotation)) // transform to local space

  return calculateErrorSteering(dt, error, currentRotation, clampStrategy)
}

export namespace SteeringBehaviours {
  /** steer the character towards a specified position in global space */
  export function seek(
    _dt: number,
    currentPosition: Vector3,
    currentRotation: Quaternion,
    targetPosition: Vector3,
    targetUp?: Vector3,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult {
    let error = targetPosition.subtract(currentPosition)
    error = error.applyRotationQuaternion(Quaternion.Inverse(currentRotation)) // transform to local space

    let errorDirection = error.normalizeToNew()
    let pitchError = new Vector3(0, error.y, error.z).normalize()
    let rollError = new Vector3(error.x, error.y, 0).normalize()
    let yawError = new Vector3(error.x, 0, error.z).normalize()

    // if there is a target up, use that as the roll error
    if (targetUp != undefined) {
      let currentUp = Vector3.Up()
      currentUp.rotateByQuaternionToRef(currentRotation, currentUp)
      let upError = targetUp.subtract(currentUp).normalize()
      rollError.set(upError.x, upError.y, 0)
    }

    let pitch = signedAngle(Vector3.Forward(true), pitchError, Vector3.Right()) * -1 // pitch is inverted
    let yaw = signedAngle(Vector3.Forward(true), yawError, Vector3.Up())
    let roll = signedAngle(Vector3.Up(), rollError, Vector3.Forward(true))
    // we need to clamp from -1 to 1
    if (clampStrategy != undefined) {
      return clampStrategy({ pitch, roll, yaw })
    }
    pitch = clampInput(pitch)
    yaw = clampInput(yaw)
    roll = clampInput(roll)
    if (Math.floor(pitch * 100) == 0) {
      pitch = 0
    }
    if (Math.floor(roll * 100) == 0) {
      roll = 0
    }
    if (Math.floor(yaw * 100) == 0) {
      yaw = 0
    }

    return { pitch, roll, yaw }
  }
  /** simply the inverse of seek */
  export function flee(
    dt: number,
    currentPosition: Vector3,
    currentRotation: Quaternion,
    targetPosition: Vector3,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult {
    let seekSteering = seek(dt, currentPosition, currentRotation, targetPosition, PlanarUp, clampStrategy)
    return {
      pitch: seekSteering.pitch * -1,
      roll: seekSteering.roll * -1,
      yaw: seekSteering.yaw * -1,
    }
  }
  /** similar to seek except that the quarry (target) is another moving character */
  export function pursuit(
    dt: number,
    entity: Entity,
    targetEntity: Entity,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult {
    const currentPosition = Vector3FromObj(entity.position)
    const currentRotation = QuaternionFromObj(entity.rotationQuaternion)
    const targetUp = Vector3FromObj(targetEntity.up)
    const targetInterceptPosition =
      firstOrderIntercept(
        currentPosition,
        Vector3FromObj(entity.velocity),
        Vector3FromObj(targetEntity.position),
        Vector3FromObj(targetEntity.velocity),
        Vector3FromObj(entity.velocity).length()
      ) ?? Vector3FromObj(targetEntity.position)
    return seek(dt, currentPosition, currentRotation, targetInterceptPosition, targetUp, clampStrategy)
  }
  /** similar to pursuit except that the intercept uses the gun speed instead of ship speed */
  export function gunPursuit(
    dt: number,
    entity: Entity,
    targetEntity: Entity,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult {
    const currentPosition = Vector3FromObj(entity.position)
    const currentDirection = Vector3FromObj(entity.direction)
    const currentRotation = QuaternionFromObj(entity.rotationQuaternion)
    const targetUp = Vector3FromObj(targetEntity.up)
    const gunGroup = entity.guns.groups[entity.guns.selected]
    if (gunGroup == undefined) {
      return pursuit(dt, entity, targetEntity, clampStrategy)
    }
    let gunsSpeed = 0
    for (let mountIdx of gunGroup) {
      const gun = entity.guns.mounts[mountIdx].stats as GunStats
      gunsSpeed += gun.speed / gunGroup.length
    }
    gunsSpeed = Math.round(gunsSpeed)
    const targetInterceptPosition =
      firstOrderIntercept(
        currentPosition,
        Vector3FromObj(entity.velocity),
        Vector3FromObj(targetEntity.position),
        Vector3FromObj(targetEntity.velocity),
        gunsSpeed
      ) ?? Vector3FromObj(targetEntity.position)
    const directionToIntercept = targetInterceptPosition
      .subtractToRef(currentPosition, TmpVectors.Vector3[0])
      .normalizeToRef(TmpVectors.Vector3[0])
    const angleToIntercept = AngleBetweenVectors(currentDirection, directionToIntercept)
    // console.log(`[SteeringBehaviours] Ship ${entity.id} angle to intercept`, ToDegree(angleToIntercept))
    const firePosition = angleToIntercept < ToRadians(2.5)
    const result = seek(dt, currentPosition, currentRotation, targetInterceptPosition, targetUp, clampStrategy)
    result.firePosition = firePosition
    return result
  }
  /** analogous to pursuit, except that flee is used to steer away from the predicted future position of the target character */
  export function evasion(
    dt: number,
    entity: Entity,
    targetEntity: Entity,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult {
    const pursuitSteering = pursuit(dt, entity, targetEntity, clampStrategy)
    return {
      pitch: pursuitSteering.pitch * -1,
      roll: pursuitSteering.roll * -1,
      yaw: pursuitSteering.yaw * -1,
    }
  }
  const firstOrderInterceptDebugBoxes: Mesh[] = []
  const offsetPursuitDebugBoxes: Mesh[] = []
  /** steering a path which passes near, but not directly into a moving target */
  export function offsetPursuit(
    dt: number,
    entity: Entity,
    targetEntity: Entity,
    offset: Vector3,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult {
    const currentPosition = Vector3FromObj(entity.position)
    const targetRotation = QuaternionFromObj(targetEntity.rotationQuaternion)
    const targetInterceptPosition =
      firstOrderIntercept(
        currentPosition,
        Vector3FromObj(entity.velocity),
        Vector3FromObj(targetEntity.position),
        Vector3FromObj(targetEntity.velocity),
        Vector3FromObj(entity.velocity).length()
      ) ?? Vector3FromObj(targetEntity.position) // is this right?
    if (AppContainer.instance.debug) {
      let mesh = firstOrderInterceptDebugBoxes[entity.id]
      if (mesh == undefined) {
        mesh = MeshBuilder.CreateBox("firstOrderInterceptPosition", { size: 1 })
        firstOrderInterceptDebugBoxes[entity.id] = mesh
      }
      mesh.position.copyFrom(targetInterceptPosition)
    }

    const offsetPosition = calculateOffsetTargetPosition(targetInterceptPosition, targetRotation, offset)
    if (AppContainer.instance.debug) {
      let mesh = offsetPursuitDebugBoxes[entity.id]
      if (mesh == undefined) {
        mesh = MeshBuilder.CreateBox("offsetPursuitOffsetPosition", { size: 1 })
        offsetPursuitDebugBoxes[entity.id] = mesh
      }
      mesh.position.copyFrom(offsetPosition)
    }
    return arrival(dt, entity, offsetPosition, 500, 150, clampStrategy)
  }

  /** instead of moving through the target at full speed, this behavior causes the character to slow down as it approaches the target */
  export function arrival(
    dt: number,
    entity: Entity,
    targetPosition: Vector3,
    maxSpeed: number,
    slowingDistance: number,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult {
    const currentPosition = Vector3FromObj(entity.position)
    const currentRotation = QuaternionFromObj(entity.rotationQuaternion)
    const velocity = totalVelocityFrom(entity)
    const targetSpeed = arrivalSpeed(currentPosition, targetPosition, velocity, maxSpeed, slowingDistance)
    const steering = seek(dt, currentPosition, currentRotation, targetPosition, PlanarUp, clampStrategy)
    const distancetoTarget = currentPosition.subtract(targetPosition).length()
    steering.throttle = targetSpeed - entity.currentSpeed
    if (distancetoTarget > 1000) {
      steering.boost = true
    }
    return steering
  }

  /** Maneuver in a cluttered environment by dodging around obstacles
   * @returns undefined if nothing to avoid, SteeringResult if obstacle is in the way
   */
  export function obstacleAvoidance(
    _dt: number,
    entity: Entity,
    targets: Entity[],
    /** distance to obstacles to avoid */
    avoidanceDistance: number,
    /** radius around entity to keep clear, image a gerbal in a ball */
    avoidanceRadius: number
  ): SteeringResult | undefined {
    const entityPosition = Vector3FromObj(entity.position)
    const closestTarget: [number, Entity, Vector3] = [Number.MIN_VALUE, undefined, undefined]
    const targetDistances = {} as any
    // find the closest point along the direction of travel
    const origin = Origin()
    const rayStart = Vector3FromObj(entity.position)
    let direction = new Vector3(0, 0, -1)
    direction = direction.applyRotationQuaternion(QuaternionFromObj(entity.rotationQuaternion))
    const rayEnd = rayStart.add(
      Vector3FromObj(direction).multiplyByFloats(avoidanceDistance, avoidanceDistance, avoidanceDistance)
    )
    for (const target of targets) {
      const targetPosition = Vector3FromObj(target.position)

      const distanceToTarget =
        entityPosition.subtract(targetPosition).length() - entity.physicsRadius - target.physicsRadius
      targetDistances[target.id] = distanceToTarget
      if (distanceToTarget > avoidanceDistance) {
        continue
      }

      const closestPointOnCylinder = closestPointOnLineSegment(Vector3FromObj(target.position), rayStart, rayEnd)
      const vectorToCenter = closestPointOnCylinder.subtract(targetPosition)
      const distanceToCenter = vectorToCenter.length()
      if (distanceToCenter > target.physicsRadius + avoidanceRadius) {
        // to far to be touching
        continue
      }
      if (distanceToTarget > closestTarget[0]) {
        closestTarget[0] = distanceToTarget
        closestTarget[1] = target
        closestTarget[2] = vectorToCenter
      }
    }
    const closest = closestTarget[1]
    if (closest == undefined) {
      return undefined
    }
    const vectorToCenterLine = closestTarget[2]

    return {
      pitch: vectorToCenterLine.y > 0 ? -1 : 1,
      roll: 0,
      yaw: vectorToCenterLine.z > 0 ? 1 : -1,
    }
  }

  // TODO add a normal vector array to roll the entity to match path roll
  export function followPath(
    dt: number,
    entity: Entity,
    path: Curve3,
    pathRadius: number,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult | undefined {
    const entityPosition = Vector3FromObj(entity.position)
    const entityVelocity = totalVelocityFrom(entity)
    const entityRotation = QuaternionFromObj(entity.rotationQuaternion)
    const predictedPosition = entityPosition.add(entityVelocity.multiplyByFloats(dt / 1000, dt / 1000, dt / 1000))
    const closestPointOnLine = closestPointOnCurve(predictedPosition, path)
    const distance = entityPosition.subtractToRef(closestPointOnLine, TmpVectors.Vector3[0]).length()
    if (distance < pathRadius) {
      return undefined
    }
    // TODO: path could have a normal to describe the "up" of the path and we could lerp between the two points normals
    return seek(dt, entityPosition, entityRotation, closestPointOnLine, undefined, clampStrategy)
  }

  /** Tries to keep characters which are moving in arbitrary directions from running into each other */
  export function collisionAvoidance(
    _dt: number,
    entity: Entity,
    targets: Entity[],
    _clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult | undefined {
    // our character considers each of the other characters and determines (based on current velocities)
    // when and where the two will make their nearest approach. A potential for collision exists if the
    // nearest approach is in the future, and if the distance between the characters at nearest approach
    // is small enough (indicated by circles in Figure 12). The nearest of these potential collisions,
    // if any, is determined. The character then steers to avoid the site of the predicted collision.
    // It will steer laterally to turn away from the potential collision. It will also accelerate forward or
    // decelerate backwards to get to the indicate site before or after the predicted collision. In Figure 12
    // the character approaching from the right decides to slow down and turn to the left, while the other
    // character will speed up and turn to the left.
    const entityPosition = Vector3FromObj(entity.position)
    const entityVelocity = totalVelocityFrom(entity)
    const entityRotation = QuaternionFromObj(entity.rotationQuaternion)
    const entityBoundingSphere = entity.physicsRadius ?? 20

    let closestCollisionTime = Number.MAX_SAFE_INTEGER
    let closestCollisionEntity: Entity
    let closestCollisionPoint: Vector3
    for (const targetEntity of targets) {
      if (targetEntity == entity) {
        continue
      }
      const targetPosition = Vector3FromObj(targetEntity.position)
      const targetVelocity = totalVelocityFrom(targetEntity)
      // Calculate the relative velocity between the entities
      const relativeVelocity = targetVelocity.subtract(entityVelocity)

      // Calculate the relative position between the entities
      const relativePosition = targetPosition.subtract(entityPosition)

      // Calculate the time to collision (assuming constant relative velocity)
      const timeToCollision = calculateTimeToCollision(
        entityBoundingSphere,
        targetEntity.physicsRadius ?? 20,
        relativePosition,
        relativeVelocity
      )

      if (timeToCollision !== undefined && timeToCollision < closestCollisionTime) {
        closestCollisionTime = timeToCollision
        closestCollisionEntity = targetEntity
        closestCollisionPoint = targetPosition.add(relativeVelocity.scale(timeToCollision))
      }
    }

    if (closestCollisionEntity && closestCollisionPoint && closestCollisionTime < 1) {
      // Steer to avoid the predicted collision point
      const avoidanceDirection = closestCollisionPoint.subtract(entityPosition).normalize()
      const avoidanceForce = avoidanceDirection.scale(entityVelocity.length())

      // If we are going to run into something in two seconds, turn
      console.log("[SteeringBehaviours] !!! Avoid Avoid Avoid !!!", entity.id, closestCollisionTime)
      return {
        pitch: 1,
        yaw: 1,
        roll: 0,
        boost: false,
        throttle: 0,
      }
      // Return the steering result
      // return {
      //     linear: avoidanceForce,
      //     angular: Vector3.Zero() // No angular steering in this example
      // };
    } else {
      // No collision predicted, return undefined
      return undefined
    }
  }

  function calculateTimeToCollision(
    radius1: number,
    radius2: number,
    relativePosition: Vector3,
    relativeVelocity: Vector3
  ): number | undefined {
    // Calculate the sum of radii
    const sumRadii = radius1 + radius2

    // Calculate the squared distance between the entities along their direction of motion
    const relativePositionLengthSquared = relativePosition.lengthSquared()
    const relativeVelocityLengthSquared = relativeVelocity.lengthSquared()

    // Check if the entities are already colliding
    if (relativePositionLengthSquared < sumRadii * sumRadii) {
      return 0 // Entities are already colliding
    }

    // Calculate the dot product of relative position and velocity
    const dotProduct = Vector3.Dot(relativePosition, relativeVelocity)

    // If the dot product is positive, the entities are moving away from each other
    if (dotProduct > 0) {
      return undefined // No collision will occur
    }

    // Calculate the discriminant
    const discriminant =
      dotProduct * dotProduct - relativeVelocityLengthSquared * (relativePositionLengthSquared - sumRadii * sumRadii)

    // If the discriminant is negative, the entities will never intersect
    if (discriminant < 0) {
      return undefined // No collision will occur
    }

    // Calculate the time to collision
    const timeToCollision = -(dotProduct + Math.sqrt(discriminant)) / relativeVelocityLengthSquared

    // Return the time to collision
    return timeToCollision
  }

  export interface WanderState {
    wanderStrength: number
    wanderRate: number
    wanderDamp: number
    wanderPosition: Vector3
  }
  export function wander(
    dt: number,
    entity: Entity,
    state: WanderState,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ) {
    if (state.wanderPosition == undefined) {
      // wander random direction
      state.wanderPosition = new Vector3(
        randFloat(0, state.wanderRate) / 2,
        randFloat(0, state.wanderRate) / 2,
        randFloat(0, state.wanderRate) / 2
      )
    }
    const entityPosition = Vector3FromObj(entity.position)
    const entityRotation = QuaternionFromObj(entity.rotationQuaternion)

    // Generate a random displacement for the wander force
    const newForceOffset = new Vector3(
      randFloat(-state.wanderRate, state.wanderRate),
      randFloat(-state.wanderRate, state.wanderRate),
      randFloat(-state.wanderRate, state.wanderRate)
    )

    // Add the random displacement to the wander position
    const newForcePosition = state.wanderPosition.add(newForceOffset)
    let wanderOffset = Vector3.Forward()
    wanderOffset.rotateByQuaternionToRef(entityRotation, wanderOffset)
    wanderOffset = wanderOffset.multiplyByFloats(state.wanderDamp, state.wanderDamp, state.wanderDamp)
    // Calculate the direction from wanderOffset to newForcePosition
    const direction = newForcePosition.subtract(wanderOffset).normalize()

    // Constrain the newForcePosition to the surface of the sphere
    const constrainedPosition = direction.scale(state.wanderStrength).add(wanderOffset)

    // Update the wander position for the next frame
    state.wanderPosition = constrainedPosition
    // steer towards the new force
    return seek(dt, entityPosition, entityRotation, constrainedPosition, PlanarUp, clampStrategy)
  }

  export interface HeadingHoldState {
    headingIndex: number
    headingHoldLength: number
    finished: boolean
    currentTargetHeading?: Vector3
  }
  export function headingHold(
    dt: number,
    entity: Entity,
    localHeadings: Vector3[],
    headingLengths: number[],
    holdState: HeadingHoldState,
    clampStrategy?: (input: SteeringResult) => SteeringResult
  ): SteeringResult | undefined {
    if (holdState.finished) {
      return undefined
    }
    const entityRotation = QuaternionFromObj(entity.rotationQuaternion, TmpVectors.Quaternion[0])
    const entityDirection = Vector3FromObj(entity.direction, TmpVectors.Vector3[0])
    if (holdState.currentTargetHeading == undefined) {
      let worldHeading = Vector3.Zero()
      worldHeading = localHeadings[holdState.headingIndex].rotateByQuaternionToRef(entityRotation, worldHeading)
      holdState.currentTargetHeading = worldHeading
      // console.log("[headingHold] setting new heading:", localHeadings[holdState.headingIndex], holdState.currentTargetHeading)
    }

    // steer towards heading
    const error = entityDirection.subtract(holdState.currentTargetHeading)
    const errorAngle = AngleBetweenVectors(holdState.currentTargetHeading.multiplyByFloats(-1, -1, -1), entityDirection)
    if (errorAngle < DegreeToRadian(5)) {
      holdState.headingHoldLength += dt
      if (holdState.headingHoldLength > headingLengths[holdState.headingIndex]) {
        holdState.headingIndex += 1
        holdState.headingHoldLength = 0
        holdState.currentTargetHeading = undefined
        if (holdState.headingIndex >= localHeadings.length) {
          holdState.finished = true
          // console.log("[headingHold] headings done")
        } else {
          // console.log("[headingHold] heading increading to:", localHeadings[holdState.headingIndex])
        }
      }
    }
    // TODO: we could could have a normal to describe the "up" of the heading
    const steering = calculateErrorSteering(dt, error, entityRotation, clampStrategy)
    // console.log("[headingHold] steering", steering)
    return steering
  }
}

/** Will convert from -180/180 degrees in radians to -1/1 */
function clampInput(angle: number) {
  return angle / Math.PI
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function signedAngle(from: Vector3, to: Vector3, axis: Vector3): number {
  return Vector3.GetAngleBetweenVectors(from, to, axis)
}

function calculateOffsetTargetPosition(targetPosition: Vector3, targetRotation: Quaternion, offset: Vector3): Vector3 {
  // Transform the offset from unit space to target's local space
  const localOffset = offset.clone()
  localOffset.rotateByQuaternionToRef(targetRotation, localOffset)

  // Calculate the global offset target position
  const globalOffsetTarget = localOffset.add(targetPosition)

  return globalOffsetTarget
}

function arrivalSpeed(
  position: Vector3,
  target: Vector3,
  velocity: Vector3,
  maxSpeed: number,
  slowingDistance: number
): number {
  // Calculate target offset
  const targetOffset = target.subtract(position)

  // Calculate distance to target
  const distance = targetOffset.length()

  // Calculate ramped speed
  const rampedSpeed = maxSpeed * (distance / slowingDistance)

  // Clip speed to max speed or ramped speed, whichever is smaller
  const clippedSpeed = Math.min(rampedSpeed, maxSpeed)

  // Calculate desired velocity
  const desiredVelocity = targetOffset.normalize().scale(clippedSpeed)

  // Calculate steering
  const steering = desiredVelocity.subtract(velocity)

  // Return the magnitude of the desired velocity (desired speed)
  return desiredVelocity.length()
}
