import { Vector3 } from "@babylonjs/core"
import { AppContainer } from "../app.container"
import { MercParticlePointEmitter } from "../utils/particles/mercParticleEmitters"
import { MercParticleSystemPool } from "../utils/particles/mercParticleSystem"
import { MercParticles } from "../utils/particles/mercParticles"

const MissileExplosionName = "damage spray from hit"
export const missileExplosionParticlePool = new MercParticleSystemPool((count, emitter) => {
  const scene = AppContainer.instance.scene
  return MercParticles.missileExplosion(`${MissileExplosionName}-${count}`, scene, emitter, false, false)
})
let sprayIds = 0
export function missileExplosionFrom(pointWorld: Vector3) {
  const scene = AppContainer.instance.scene
  const emitter = new MercParticlePointEmitter()
  emitter.position.copyFrom(pointWorld)
  sprayIds += 1
  const sprayId = sprayIds
  let sys = missileExplosionParticlePool.getSystem(sprayId, emitter)
  sys.begin()
  let sub = scene.onAfterRenderObservable.add(() => {
    if (sys.done) {
      missileExplosionParticlePool.release(sprayId)
      sub.remove()
      sub = undefined
      sys = undefined
      return
    }
  })
}