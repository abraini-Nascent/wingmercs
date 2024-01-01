import { Entity } from './../world';
import { PhysicsRaycastResult, Quaternion, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../world"
import { AppContainer } from "../../app.container"

export function particleSystem() {
  for (const entity of queries.particle) {
    const { position, range } = entity
    if (position == undefined) {
      // lul wut
      world.removeComponent(entity, "range")
      continue
    }
    // check if particle passed through an entity
    var raycastResult = new PhysicsRaycastResult()
    var start = new Vector3(range.lastPosition.x, range.lastPosition.y, range.lastPosition.z)
    var end = new Vector3(position.x, position.y, position.z)
    const physicsEngine = AppContainer.instance.scene.getPhysicsEngine()
    physicsEngine.raycastToRef(start, end, raycastResult);
    if (raycastResult.hasHit) {
      console.log("Collision at ", raycastResult.hitPointWorld, "to: ", raycastResult.body.entityId)
      registerHit(world.entity(raycastResult.body.entityId), entity, raycastResult)
    }
    // check if particle is end of life
    const deltaV = new Vector3(range.lastPosition.x, range.lastPosition.y, range.lastPosition.z)
    deltaV.subtractInPlace(new Vector3(position.x, position.y, position.z))
    const delta = deltaV.length()
    range.total += delta
    range.lastPosition = { x: position.x, y: position.y, z: position.z }
    if (range.total >= range.max) {
      // end of the line
      console.log("[ParticleSystem] end of line")
      world.remove(entity)
    }
  }
}

/**
 * TODO: 
 * Visual cue on hitting shield or armor or health
 * Audio cue on hitting shield or armor or health
 * Should damage be located in this system? what about missile/weapon damage?
 * - What about systems damage?
 * Ship should die when health gets to zero
 * Ship should explode when it dies
 */ 

const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
function registerHit(hitEntity: Entity, particleEntity: Entity, hit: PhysicsRaycastResult) {
  let damage = particleEntity.damage ?? 1
  if (hitEntity.shields != undefined || hitEntity.armor != undefined) {
    // determine if we were hit in the front of back shields
    const hitEntityPosition = Vector3FromObj(hitEntity.position)
    const directionOfHit = hitEntityPosition.subtract(hit.hitPointWorld)
    directionOfHit.normalize()
    console.log(`direction of hit ${directionOfHit}`)
    // rotate the vector by ship rotation to get the vector in world space
    const hitEntityQ = QuaternionFromObj(hitEntity.rotationQuaternion)
    hitEntityQ.multiplyInPlace(TURN)
    const vectorToShip = directionOfHit.applyRotationQuaternionInPlace(hitEntityQ)
    console.log(`rotated to ship ${vectorToShip}`)
    // flatten vector to ground plane
    const flatVector = new Vector3(vectorToShip.x, 0, vectorToShip.z).normalize()
    // find signed angle of flat vector
    const incomingRadians = Vector3.GetAngleBetweenVectors(Vector3.Forward(true), flatVector, Vector3.Up())
    const incomingDegrees = ToDegree(incomingRadians)

    if (hitEntity.shields != undefined) {
      console.log("hit from incoming angle", incomingDegrees)
      if (Math.abs(incomingDegrees) < 90 && hitEntity.shields.currentFore >= 0) {
        hitEntity.shields.currentFore -= damage
        if (hitEntity.shields.currentFore < 0) {
          damage = Math.abs(hitEntity.shields.currentFore)
          hitEntity.shields.currentFore = 0
        } else {
          damage = 0
        }
        console.log("hit front shield", hitEntity.shields.currentFore, damage)
      } else if (Math.abs(incomingDegrees) >= 90 && hitEntity.shields.currentAft >= 0) {
        hitEntity.shields.currentAft -= damage
        if (hitEntity.shields.currentAft < 0) {
          damage = Math.abs(hitEntity.shields.currentAft)
          hitEntity.shields.currentAft = 0
        } else {
          damage = 0
        }
        console.log("hit back shield", hitEntity.shields.currentAft, damage)
      }
      if (damage > 0 && hitEntity.armor != undefined) {
        // at least it's explicit...
        if (incomingDegrees > -45 && incomingDegrees < 45) {
          // front
          hitEntity.armor.front -= damage
          console.log("hit front armor", hitEntity.armor.front)
        } else if (incomingDegrees >= 45 && incomingDegrees <= 135) {
          // right
          hitEntity.armor.right -= damage
          console.log("hit right armor", hitEntity.armor.right)
        } else if (incomingDegrees > 135 || incomingDegrees <= -135) {
          // back
          hitEntity.armor.back -= damage
          console.log("hit back armor", hitEntity.armor.back)
        } else if (incomingDegrees < -45 && incomingDegrees >= -135) {
          // left
          hitEntity.armor.left -= damage
          console.log("hit left armor", hitEntity.armor.left)
        }
      }
    }
  }
}

function Vector3FromObj(obj: {x: number, y: number, z: number}): Vector3 {
  return new Vector3(obj.x, obj.y, obj.z)
}

function QuaternionFromObj(obj: {x: number, y: number, z: number, w: number}): Quaternion {
  return new Quaternion(obj.x, obj.y, obj.z, obj.w);
}

function ToDegree(radians: number): number {
  return radians * 180 / Math.PI
}