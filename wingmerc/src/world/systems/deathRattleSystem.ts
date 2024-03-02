import { Material, ParticleSystem, PhysicsMotionType, Scene, Sound, Texture, Vector3 } from "@babylonjs/core"
import { MovementCommand, queries, world } from "../world"
import { AppContainer } from "../../app.container"
import { MercParticles } from "../../utils/particles/mercParticles"
import { MercParticlePointEmitter, MercParticleSphereEmitter } from "../../utils/particles/mercParticleEmitters"
import { Vector3FromObj } from "../../utils/math"
import SamJs from "sam-js"
import { barks } from "../../data/barks"
import { randomItem } from "../../utils/random"
import { translateIPA } from "../../data/IAP"
import { CreatAudioSource, SAM, VoiceSound } from "../../utils/speaking"
import { SoundEffects } from "../../utils/sounds/soundEffects"

/**
 * makes a ship do the death rattle
 * TODO: this is assuming its a ship or something that moves, this will need to change when turrents arrive
 */
queries.deathComes.onEntityAdded.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      console.log("[DeathRattle] entity died", entity)
      // if (entity == AppContainer.instance.player?.playerEntity) {
      //   let sam = new SamJs({phonetic: false})
      //   let buffer = sam.buf32("wompwompwomp ee jekt ee jekt ee jekt -", false)
      //   let audioBuffer = CreatAudioSource(buffer)
      //   let sound = new Sound("eject damnit", audioBuffer)
      //   sound.loop = true
      //   sound.play()
      //   setTimeout(() => {
      //     sound.stop()
      //   }, 10000)
      //   return
      // }
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
      let bark: { english: string; ipa: string; sam: string; } = randomItem(barks.enemyDeath)
      setTimeout(() => { 
        const sound = VoiceSound(bark.ipa, SAM)
        sound.maxDistance = 10000
        sound.spatialSound = true
        sound.attachToMesh(entity.node);
        sound.play()
      }, 1)
      let sps = MercParticles.fireSmokeTrail(`death-rattle-${i}`, scene, pointEmitter)
      sps.begin()
      // is there a better way than using a timeout...
      setTimeout(() => {
        SoundEffects.Explosion(Vector3FromObj(entity.position))
        sps.dispose()
        sps = undefined
        let fade = 300
        let observer = scene.onAfterRenderObservable.add(() => {
          let dt = scene.getEngine().getDeltaTime()
          fade -= dt
          let st = dt / 1000
          
          entity.node.scaling.x -= st
          entity.node.scaling.y -= st
          entity.node.scaling.z -= st
          
          // for (let mesh of entity.node.getChildMeshes()) {
          //   mesh.material.alphaMode = Material.MATERIAL_ALPHATEST
          //   mesh.material.alpha -= st
          //   if (mesh.material.alpha <= 0) {
          //     mesh.material.alpha = 0
          //   }
          // }
          if (fade <= 0) {
            const sphereEmitter = new MercParticleSphereEmitter()
            Vector3FromObj(entity.position, sphereEmitter.position)
            let sphereSps = MercParticles.deathExplosion(`death-explosion-${i}`, scene, sphereEmitter)
            observer.remove()
            observer = undefined
            world.remove(entity)
          }
        })
      }, 3000)
    }
  })()
)