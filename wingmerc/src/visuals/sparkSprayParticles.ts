import { Vector3 } from "@babylonjs/core"
import { AppContainer } from "../app.container"
import { Vector3FromObj } from "../utils/math"
import { queries } from "../world/world"
import { MercParticleConeEmitter } from "../utils/particles/mercParticleEmitters"
import { MercParticles } from "../utils/particles/mercParticles"
import { MercParticleSystemPool } from "../utils/particles/mercParticleSystem"
import { Lazy } from "../utils/lazy"

const SparkSprayName = "spark spray from hit"
export const sparkSprayParticlePool: Lazy<MercParticleSystemPool> = new Lazy(() => {
  return new MercParticleSystemPool(SparkSprayName, (count, emitter) => {
    const scene = AppContainer.instance.scene
    return MercParticles.sparkSpray(`${SparkSprayName}-${count}`, scene, emitter, false, false)
  })
})
let id = 0
export function sparkSprayFrom(hitPointWorld: Vector3, directionOfHit: Vector3) {
  const inverseDirectionOfHit = directionOfHit.multiplyByFloats(-1, -1, -1)
  const origin =
    (queries.origin.first?.position ? Vector3FromObj(queries.origin.first?.position) : undefined) ??
    Vector3.ZeroReadOnly
  const hitPointGame = hitPointWorld.add(origin)
  const emitter = new MercParticleConeEmitter(hitPointGame, inverseDirectionOfHit, 5, 10)
  sparkSprayParticlePool.value.acquireSystem(emitter)
}
