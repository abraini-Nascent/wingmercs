import { Observer, Scalar, Scene, Sound, TmpVectors, Vector3 } from '@babylonjs/core';
/**
 * TODO: 
 * Audio cue on hitting shield or armor or health
 */
import { PhysicsRaycastResult, Quaternion } from "@babylonjs/core";
import { Entity, world } from "./world";
import { QuaternionFromObj, ToDegree, Vector3FromObj } from '../utils/math';
import { RouletteSelectionStochastic, rand, randomItem } from '../utils/random';
import { AppContainer } from '../app.container';
import { MercParticles } from '../utils/particles/mercParticles';
import { MercParticleConeEmitter, MercParticlePointEmitter } from '../utils/particles/mercParticleEmitters';
import { MercParticleSystemPool } from '../utils/particles/mercParticleSystem';
import { barks } from '../data/barks';
import { translateIPA } from '../data/IAP';
import { SAM, VoiceSound } from '../utils/speaking';
import { SoundEffects } from '../utils/sounds/soundEffects';

const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
export type ParticleEntity = Pick<Entity, "damage" | "originatorId">

export function registerHit(hitEntity: Entity, particleEntity: ParticleEntity, hitPointWorld: Vector3, damage: number = 1) {
  const shooterStats = world.entity(parseInt(particleEntity.originatorId))?.nerdStats
  const victimStats = hitEntity.nerdStats
  
  AppContainer.instance.pipeline.process("registerHit", { shooter: parseInt(particleEntity.originatorId), victim: world.id(hitEntity) })
  if (hitEntity.position == undefined) { return }
  if (hitEntity.shields != undefined || hitEntity.armor != undefined) {
    // determine if we were hit in the front of back shields
    const hitEntityPosition = Vector3FromObj(hitEntity.position, TmpVectors.Vector3[0])
    
    const directionOfHit = hitEntityPosition.subtract(hitPointWorld)
    directionOfHit.normalize()
    
    // console.log(`direction of hit ${directionOfHit}`)
    // rotate the vector by ship rotation to get the vector in world space
    const hitEntityQ = QuaternionFromObj(hitEntity.rotationQuaternion, TmpVectors.Quaternion[0])
    hitEntityQ.multiplyInPlace(TURN)
    const vectorToShip = directionOfHit.applyRotationQuaternionInPlace(hitEntityQ)
    // console.log(`rotated to ship ${vectorToShip}`)
    // flatten vector to ground plane
    const flatVector = TmpVectors.Vector3[1].set(vectorToShip.x, 0, vectorToShip.z).normalize()
    // find signed angle of flat vector
    const UP = TmpVectors.Vector3[2].set(0,1,0)
    const FORWARD = TmpVectors.Vector3[3].set(0,0,-1)
    const incomingRadians = Vector3.GetAngleBetweenVectors(FORWARD, flatVector, UP)
    const incomingDegrees = ToDegree(incomingRadians)
    const quadrant: "fore" | "aft" = Math.abs(incomingDegrees) < 90 ? "fore" : "aft"
    if (hitEntity.shields != undefined) {
      let oldShieldDamage = damage
      // console.log("hit from incoming angle", incomingDegrees)
      if (quadrant == "fore" && hitEntity.shields.currentFore >= 0) {
        hitEntity.shields.currentFore -= damage
        if (hitEntity.shields.currentFore < 0) {
          damage = Math.abs(hitEntity.shields.currentFore)
          hitEntity.shields.currentFore = 0
        } else {
          damage = 0
        }
        console.log("[Damage] hit front shield", hitEntity.shields.currentFore, damage)
        if (damage == 0) {
          shieldSprayFrom(hitEntity, hitPointWorld, directionOfHit)
          SoundEffects.ShieldHit(hitEntityPosition.clone())
        }
      } else if (quadrant == "aft" && hitEntity.shields.currentAft >= 0) {
        let oldDamage = damage
        hitEntity.shields.currentAft -= damage
        if (hitEntity.shields.currentAft < 0) {
          damage = Math.abs(hitEntity.shields.currentAft)
          hitEntity.shields.currentAft = 0
        } else {
          damage = 0
        }
        console.log("[Damage] hit back shield", hitEntity.shields.currentAft, damage)
        if (damage == 0) {
          shieldSprayFrom(hitEntity, hitPointWorld, directionOfHit)
          SoundEffects.ShieldHit(hitEntityPosition.clone())
        }
      }
      if (shooterStats) { shooterStats.shieldDamageGiven += oldShieldDamage - damage }
      if (victimStats) { victimStats.shieldDamageTaken += oldShieldDamage - damage }
      if (damage > 0 && hitEntity.armor != undefined) {
        let oldArmorDamage = damage
        // at least it's explicit...
        if (incomingDegrees > -45 && incomingDegrees < 45) {
          // front
          hitEntity.armor.front -= damage
          if (hitEntity.armor.front < 0) {
            damage = Math.abs(hitEntity.armor.front)
            hitEntity.armor.front = 0
          }
          console.log("[Damage] hit front armor", hitEntity.armor.front)
        } else if (incomingDegrees >= 45 && incomingDegrees <= 135) {
          // right
          hitEntity.armor.right -= damage
          if (hitEntity.armor.right < 0) {
            damage = Math.abs(hitEntity.armor.right)
            hitEntity.armor.right = 0
          }
          console.log("[Damage] hit right armor", hitEntity.armor.right)
        } else if (incomingDegrees > 135 || incomingDegrees <= -135) {
          // back
          hitEntity.armor.back -= damage
          if (hitEntity.armor.back < 0) {
            damage = Math.abs(hitEntity.armor.back)
            hitEntity.armor.back = 0
          }
          console.log("[Damage] hit back armor", hitEntity.armor.back)
        } else if (incomingDegrees < -45 && incomingDegrees >= -135) {
          // left
          hitEntity.armor.left -= damage
          if (hitEntity.armor.left < 0) {
            damage = Math.abs(hitEntity.armor.left)
            hitEntity.armor.left = 0
          }
          console.log("[Damage] hit left armor", hitEntity.armor.left)
        }
        damageSprayFrom(hitEntity, hitPointWorld, directionOfHit)
        SoundEffects.ArmorHit(hitEntityPosition.clone())
        // ConeParticleEmitter("assets/hull_spark.png", hitPointWorld, AppContainer.instance.scene)
        let armorDamageDelt = oldArmorDamage - damage
        if (shooterStats) { shooterStats.armorDamageGiven += armorDamageDelt }
        if (victimStats) { victimStats.armorDamageTaken += armorDamageDelt }
        
        // start knocking down system health
        if (damage > 0 && hitEntity.health != undefined) {
          SoundEffects.SystemHit(hitEntityPosition.clone())
          if (hitEntity.barkedSpooked == undefined && Scalar.RandomRange(0, 1) > 0.5) {
            world.addComponent(hitEntity, "barkedSpooked", true)
            let bark: { english: string; ipa: string; sam: string; } = randomItem(barks.enemySpooked)
            setTimeout(() => { 
              const sound = VoiceSound(bark.ipa, SAM)
              sound.maxDistance = 10000
              sound.spatialSound = true
              sound.attachToMesh(hitEntity.node);
              sound.play()
            }, 1)
          }
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
          console.log("[Damage] hit health", randomDamage, hitEntity.health)
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
          if (hitEntity.systemsDamaged == undefined) {
            world.addComponent(hitEntity, "systemsDamaged", true)
          }
          console.log("[Damage] damaged system:", damagedSystem, randomDamage)
          console.log("[Damage] remaining health:", hitEntity.health)
          // double up particle effects and play a different sound
          // ConeParticleEmitter("assets/hull_spark.png", hitPointWorld, AppContainer.instance.scene)
          if (hitEntity.health <= 0 && hitEntity.deathRattle == undefined) {
            // death animation or something
            world.addComponent(hitEntity, "deathRattle", true)
          }
        }
      }
    }
  }
}

