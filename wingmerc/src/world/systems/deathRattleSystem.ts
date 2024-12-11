import { IDisposable } from "@babylonjs/core"
import { Entity, queries, world } from "../world"
import { AppContainer } from "../../app.container"
import { MercParticles } from "../../utils/particles/mercParticles"
import { MercParticlePointEmitter, MercParticleSphereEmitter } from "../../utils/particles/mercParticleEmitters"
import { Vector3FromObj } from "../../utils/math"
import { barks } from "../../data/barks"
import { randomItem } from "../../utils/random"
import { SAM, VoiceSound } from "../../utils/speaking"
import { SoundEffects } from "../../utils/sounds/soundEffects"

/**
 * makes a ship do the death rattle
 * TODO: this is assuming its a ship or something that moves, this will need to change when turrents arrive
 */

let i = 0
export class DeathRattleSystem implements IDisposable {
  constructor() {
    queries.deathComes.onEntityAdded.subscribe(this.onEntityAdded)
  }

  dispose(): void {
    queries.deathComes.onEntityAdded.unsubscribe(this.onEntityAdded)
  }

  onEntityAdded = (entity: Entity) => {
    console.log("[DeathRattle] entity died", entity)

    // simulating a spiral
    if (entity.ai != undefined) {
      // dead don't think
      // world.removeComponent(entity, "ai")
      entity.ai.type = "deathRattle"
    }
    const scene = AppContainer.instance.scene
    const pointEmitter = new MercParticlePointEmitter()
    pointEmitter.initialPositionFunction = (particle) => {
      Vector3FromObj(entity.position, particle.position)
      return particle
    }
    world.removeComponent(entity, "trail")
    let bark: { english: string; ipa: string; sam: string } = randomItem(barks.enemyDeath)
    setTimeout(() => {
      let voice = entity.voice ?? SAM
      VoiceSound(bark.ipa, voice).then((sound) => {
        if (sound) {
          sound.maxDistance = 10000
          sound.spatialSound = true
          sound.attachToMesh(entity.node)
          sound.play()
          if (entity.speaking != undefined) {
            entity.speaking.detachFromMesh()
            entity.speaking.dispose()
            world.removeComponent(entity, "speaking")
            queueMicrotask(() => {
              world.addComponent(entity, "speaking", sound)
              sound.onEndedObservable.addOnce(() => {
                if (entity.speaking == sound) {
                  world.removeComponent(entity, "speaking")
                }
                sound.detachFromMesh()
                sound.dispose()
              })
            })
          }
        }
      })
    }, 1)
    let sps = MercParticles.fireSmokeTrail(`death-rattle-${i}`, scene, pointEmitter)
    sps.begin()
    const sphereEmitter = new MercParticleSphereEmitter()
    sphereEmitter.initialPositionFunction = (particle) => {
      Vector3FromObj(entity.position, particle.position)
      return particle
    }
    Vector3FromObj(entity.position, sphereEmitter.position)
    let fire = MercParticles.onFire(`death-on-fire-${i}`, scene, sphereEmitter)
    fire.begin()
    // is there a better way than using a timeout...
    setTimeout(() => {
      let fade = 300
      let observer = scene.onAfterRenderObservable.add(() => {
        let dt = scene.getEngine().getDeltaTime()
        fade -= dt
        let st = dt / 1000

        entity.node.scaling.x -= st
        entity.node.scaling.y -= st
        entity.node.scaling.z -= st

        if (fade <= 0) {
          SoundEffects.Explosion(Vector3FromObj(entity.position))
          const sphereEmitter = new MercParticleSphereEmitter()
          Vector3FromObj(entity.position, sphereEmitter.position)
          let sphereSps = MercParticles.deathExplosion(`death-explosion-${i}`, scene, sphereEmitter)
          observer.remove()
          observer = undefined
          world.addComponent(entity, "outOfCombat", true)
          queueMicrotask(() => {
            world.remove(entity)
          })
          sps.stopped = true
          fire.stopped = true
          sps.onDone = () => {
            sps.dispose()
            sps = undefined
          }
        }
      })
    }, 3000)
  }
}
