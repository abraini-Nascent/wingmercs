import { Weapon } from '../../../data/weapons/weapon';
import * as Weapons from '../../../data/weapons';
import * as Guns from '../../../data/guns';
import { Vector3 } from "@babylonjs/core"
import { EntityForId, queries, world } from "../../world"
import { AngleBetweenVectors, QuaternionFromObj, ToDegree, Vector3FromObj, firstOrderIntercept } from "../../../utils/math"
import { Gun } from '../../../data/guns/gun';

// TODO update to use TmpVectors

const TARGET_LOCK_SPEED = 120 // degrees per second
export function missileTargetingSystem(dt: number) {
  for (const entity of queries.targeting) {
    const { targeting, direction, position, rotationQuaternion } = entity
    const targetEntity = EntityForId(targeting.target)
    if (targetEntity == undefined) {
      targeting.target = ""
      targeting.locked = false
      targeting.targetingDirection = { x: direction.x, y: direction.y, z: direction.z }
      targeting.targetingTime = 0
      targeting.gunInterceptPosition = undefined
      world.update(entity, "targeting", targeting)
      continue
    }

    // calculate time to intercept
    // TODO this should be it's own system
    let particleSpeed = 2000;
    const mount = entity.guns.mounts[entity.guns.selected]
    if (mount != undefined) {
      particleSpeed = mount.stats.speed
    }
    const gunInterceptPosition = firstOrderIntercept(
      Vector3FromObj(entity.position),
      Vector3FromObj(entity.velocity),
      Vector3FromObj(targetEntity.position),
      Vector3FromObj(targetEntity.velocity),
      particleSpeed)
    targeting.gunInterceptPosition = gunInterceptPosition

    // is entity's weapon a tracking weapon
    const mounts = entity.weapons.mounts
    const selectedWeapon = mounts[entity.weapons.selected]
    if (selectedWeapon == undefined || selectedWeapon.count == 0) {
      continue
    }
    const weaponClass = Weapons[selectedWeapon.type] as Weapon
    if (weaponClass.type == "dumbfire" || weaponClass.type == "friendorfoe") {
      continue
    }
    if (targeting.target == -1) {
      // reset targeting time
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
    const directionToTarget = targetPosition.subtract(entityPosition).normalize()
    const targetDirection = Vector3FromObj(targetEntity.direction)
    directionToTarget.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion).invert())
    const delta = AngleBetweenVectors(Vector3.Forward(true), directionToTarget)
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
    if (weaponClass.class == "heatseeking") {
      const facingDelta = AngleBetweenVectors(directionToTarget, targetDirection)
      if (ToDegree(facingDelta) < 45) {
        // we are behind the target, locking is 3x faster
        targeting.targetingTime += (dt * 2)
      }
    }
    const missileLocked = targeting.targetingTime > weaponClass.timeToLock
    targeting.missileLocked = missileLocked
    
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
