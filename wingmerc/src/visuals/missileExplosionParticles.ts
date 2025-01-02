import { Vector3 } from "@babylonjs/core"
import { AppContainer } from "../app.container"
import { MercParticlePointEmitter } from "../utils/particles/mercParticleEmitters"
import { MercParticleSystemPool } from "../utils/particles/mercParticleSystem"
import { MercParticles } from "../utils/particles/mercParticles"
import { Lazy } from "../utils/lazy"

const MissileExplosionName = "missile explosion"
export const missileExplosionParticlePool = new Lazy<MercParticleSystemPool>(() => {
  return new MercParticleSystemPool("missile explosion", (count, emitter) => {
    const scene = AppContainer.instance.scene
    return MercParticles.missileExplosion(`${MissileExplosionName}-${count}`, scene, emitter, false, false)
  })
})

let sprayIds = 0
export function missileExplosionFrom(pointWorld: Vector3) {
  const emitter = new MercParticlePointEmitter()
  emitter.position.copyFrom(pointWorld)
  missileExplosionParticlePool.value.acquireSystem(emitter)
}
