import { Vector3 } from "@babylonjs/core"
import { AppContainer } from "../app.container"
import { MercParticleSphereEmitter } from "../utils/particles/mercParticleEmitters"
import { MercParticleSystemPool } from "../utils/particles/mercParticleSystem"
import { MercParticles } from "../utils/particles/mercParticles"
import { Lazy } from "../utils/lazy"

const DeathExplosionName = "death explosion"
export const deathExplosionParticlePool: Lazy<MercParticleSystemPool> = new Lazy(() => {
  return new MercParticleSystemPool("death explosion", (count, emitter) => {
    const scene = AppContainer.instance.scene
    return MercParticles.deathExplosion(`${DeathExplosionName}-${count}`, scene, emitter, false, false)
  })
})

let sprayIds = 0
export function deathExplosionFrom(pointWorld: Vector3) {
  const sphereEmitter = new MercParticleSphereEmitter()
  sphereEmitter.position.copyFrom(pointWorld)
  deathExplosionParticlePool.value.acquireSystem(sphereEmitter)
}
