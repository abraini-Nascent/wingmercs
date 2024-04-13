import { TmpVectors, Vector3 } from "@babylonjs/core"
import { Entity } from "./world"
import { Vector3FromObj } from "../utils/math"

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