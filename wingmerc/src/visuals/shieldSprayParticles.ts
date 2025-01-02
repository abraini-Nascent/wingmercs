import { Vector3 } from "@babylonjs/core"
import { AppContainer } from "../app.container"
import { Lazy } from "../utils/lazy"
import { MercParticles } from "../utils/particles/mercParticles"
import { MercParticleSystemPool } from "../utils/particles/mercParticleSystem"
import { Entity, queries } from "../world/world"
import { Vector3FromObj } from "../utils/math"
import { MercParticleConeEmitter } from "../utils/particles/mercParticleEmitters"

const ShieldSprayName = "shield spray from hit"
export const shieldSprayParticlePool: Lazy<MercParticleSystemPool> = new Lazy(() => {
  return new MercParticleSystemPool(ShieldSprayName, (count, emitter) => {
    const scene = AppContainer.instance.scene
    return MercParticles.shieldSpray(`${ShieldSprayName}-${count}`, scene, emitter, false, false)
  })
})

let id = 0
export function shieldSprayFrom(hitPointWorld: Vector3, directionOfHit: Vector3) {
  const inverseDirectionOfHit = directionOfHit.multiplyByFloats(-1, -1, -1)
  const origin =
    (queries.origin.first?.position ? Vector3FromObj(queries.origin.first?.position) : undefined) ??
    Vector3.ZeroReadOnly
  const hitPointGame = hitPointWorld.add(origin)
  const emitter = new MercParticleConeEmitter(hitPointGame, inverseDirectionOfHit, 5, 10)
  shieldSprayParticlePool.value.acquireSystem(emitter)
}
