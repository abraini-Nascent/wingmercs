import { AppContainer } from "../app.container"
import { MercParticlesEmitter } from "../utils/particles/mercParticleEmitters"
import { MercParticleSystemPool } from "../utils/particles/mercParticleSystem"
import { MercParticles } from "../utils/particles/mercParticles"

// TODO clear pool when scene changes

/**
 * Adds the particle system that occasionally spits out sparks behind the ship, more sparks the more damaged
 */
export const damagedSystemsSprayParticlePool = new MercParticleSystemPool((count: number, emitter: MercParticlesEmitter) => {
  return MercParticles.damagedSystemsSpray(`damages-systems-${count}`, AppContainer.instance.scene, emitter, false, false)
})