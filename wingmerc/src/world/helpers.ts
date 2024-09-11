import { Matrix, Quaternion, TmpVectors, Vector3 } from "@babylonjs/core"
import { Entity } from "./world"
import { QuaternionFromObj, Vector3FromObj } from "../utils/math"
import { ShipTemplate } from "../data/ships/shipTemplate"
import * as Ships from "../data/ships"
import * as Guns from "../data/guns"
import * as Weapons from "../data/weapons"

/// Helper functions to transform, collect, or express data from the world

/** the total velocity of an entity includes standard velocity, drift, and afterburner */
export function totalVelocityFrom(entity: Entity): Vector3 {
  const velocity = Vector3FromObj(entity.velocity)
  if (entity.driftVelocity) {
    velocity.addInPlace((Vector3FromObj(entity.driftVelocity, TmpVectors.Vector3[0])))
  }
  if (entity.afterburnerVelocity) {
    velocity.addInPlace(Vector3FromObj(entity.afterburnerVelocity, TmpVectors.Vector3[1]))
  }
  return velocity
}

/** forces the entity to rotate and look towards the point, ignoring the velocity, drift, and thrusters */
export function rotateTowardsPoint(entity: Entity, point: Vector3) {
  const entityPosition: Vector3 = Vector3FromObj(entity.position)
  const entityQuaternion: Quaternion = QuaternionFromObj(entity.rotationQuaternion)
  const entityUp: Vector3 = Vector3FromObj(entity.up)
  const entityForward: Vector3 = Vector3FromObj(entity.direction)

  // point the vectors and update the quaternion so that they look towards the point
  // Calculate the direction vector from the entity to the point
  const directionToTarget: Vector3 = point.subtract(entityPosition).normalize();

  // Compute the quaternion that aligns the entity's forward vector with the directionToTarget
  const newForward: Vector3 = directionToTarget;
  const newRight: Vector3 = Vector3.Cross(entityUp, newForward).normalize();
  const newUp: Vector3 = Vector3.Cross(newForward, newRight).normalize();

  const rotationMatrix: Matrix = Matrix.Identity();
  Matrix.FromXYZAxesToRef(newRight, newUp, newForward, rotationMatrix);
  const rotationQuaternion: Quaternion = Quaternion.FromRotationMatrix(rotationMatrix)
  // camera somehow looks backwards, so turn it
  const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
  const newRotationQuaternion = rotationQuaternion.multiply(TURN);

  // Create a rotation quaternion that aligns the entity's forward vector with the direction vector
  // const rotationMatrix: Matrix = Matrix.LookAtLH(Vector3.Zero(), point, entityUp);
  // const newRotationQuaternion: Quaternion = Quaternion.FromRotationMatrix(rotationMatrix);

  // Calculate the rotation delta
  // const inverseOriginalQuaternion = entityQuaternion.clone().invert();
  // const rotationDelta = inverseOriginalQuaternion.multiply(newRotationQuaternion);

  // Apply the rotation delta to the up and forward vectors
  // const deltaRotationMatrix = Matrix.Identity()
  // Matrix.FromQuaternionToRef(rotationDelta, deltaRotationMatrix)
  // const newUp = Vector3.TransformCoordinates(entityUp, deltaRotationMatrix);
  // const newForward = Vector3.TransformCoordinates(entityForward, deltaRotationMatrix);

  // Update the entity's values
  // entityQuaternion.copyFrom(newRotationQuaternion);
  entity.up.x = newUp.x
  entity.up.y = newUp.y
  entity.up.z = newUp.z
  entity.direction.x = directionToTarget.x
  entity.direction.y = directionToTarget.y
  entity.direction.z = directionToTarget.z
  entity.rotationQuaternion.w = newRotationQuaternion.w
  entity.rotationQuaternion.x = newRotationQuaternion.x
  entity.rotationQuaternion.y = newRotationQuaternion.y
  entity.rotationQuaternion.z = newRotationQuaternion.z
}

export function shipDetailsFrom(entity: Entity): ShipTemplate {
  const shipTemplate = entity.planeTemplate
  const shipDetails = Ships[shipTemplate] as ShipTemplate
  return shipDetails
}

export function weightForShip(ship: ShipTemplate): number {
  let weight = ship.baseWeight
  weight += ship.afterburnerSlot?.modifier?.weight ?? 0
  weight += ship.engineSlot?.modifier?.weight ?? 0
  weight += ship.fuelTankSlot?.modifier?.weight ?? 0
  weight += ship.powerPlantSlot?.modifier?.weight ?? 0
  weight += ship.shieldsSlot?.modifier?.weight ?? 0
  weight += ship.thrustersSlot?.modifier?.weight ?? 0
  weight += Object.values(ship.structure).reduce((structureWeight, section) => {
    structureWeight += section.gunMounts?.reduce((gunWeight, gunMount) => {
      gunWeight += Guns[gunMount.base?.type]?.weight ?? 0
      return gunWeight
    }, 0) ?? 0
    structureWeight += section.weaponMounts?.reduce((weaponWeight, weaponMount) => {
      weaponWeight += (Guns[weaponMount.base?.type]?.weight ?? 0) * weaponMount?.maxCount
      return weaponWeight
    }, 0) ?? 0
    structureWeight += section.utilityMounts?.reduce((utilityWeight, utilityMount) => {
      utilityWeight += utilityMount.utility?.weight ?? 0
      return utilityWeight
    }, 0) ?? 0
    structureWeight += ((section.armor ?? 0) / 10) * 0.25
    return structureWeight
  }, 0)
  
  return weight
}