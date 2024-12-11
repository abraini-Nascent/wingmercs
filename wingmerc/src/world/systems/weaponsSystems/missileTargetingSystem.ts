import { Weapon } from "../../../data/weapons/weapon"
import * as Weapons from "../../../data/weapons"
import { TmpVectors, Vector3 } from "@babylonjs/core"
import { EntityForId, queries, SetComponent, world } from "../../world"
import {
  AngleBetweenVectors,
  QuaternionFromObj,
  ToDegree,
  Vector3FromObj,
  firstOrderIntercept,
} from "../../../utils/math"

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
      targeting.timeToLock = -1
      targeting.timeToLock = 0
      targeting.gunInterceptPosition = { x: 0, y: 0, z: 0, inRange: false, active: false }
      SetComponent(entity, "targeting", targeting)
      continue
    }
    const { isTargetable } = targetEntity
    if (isTargetable == "nav") {
      continue
    }

    // calculate time to intercept
    const entityPosition = Vector3FromObj(entity.position, TmpVectors.Vector3[0])
    const entityVelocity = Vector3FromObj(entity.velocity, TmpVectors.Vector3[1])
    const targetPosition = Vector3FromObj(targetEntity.position, TmpVectors.Vector3[2])
    const targetVelocity = Vector3FromObj(targetEntity.velocity, TmpVectors.Vector3[3])
    const targetDirection = Vector3FromObj(targetEntity.direction, TmpVectors.Vector3[4])
    const directionToTarget = targetPosition.subtractToRef(entityPosition, TmpVectors.Vector3[5]).normalize()
    const distance = targetPosition.subtractToRef(entityPosition, TmpVectors.Vector3[6]).length()
    // TODO this should be it's own system
    let particleSpeed = 2000
    const mount = entity.guns.mounts[entity.guns.selected]
    if (mount != undefined) {
      particleSpeed = mount.stats.speed
    }
    const gunInterceptPosition = firstOrderIntercept(
      entityPosition,
      entityVelocity,
      targetPosition,
      targetVelocity,
      particleSpeed
    )
    targeting.gunInterceptPosition.x = gunInterceptPosition.x
    targeting.gunInterceptPosition.y = gunInterceptPosition.y
    targeting.gunInterceptPosition.z = gunInterceptPosition.z
    targeting.gunInterceptPosition.inRange = mount ? mount.stats.range >= distance : false
    targeting.gunInterceptPosition.active = true

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
    if (targeting.target == "") {
      // reset targeting time
      targeting.targetingDirection.x = direction.x
      targeting.targetingDirection.y = direction.y
      targeting.targetingDirection.z = direction.z
      targeting.targetingTime = 0
      targeting.timeToLock = -1
      targeting.gunInterceptPosition.x = 0
      targeting.gunInterceptPosition.y = 0
      targeting.gunInterceptPosition.z = 0
      targeting.gunInterceptPosition.inRange = false
      targeting.gunInterceptPosition.active = false
      SetComponent(entity, "targeting", targeting)
      continue
    }

    // check if target is within locking cone

    directionToTarget.applyRotationQuaternionInPlace(QuaternionFromObj(rotationQuaternion).invert())
    const delta = AngleBetweenVectors(Vector3.Forward(true), directionToTarget)
    if (ToDegree(delta) > 45) {
      // target is out of cone of fire, reset
      targeting.targetingDirection.x = direction.x
      targeting.targetingDirection.y = direction.y
      targeting.targetingDirection.z = direction.z
      targeting.targetingTime = 0
      targeting.timeToLock = -1
      targeting.gunInterceptPosition.x = 0
      targeting.gunInterceptPosition.y = 0
      targeting.gunInterceptPosition.z = 0
      targeting.gunInterceptPosition.inRange = false
      targeting.gunInterceptPosition.active = false
      SetComponent(entity, "targeting", targeting)
      continue
    }
    // start adding time to target lock
    targeting.targetingTime += dt
    targeting.timeToLock = weaponClass.timeToLock
    if (weaponClass.class == "heatseeking") {
      const facingDelta = AngleBetweenVectors(directionToTarget, targetDirection)
      if (ToDegree(facingDelta) < 45) {
        // we are behind the target, locking is 3x faster
        targeting.targetingTime += dt * 2
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
    SetComponent(entity, "targeting", targeting)
  }
}
