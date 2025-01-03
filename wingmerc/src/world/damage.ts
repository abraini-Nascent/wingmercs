import { Color3, Observer, Scalar, Scene, StandardMaterial, TmpVectors, Vector3 } from "@babylonjs/core"
/**
 * TODO:
 * Audio cue on hitting shield or armor or health
 */
import { Quaternion } from "@babylonjs/core"
import { Entity, EntityForId, EntityUUID, queries, world } from "./world"
import { QuaternionFromObj, ToDegree, Vector3FromObj } from "../utils/math"
import { RouletteSelectionStochastic, rand, randomItem } from "../utils/random"
import { AppContainer } from "../app.container"
import { barks } from "../data/barks"
import { PlayVoiceSound, SAM, VoiceSound } from "../utils/speaking"
import { SoundEffects } from "../utils/sounds/soundEffects"
import { shieldSprayFrom } from "../visuals/shieldSprayParticles"
import { sparkSprayFrom } from "../visuals/sparkSprayParticles"
import { damageSprayFrom } from "../visuals/damageSprayParticles"

const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0)
export type ParticleEntity = Pick<Entity, "id" | "damage" | "originatorId">
export class ShieldPulser {
  pulsing = new Set<EntityUUID>()
  pulse(entity: Entity) {
    const entityId = entity.id
    const shieldMeshes = entity.shieldMesh
    if (shieldMeshes == undefined || shieldMeshes[0] == undefined) {
      return
    }

    const shieldMesh = shieldMeshes[0]
    shieldMesh.material.alpha += 0.5
    if (entity.shields.currentAft <= 0 || entity.shields.currentFore <= 0) {
      let mat = shieldMesh.material as StandardMaterial
      mat.emissiveColor.set(0.9, 0.1, 0.1)
    }
    console.log("[shield pulser] pulsing", entity.id, shieldMesh.material.alpha)
    this.pulsing.add(entityId)
  }
  update(dt) {
    let delta = dt / 1000
    for (const entityId of this.pulsing) {
      const entity = EntityForId(entityId)
      if (entity == undefined) {
        this.pulsing.delete(entityId)
        continue
      }
      const shieldMeshes = entity.shieldMesh
      if (shieldMeshes == undefined || shieldMeshes[0] == undefined) {
        this.pulsing.delete(entityId)
        continue
      }
      const shieldMesh = shieldMeshes[0]
      shieldMesh.material.alpha -= delta
      if (shieldMesh.material.alpha <= 0) {
        let mat = shieldMesh.material as StandardMaterial
        mat.alpha = 0
        mat.emissiveColor.set(0.0, 0.0, 0.5)
        this.pulsing.delete(entityId)
        console.log("[shield pulser] pulsing complete", entity.id, shieldMesh.material.alpha)
      }
    }
  }
}
export const shieldPulserSystem = new ShieldPulser()