export function selectSystemForQuadrant(entity: Entity, quadrant: "fore" | "aft") {
  const systems = entity.systems.quadrant[quadrant]
  const weights = systems.map((system) => { return system.weight })
  const index = RouletteSelectionStochastic(weights)
  return systems[index].system
}

const DamageSprayName = "damage spray from hit"
export const damageSprayParticlePool = new MercParticleSystemPool((count, emitter) => {
  const scene = AppContainer.instance.scene
  return MercParticles.damageSpray(`${DamageSprayName}-${count}`, scene, emitter, false, false)
})
let sprayIds = 0
export function damageSprayFrom(hitEntity: Entity, hitPointWorld: Vector3, directionOfHit: Vector3) {
  const scene = AppContainer.instance.scene
  const inverseDirectionOfHit = directionOfHit.multiplyByFloats(-1, -1, -1)
  const hitEntityPosition = Vector3FromObj(hitEntity.position, TmpVectors.Vector3[0])
  const delta = hitPointWorld.subtract(hitEntityPosition)
  const emitter = new MercParticleConeEmitter(delta, inverseDirectionOfHit, 2, 10)
  sprayIds += 1
  const sprayId = sprayIds
  let sys = damageSprayParticlePool.getSystem(sprayId, emitter)
  sys.begin()
  let sub = scene.onAfterRenderObservable.add(() => {
    if (sys.done) {
      damageSprayParticlePool.release(sprayId)
      sub.remove()
      sub = undefined
      sys = undefined
      return
    }
    sys.mesh.position.copyFrom(Vector3FromObj(hitEntity.position, TmpVectors.Vector3[0]))
  })
}

