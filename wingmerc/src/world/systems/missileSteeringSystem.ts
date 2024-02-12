import * as Weapons from "./../../data/weapons"
import { Weapon } from './../../data/weapons/weapon';
import { ParticleSystem, PhysicsRaycastResult, Quaternion, Scene, Texture, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../world"
import { AppContainer } from "../../app.container"
import { RouletteSelectionStochastic, rand, random, randomItem } from "../../utils/random"
import { DegreeToRadian, QuaternionFromObj, ToDegree, Vector3FromObj, calculateSteering, firstOrderIntercept, lookDirectionToQuaternion, rotateByAngle } from "../../utils/math";


export function missileSteeringSystem(dt: number) {
  missiles:
  for (const entity of queries.missiles) {
    const { position, missileRange } = entity
    if (position == undefined) {
      // lul wut
      world.removeComponent(entity, "missileRange")
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
            registerHit(possibleTarget, entity, distance, weaponClass)
            console.log("[MissileSystem] BOOM")
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
        ExplosionParticleEmitter("assets/hull_spark.png", end, AppContainer.instance.scene)
        world.remove(entity)
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
      ExplosionParticleEmitter("assets/hull_spark.png", end, AppContainer.instance.scene)
      world.remove(entity)
    }
  }
}

/**
 * TODO: 
 * Audio cue on hitting shield or armor or health
 */ 

const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
function registerHit(hitEntity: Entity, missileEntity: Entity, distance: number, missileClass: Weapon) {
  let damage = missileClass.damage
  if (hitEntity.position == undefined) { return }
  if (hitEntity.shields != undefined || hitEntity.armor != undefined) {
    // determine if we were hit in the front of back shields
    const hitEntityPosition = Vector3FromObj(hitEntity.position)
    const missileEntityPosition = Vector3FromObj(missileEntity.position)
    const directionOfHit = hitEntityPosition.subtract(missileEntityPosition)
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
        console.log("[MissileSystem] hit front shield", hitEntity.shields.currentFore, damage)
        if (damage == 0) {
          ConeParticleEmitter("assets/shield_spark.png", missileEntityPosition, AppContainer.instance.scene)
        }
      } else if (quadrant == "aft" && hitEntity.shields.currentAft >= 0) {
        hitEntity.shields.currentAft -= damage
        if (hitEntity.shields.currentAft < 0) {
          damage = Math.abs(hitEntity.shields.currentAft)
          hitEntity.shields.currentAft = 0
        } else {
          damage = 0
        }
        console.log("[MissileSystem] hit back shield", hitEntity.shields.currentAft, damage)
        if (damage == 0) {
          ConeParticleEmitter("assets/shield_spark.png", missileEntityPosition, AppContainer.instance.scene)
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
          console.log("[MissileSystem] hit front armor", hitEntity.armor.front, damage)
        } else if (incomingDegrees >= 45 && incomingDegrees <= 135) {
          // right
          hitEntity.armor.right -= damage
          if (hitEntity.armor.right < 0) {
            damage = Math.abs(hitEntity.armor.right)
            hitEntity.armor.right = 0
          }
          console.log("[MissileSystem] hit right armor", hitEntity.armor.right, damage)
        } else if (incomingDegrees > 135 || incomingDegrees <= -135) {
          // back
          hitEntity.armor.back -= damage
          if (hitEntity.armor.back < 0) {
            damage = Math.abs(hitEntity.armor.back)
            hitEntity.armor.back = 0
          }
          console.log("[MissileSystem] hit back armor", hitEntity.armor.back, damage)
        } else if (incomingDegrees < -45 && incomingDegrees >= -135) {
          // left
          hitEntity.armor.left -= damage
          if (hitEntity.armor.left < 0) {
            damage = Math.abs(hitEntity.armor.left)
            hitEntity.armor.left = 0
          }
          console.log("[MissileSystem] hit left armor", hitEntity.armor.left, damage)
        }
        ConeParticleEmitter("assets/hull_spark.png", missileEntityPosition, AppContainer.instance.scene)
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
          console.log("[MissileSystem] hit health", randomDamage)
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
          console.log("[MissileSystem] damaged system:", damagedSystem, randomDamage)
          console.log("[MissileSystem] remaining health:", hitEntity.health)
          // TODO: weapons and guns systems should be handled specially to pick a random weapon or gun to damage
          // double up particle effects and play a different sound
          ConeParticleEmitter("assets/hull_spark.png", missileEntityPosition, AppContainer.instance.scene)
          if (hitEntity.health <= 0 && hitEntity.deathRattle == undefined) {
            // death animation or something
            world.addComponent(hitEntity, "deathRattle", true)
          }
        }
      }
    }
  }
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

function ExplosionParticleEmitter(texture: string, point: Vector3, scene: Scene) {
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