export function registerHit(
  hitEntity: Entity,
  particleEntity: ParticleEntity,
  hitPointWorld: Vector3,
  damage: number = 1
) {
  const shooterStats = EntityForId(particleEntity.originatorId)?.nerdStats
  const victimStats = hitEntity.nerdStats

  AppContainer.instance.pipeline.process("registerHit", {
    shooter: parseInt(particleEntity.originatorId),
    victim: hitEntity.id,
  })
  if (hitEntity.position == undefined) {
    return
  }
  const hitEntityPosition = Vector3FromObj(hitEntity.position, TmpVectors.Vector3[0])
  const directionOfHit = hitEntityPosition.subtract(hitPointWorld)
  directionOfHit.normalize()

  if (hitEntity.shields != undefined || hitEntity.armor != undefined) {
    console.log(`[Damage] calculating damage for particle: ${particleEntity.id}`)
    /// determine if we were hit in the front of back shields
    // rotate the vector by ship rotation to get the vector in world space
    const hitEntityQ = QuaternionFromObj(hitEntity.rotationQuaternion, TmpVectors.Quaternion[0])
    hitEntityQ.multiplyInPlace(TURN)
    const vectorToShip = directionOfHit.applyRotationQuaternionInPlace(hitEntityQ)
    // console.log(`rotated to ship ${vectorToShip}`)
    // flatten vector to ground plane
    const flatVector = TmpVectors.Vector3[1].set(vectorToShip.x, 0, vectorToShip.z).normalize()
    // find signed angle of flat vector
    const UP = TmpVectors.Vector3[2].set(0, 1, 0)
    const FORWARD = TmpVectors.Vector3[3].set(0, 0, -1)
    const incomingRadians = Vector3.GetAngleBetweenVectors(FORWARD, flatVector, UP)
    const incomingDegrees = ToDegree(incomingRadians)
    const quadrant: "fore" | "aft" = Math.abs(incomingDegrees) < 90 ? "fore" : "aft"
    const player = AppContainer.instance.player?.playerEntity
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
        if (oldShieldDamage != damage) {
          shieldSprayFrom(hitPointWorld, directionOfHit)
          shieldPulserSystem.pulse(hitEntity)
          SoundEffects.ShieldHit(hitEntityPosition.clone(), hitEntity == player)
        }
      } else if (quadrant == "aft" && hitEntity.shields.currentAft >= 0) {
        hitEntity.shields.currentAft -= damage
        if (hitEntity.shields.currentAft < 0) {
          damage = Math.abs(hitEntity.shields.currentAft)
          hitEntity.shields.currentAft = 0
        } else {
          damage = 0
        }
        console.log("[Damage] hit back shield", hitEntity.shields.currentAft, damage)
        if (oldShieldDamage != damage) {
          shieldSprayFrom(hitPointWorld, directionOfHit)
          shieldPulserSystem.pulse(hitEntity)
          SoundEffects.ShieldHit(hitEntityPosition.clone(), hitEntity == player)
        }
      }
      if (shooterStats) {
        shooterStats.shieldDamageGiven += oldShieldDamage - damage
      }
      if (victimStats) {
        victimStats.shieldDamageTaken += oldShieldDamage - damage
      }
      if (damage > 0 && hitEntity.armor != undefined) {
        let oldArmorDamage = damage
        // at least it's explicit...
        if (incomingDegrees > -45 && incomingDegrees < 45) {
          // front
          hitEntity.armor.front -= damage
          if (hitEntity.armor.front < 0) {
            damage = Math.abs(hitEntity.armor.front)
            hitEntity.armor.front = 0
          } else {
            damage = 0
          }
          console.log("[Damage] hit front armor", hitEntity.armor.front, damage)
        } else if (incomingDegrees >= 45 && incomingDegrees <= 135) {
          // right
          hitEntity.armor.right -= damage
          if (hitEntity.armor.right < 0) {
            damage = Math.abs(hitEntity.armor.right)
            hitEntity.armor.right = 0
          } else {
            damage = 0
          }
          console.log("[Damage] hit right armor", hitEntity.armor.right, damage)
        } else if (incomingDegrees > 135 || incomingDegrees <= -135) {
          // back
          hitEntity.armor.back -= damage
          if (hitEntity.armor.back < 0) {
            damage = Math.abs(hitEntity.armor.back)
            hitEntity.armor.back = 0
          } else {
            damage = 0
          }
          console.log("[Damage] hit back armor", hitEntity.armor.back, damage)
        } else if (incomingDegrees < -45 && incomingDegrees >= -135) {
          // left
          hitEntity.armor.left -= damage
          if (hitEntity.armor.left < 0) {
            damage = Math.abs(hitEntity.armor.left)
            hitEntity.armor.left = 0
          } else {
            damage = 0
          }
          console.log("[Damage] hit left armor", hitEntity.armor.left, damage)
        }
        damageSprayFrom(hitPointWorld, directionOfHit)
        SoundEffects.ArmorHit(hitEntityPosition.clone(), hitEntity == player)
        let armorDamageDelt = oldArmorDamage - damage
        if (shooterStats) {
          shooterStats.armorDamageGiven += armorDamageDelt
        }
        if (victimStats) {
          victimStats.armorDamageTaken += armorDamageDelt
        }

        // start knocking down system health
        if (damage > 0 && hitEntity.health != undefined) {
          SoundEffects.SystemHit(hitEntityPosition.clone())
          if (hitEntity.barkedSpooked == undefined && Scalar.RandomRange(0, 1) > 0.5) {
            world.addComponent(hitEntity, "barkedSpooked", true)
            let bark: { english: string; ipa: string; sam?: string } = randomItem(barks.enemySpooked)
            let voice = hitEntity.voice ?? SAM
            setTimeout(() => {
              VoiceSound(bark.ipa, voice).then((sound) => PlayVoiceSound(sound, hitEntity))
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
          const remaining = damage - d6 * 6
          let randomDamage = 0
          for (let i = 0; i < d6; i += 1) {
            randomDamage += rand(1, 6)
          }
          if (remaining > 0) {
            randomDamage += rand(1, remaining)
          }
          hitEntity.health.current -= randomDamage
          console.log(
            `[Damage] hit health for ${randomDamage} damage, ${hitEntity.health.current} / ${hitEntity.health.base} health remaining`
          )
          const damagedSystem = selectSystemForQuadrant(hitEntity, quadrant)
          switch (damagedSystem) {
            case "guns": {
              // pick a random gun to damage
              const entityGuns = Object.values(hitEntity.guns.mounts).filter((g) => g.currentHealth > 0)
              if (entityGuns.length > 0) {
                const damagedGun = randomItem(entityGuns)
                damagedGun.currentHealth = Math.max(0, damagedGun.currentHealth - randomDamage)
              }
              break
            }
            case "weapons": {
              // pick a random weapon to destroy
              const entityWeapons = hitEntity.weapons.mounts.filter((w) => w.count > 0)
              if (entityWeapons.length > 0) {
                const damagedWeapon = randomItem(entityWeapons)
                damagedWeapon.count = Math.max(0, damagedWeapon.count - 1)
              }
              break
            }
            default:
              hitEntity.systems.state[damagedSystem] = Math.max(
                0,
                hitEntity.systems.state[damagedSystem] - randomDamage
              )
              break
          }
          if (hitEntity.systemsDamaged == undefined) {
            world.addComponent(hitEntity, "systemsDamaged", true)
          }
          console.log("[Damage] damaged system:", damagedSystem, randomDamage)
          console.log("[Damage] remaining health:", hitEntity.health)
          // double up particle effects and play a different sound
          if (hitEntity.health.current <= 0 && hitEntity.deathRattle == undefined) {
            // death animation or something
            world.addComponent(hitEntity, "deathRattle", true)
          }
        }
      }
    }
  } else {
    console.log("[Damage] Hit something without shields or armor, spray sparks")
    sparkSprayFrom(hitPointWorld, directionOfHit)
  }
}

export function selectSystemForQuadrant(entity: Entity, quadrant: "fore" | "aft") {
  const systems = entity.systems.quadrant[quadrant]
  const weights = systems.map((system) => {
    return system.weight
  })
  const index = RouletteSelectionStochastic(weights)
  return systems[index].system
}
