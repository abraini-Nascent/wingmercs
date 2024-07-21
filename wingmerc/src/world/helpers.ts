import { TmpVectors, Vector3 } from "@babylonjs/core"
import { Entity } from "./world"
import { Vector3FromObj } from "../utils/math"
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