export class ShieldPulser {
  pulsing = new Set<number>()
  renderObserver: Observer<Scene>
  pulse(entity: Entity) {
    const entityId = world.id(entity)
    const shieldMesh = entity.shieldMesh
    if (shieldMesh == undefined) {
      return
    }
    shieldMesh.material.alpha += 0.25
    this.pulsing.add(entityId)
  }
  update(dt) {
    let delta = dt / 1000
    for (const entityId of this.pulsing) {
      const entity = world.entity(entityId)
      if (entity == undefined) {
        this.pulsing.delete(entityId)
        continue
      }
      const shieldMesh = entity.shieldMesh
      if (shieldMesh == undefined) {
        this.pulsing.delete(entityId)
        continue
      }
      shieldMesh.material.alpha -= delta
      if (shieldMesh.material.alpha <= 0) {
        shieldMesh.material.alpha = 0
        this.pulsing.delete(entityId)
      }
    }
  }
}
export const shieldPulserSystem = new ShieldPulser()

const ShieldSprayName = "shield spray from hit"
export function shieldSprayFrom(hitEntity: Entity, hitPointWorld: Vector3, directionOfHit: Vector3) {
  const scene = AppContainer.instance.scene
  const inverseDirectionOfHit = directionOfHit.multiplyByFloats(-1, -1, -1)
  const hitEntityPosition = Vector3FromObj(hitEntity.position, TmpVectors.Vector3[0])
  const delta = hitPointWorld.subtract(hitEntityPosition)
  shieldPulserSystem.pulse(hitEntity)
  const emitter = new MercParticleConeEmitter(delta, inverseDirectionOfHit, 5, 10)
  let sys = MercParticles.shieldSpray(ShieldSprayName, scene, emitter)
  let sub = scene.onAfterRenderObservable.add(() => {
    if (sys.done) {
      sub.remove()
      sub = undefined
      sys = undefined
      return
    }
    sys.mesh.position.copyFrom(Vector3FromObj(hitEntity.position, TmpVectors.Vector3[0]))
  })
}