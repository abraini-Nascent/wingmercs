import { ParticleSystem, PhysicsRaycastResult, Quaternion, Scene, Texture, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../world"
import { AppContainer } from "../../app.container"
import { RouletteSelectionStochastic, rand, random, randomItem } from "../../utils/random"

export function particleSystem() {
  for (const entity of queries.particle) {
    const { position, particleRange } = entity
    if (position == undefined) {
      // lul wut
      world.removeComponent(entity, "particleRange")
      continue
    }
    // check if particle passed through an entity
    var raycastResult = new PhysicsRaycastResult()
    var start = new Vector3(particleRange.lastPosition.x, particleRange.lastPosition.y, particleRange.lastPosition.z)
    var end = new Vector3(position.x, position.y, position.z)
    const physicsEngine = AppContainer.instance.scene.getPhysicsEngine()
    physicsEngine.raycastToRef(start, end, raycastResult);
    if (raycastResult.hasHit && entity.originatorId != ""+raycastResult.body.entityId) {
      const hitEntity = world.entity(raycastResult.body.entityId)
      if (entity.originatorId == hitEntity.originatorId) {
        // we were shot out by the same thing!
        console.log("[ParticleSystem] we were shot out by the same thing and hit each other!")
        continue
      }
      // console.log("Collision at ", raycastResult.hitPointWorld, "to: ", raycastResult.body.entityId)
      registerHit(hitEntity, entity, raycastResult)
      // console.log("[ParticleSystem] contact")
      world.remove(entity)
      continue
    }
    // check if particle is end of life
    const deltaV = new Vector3(particleRange.lastPosition.x, particleRange.lastPosition.y, particleRange.lastPosition.z)
    deltaV.subtractInPlace(new Vector3(position.x, position.y, position.z))
    const delta = deltaV.length()
    particleRange.total += delta
    particleRange.lastPosition = { x: position.x, y: position.y, z: position.z }
    if (particleRange.total >= particleRange.max) {
      // end of the line
      // console.log("[ParticleSystem] end of line")
      world.remove(entity)
    }
  }
}

/**
 * TODO: 
 * Audio cue on hitting shield or armor or health
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
    // console.log(`direction of hit ${directionOfHit}`)
    // rotate the vector by ship rotation to get the vector in world space
    const hitEntityQ = QuaternionFromObj(hitEntity.rotationQuaternion)
    hitEntityQ.multiplyInPlace(TURN)
    const vectorToShip = directionOfHit.applyRotationQuaternionInPlace(hitEntityQ)
    // console.log(`rotated to ship ${vectorToShip}`)
    // flatten vector to ground plane
    const flatVector = new Vector3(vectorToShip.x, 0, vectorToShip.z).normalize()
    // find signed angle of flat vector
    const incomingRadians = Vector3.GetAngleBetweenVectors(Vector3.Forward(true), flatVector, Vector3.Up())
    const incomingDegrees = ToDegree(incomingRadians)
    const quadrant: "fore" | "aft" = Math.abs(incomingDegrees) < 90 ? "fore" : "aft"
    if (hitEntity.shields != undefined) {
      // console.log("hit from incoming angle", incomingDegrees)
      if (quadrant == "fore" && hitEntity.shields.currentFore >= 0) {
        hitEntity.shields.currentFore -= damage
        if (hitEntity.shields.currentFore < 0) {
          damage = Math.abs(hitEntity.shields.currentFore)
          hitEntity.shields.currentFore = 0
        } else {
          damage = 0
        }
        console.log("[ParticleSystem] hit front shield", hitEntity.shields.currentFore, damage)
        if (damage == 0) {
          ConeParticleEmitter("assets/shield_spark.png", hit.hitPointWorld, AppContainer.instance.scene)
        }
      } else if (quadrant == "aft" && hitEntity.shields.currentAft >= 0) {
        hitEntity.shields.currentAft -= damage
        if (hitEntity.shields.currentAft < 0) {
          damage = Math.abs(hitEntity.shields.currentAft)
          hitEntity.shields.currentAft = 0
        } else {
          damage = 0
        }
        console.log("[ParticleSystem] hit back shield", hitEntity.shields.currentAft, damage)
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
          console.log("[ParticleSystem] hit front armor", hitEntity.armor.front)
        } else if (incomingDegrees >= 45 && incomingDegrees <= 135) {
          // right
          hitEntity.armor.right -= damage
          if (hitEntity.armor.right < 0) {
            damage = Math.abs(hitEntity.armor.right)
            hitEntity.armor.right = 0
          }
          console.log("[ParticleSystem] hit right armor", hitEntity.armor.right)
        } else if (incomingDegrees > 135 || incomingDegrees <= -135) {
          // back
          hitEntity.armor.back -= damage
          if (hitEntity.armor.back < 0) {
            damage = Math.abs(hitEntity.armor.back)
            hitEntity.armor.back = 0
          }
          console.log("[ParticleSystem] hit back armor", hitEntity.armor.back)
        } else if (incomingDegrees < -45 && incomingDegrees >= -135) {
          // left
          hitEntity.armor.left -= damage
          if (hitEntity.armor.left < 0) {
            damage = Math.abs(hitEntity.armor.left)
            hitEntity.armor.left = 0
          }
          console.log("[ParticleSystem] hit left armor", hitEntity.armor.left)
        }
        ConeParticleEmitter("assets/hull_spark.png", hit.hitPointWorld, AppContainer.instance.scene)
        // start knocking down system health
        if (damage > 0 && hitEntity.health != undefined) {
          /*
          https://www.wcnews.com/news/update/14668#:~:text=The%20amount%20of%20internal%20damage,and%20additional%20generic%20ship%20damage.
          Unnamed Character:
          The ship starts taking generic ship damage as well as damage to specific ship components.
          The damage is determined at random and by the quadrant hit. For example, 
          a hit on the front quadrant can result in destroying to the ship computer, 
          losing communication, losing a weapon; a hit on the rear quadrant can result 
          in damage to the fuel tank, the engine; the shield generator can be destroyed 
          from any quadrant; etc. The ship also accumulates generic damage and will be 
          destroyed when the upper limit is reached; the upper limit also varies by ship type
          */
          /* I don't know what the random damage calculation should be, so I'm going to go with another origin systems damage model:
          in ultima underworld damage is split into a bunch of d6's and 1 to any remainder,
          this means hitting certain thesholds quarentees minimum damage
           */
          damage = Math.round(damage)
          const d6 = Math.floor(damage / 6)
          const remaining = damage - (d6 * 6)
          let randomDamage = 0
          for (let i = 0; i < d6; i += 1) {
            randomDamage += rand(1, 6)
          }
          if (remaining > 0) {
            randomDamage += rand(1, remaining)
          }
          hitEntity.health -= randomDamage
          console.log("[ParticleSystem] hit health", randomDamage, hitEntity.health)
          const damagedSystem = selectSystemForQuadrant(hitEntity, quadrant)
          switch (damagedSystem) {
            case "guns": {
              // pick a random gun to damage
              const entityGuns = Object.values(hitEntity.guns).filter(g => g.currentHealth > 0)
              if (entityGuns.length > 0) {
                const damagedGun = randomItem(entityGuns)
                damagedGun.currentHealth = Math.max(0, damagedGun.currentHealth - randomDamage)
              }
              break;
            }
            case "weapons": {
              // pick a random weapon to destroy
              const entityWeapons = hitEntity.weapons.mounts.filter(w => w.count > 0)
              if (entityWeapons.length > 0) {
                const damagedWeapon = randomItem(entityWeapons)
                damagedWeapon.count = Math.max(0, damagedWeapon.count - 1)
              }
              break;
            }
            default: 
              hitEntity.systems.state[damagedSystem] = Math.max(0, hitEntity.systems.state[damagedSystem] - randomDamage)
            break;
          }
          console.log("[ParticleSystem] damaged system:", damagedSystem, randomDamage)
          console.log("[ParticleSystem] remaining health:", hitEntity.health)
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

function selectSystemForQuadrant(entity: Entity, quadrant: "fore" | "aft") {
  const systems = entity.systems.quadrant[quadrant]
  const weights = systems.map((system) => { return system.weight })
  const index = RouletteSelectionStochastic(weights)
  return systems[index].system
}