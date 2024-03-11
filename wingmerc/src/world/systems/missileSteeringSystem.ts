import * as Weapons from "./../../data/weapons"
import { Weapon } from './../../data/weapons/weapon';
import { Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { QuaternionFromObj, Vector3FromObj, calculateSteering, firstOrderIntercept } from "../../utils/math";
import { SoundEffects } from "../../utils/sounds/soundEffects";
import { registerHit } from "../damage";
import { missileExplosionFrom } from "../../visuals/missileExplosionParticles";

export function missileSteeringSystem(dt: number) {
  missiles:
  for (const entity of queries.missiles) {
    const { position, missileRange } = entity
    if (position == undefined) {
      // lul wut
      world.removeComponent(entity, "missileRange")
      continue
    }
    if (world.has(entity) == false) {
      console.log("[MissileSystem] dead missile found and removed")
      queries.missiles.remove(entity)
      // skipping dead particle
      continue
    }
    // check if missile is in explosion range to anything
    var start = new Vector3(missileRange.lastPosition.x, missileRange.lastPosition.y, missileRange.lastPosition.z)
    var end = new Vector3(position.x, position.y, position.z)
    // FOR NOW: we are assuming a target sparse environment
    // if it has health, it can make us explode
    const weaponClass = Weapons[missileRange.type] as Weapon
    if (missileRange.total > 200) { // minimum range before warhead is active
      for (const possibleTarget of queries.damageable) {
        if (""+world.id(possibleTarget) != entity.originatorId) {
          const possibleTargetPosition = Vector3FromObj(possibleTarget.position)
          const distance = end.subtract(possibleTargetPosition).length()

          // TODO: This min distance should come from the weapon
          // TODO: the missile should keep trying to get closed until it can't since the closer it explodes the more damage it does
          if (distance < 150) {
            // BOOM
            if (possibleTarget.nerdStats) {
              possibleTarget.nerdStats.missilesEaten += 1
            }
            const shooter = world.entity(parseInt(entity.originatorId))
            if (shooter?.nerdStats) {
              shooter.nerdStats.missilesHit += 1
            }
            registerHit(possibleTarget, entity, end, weaponClass.damage)
            console.log("[MissileSystem] BOOM")
            SoundEffects.Explosion(Vector3FromObj(position))
            missileExplosionFrom(end)
            world.remove(entity)
            continue missiles;
          }
        }
      }
    }
    // steer the missile
    // TODO: I think this should be a generic "guided" property
    if (weaponClass.type == "heatseeking") {
      const target = world.entity(missileRange.target)
      if (target == undefined) {
        // maybe the target deaded?
        console.log("[MissileSystem] exploded")
        missileExplosionFrom(end)
        world.remove(entity)
        continue missiles;
      }
      const targetPosition = Vector3FromObj(target.position)
      const targetVelocity = Vector3FromObj(target.velocity)
      const pointToIntercept = firstOrderIntercept(end, Vector3.Zero(), targetPosition, targetVelocity, weaponClass.speed)
      if (pointToIntercept) {

        const currentRoration = QuaternionFromObj(entity.rotationQuaternion)
        const deltaAngle = 180 * dt / 1000
        const deltas = calculateSteering(end, currentRoration, pointToIntercept)
        const rotationalVelocity = { pitch: 0, roll: 0, yaw: 0, ...entity.rotationalVelocity }
        rotationalVelocity.pitch = deltas.pitch * deltaAngle
        rotationalVelocity.roll  = deltas.roll  * deltaAngle
        rotationalVelocity.yaw   = deltas.yaw   * deltaAngle
        world.update(entity, "rotationalVelocity", rotationalVelocity)
        const forward = new Vector3(0, 0, -1)
        const movement = forward.multiplyByFloats(weaponClass.speed, weaponClass.speed, weaponClass.speed)
        movement.applyRotationQuaternionInPlace(QuaternionFromObj(currentRoration)) // this means the rotation is one frame behind :\
        let newVelocity = movement
        world.update(entity, "velocity", newVelocity)
      }
    }
    // check if missile is end of life
    const deltaV = new Vector3(missileRange.lastPosition.x, missileRange.lastPosition.y, missileRange.lastPosition.z)
    deltaV.subtractInPlace(new Vector3(position.x, position.y, position.z))
    const delta = deltaV.length()
    missileRange.total += delta
    missileRange.lastPosition = { x: position.x, y: position.y, z: position.z }
    if (missileRange.total >= missileRange.max) {
      const dodger = world.entity(entity.targeting?.target)
      if (dodger?.nerdStats) {
        dodger.nerdStats.missilesDodged += 1
      }
      // end of the line
      // console.log("[MissileSystem] end of line")

      missileExplosionFrom(end)
      SoundEffects.Explosion(Vector3FromObj(position))
      world.remove(entity)
    }
  }
}
