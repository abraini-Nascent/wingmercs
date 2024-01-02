import { ParticleSystem, PhysicsRaycastResult, Quaternion, Scene, Texture, Vector3 } from "@babylonjs/core"
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
  if (hitEntity.position == undefined) { return }
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
        if (damage == 0) {
          ConeParticleEmitter("assets/shield_spark.png", hit.hitPointWorld, AppContainer.instance.scene)
        }
      } else if (Math.abs(incomingDegrees) >= 90 && hitEntity.shields.currentAft >= 0) {
        hitEntity.shields.currentAft -= damage
        if (hitEntity.shields.currentAft < 0) {
          damage = Math.abs(hitEntity.shields.currentAft)
          hitEntity.shields.currentAft = 0
        } else {
          damage = 0
        }
        console.log("hit back shield", hitEntity.shields.currentAft, damage)
        if (damage == 0) {
          ConeParticleEmitter("assets/shield_spark.png", hit.hitPointWorld, AppContainer.instance.scene)
        }
      }
      if (damage > 0 && hitEntity.armor != undefined) {
        // at least it's explicit...
        if (incomingDegrees > -45 && incomingDegrees < 45) {
          // front
          hitEntity.armor.front -= damage
          if (hitEntity.armor.front < 0) {
            damage = Math.abs(hitEntity.armor.front)
            hitEntity.armor.front = 0
          }
          console.log("hit front armor", hitEntity.armor.front)
        } else if (incomingDegrees >= 45 && incomingDegrees <= 135) {
          // right
          hitEntity.armor.right -= damage
          if (hitEntity.armor.right < 0) {
            damage = Math.abs(hitEntity.armor.right)
            hitEntity.armor.right = 0
          }
          console.log("hit right armor", hitEntity.armor.right)
        } else if (incomingDegrees > 135 || incomingDegrees <= -135) {
          // back
          hitEntity.armor.back -= damage
          if (hitEntity.armor.back < 0) {
            damage = Math.abs(hitEntity.armor.back)
            hitEntity.armor.back = 0
          }
          console.log("hit back armor", hitEntity.armor.back)
        } else if (incomingDegrees < -45 && incomingDegrees >= -135) {
          // left
          hitEntity.armor.left -= damage
          if (hitEntity.armor.left < 0) {
            damage = Math.abs(hitEntity.armor.left)
            hitEntity.armor.left = 0
          }
          console.log("hit left armor", hitEntity.armor.left)
        }
        ConeParticleEmitter("assets/hull_spark.png", hit.hitPointWorld, AppContainer.instance.scene)
        // start knocking down system health
        if (damage > 0 && hitEntity.health != undefined) {
          hitEntity.health -= damage
          // double up particle effects and play a different sound
          ConeParticleEmitter("assets/hull_spark.png", hit.hitPointWorld, AppContainer.instance.scene)
          if (hitEntity.health <= 0 && hitEntity.deathRattle == undefined) {
            // death animation or something
            world.addComponent(hitEntity, "deathRattle", true)
          }
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

function ConeParticleEmitter(texture: string, point: Vector3, scene: Scene) {
  //Cone around emitter
  var radius = 2
  var angle = Math.PI / 3

  // Create a particle system
  var particleSystem = new ParticleSystem("particles", 20, scene)

  //Texture of each particle
  particleSystem.particleTexture = new Texture(texture, scene, null, null, Texture.NEAREST_SAMPLINGMODE)

  // Where the particles come from
  particleSystem.emitter = point.clone()

  // Colors of all particles
  // particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
  // particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
  // particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

  // Size of each particle (random between...
  particleSystem.minSize = 0.1
  particleSystem.maxSize = 0.5

  // Life time of each particle (random between...
  particleSystem.minLifeTime = 0.3
  particleSystem.maxLifeTime = 1.5

  // Emission rate
  particleSystem.emitRate = 10002


  /******* Emission Space ********/
  const coneEmiter = particleSystem.createConeEmitter(radius, angle)
  coneEmiter.emitFromSpawnPointOnly = true
  /// wait how do we set direction?

  // Speed
  particleSystem.minEmitPower = 2
  particleSystem.maxEmitPower = 4
  particleSystem.updateSpeed = 0.1

  particleSystem.targetStopDuration = 1
  particleSystem.disposeOnStop = true
  // Start the particle system
  particleSystem.start()
}