import { ParticleSystem, PhysicsMotionType, Scene, Texture, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { AppContainer } from "../../app.container"

/**
 * makes a ship do the death rattle
 * TODO: this is assuming its a ship or something that moves, this will need to change when turrents arrive
 */
queries.deathComes.onEntityAdded.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      if (entity.ai != undefined) {
        // dead don't think
        world.removeComponent(entity, "ai")
      }
      // for a simple death animation we are going to enable the physics system and thwack it hard
      // simulating a dagroll death
      // add add lots of particles
      const originalPosition = new Vector3(entity.position.x, entity.position.y, entity.position.z)
      if (entity.body != undefined) {
        // FIXME this isn't working
        let impulse = new Vector3(Math.random(), Math.random(), Math.random())
        const magnitude = 300 * Math.random()
        // entity.acceleration = impulse.clone()
        entity.rotationalVelocity = { roll: impulse.x, pitch: impulse.y, yaw: impulse.z }
        /*
        world.removeComponent(entity, "velocity")
        world.removeComponent(entity, "driftVelocity")
        world.removeComponent(entity, "acceleration")
        world.removeComponent(entity, "position")
        entity.body.disablePreStep = true
        let impulse = new Vector3(Math.random(), Math.random(), Math.random())
        const magnitude = 300 * Math.random()
        impulse = impulse.normalize()
        const offsetPosition = originalPosition.add(impulse)
        impulse.maximizeInPlaceFromFloats(magnitude, magnitude, magnitude)
        entity.body.setMotionType(PhysicsMotionType.DYNAMIC)
        entity.body.applyImpulse(impulse, originalPosition)
        entity.body.applyForce(impulse, originalPosition)
        // entity.body.applyImpulse(impulse, offsetPosition)
        */
      }
      const scene = AppContainer.instance.scene
      const trailParticle = TrailParticleEmitter("assets/hull_spark", originalPosition, scene)
      const onBeforeRender = scene.onBeforeRenderObservable.add((scene, event) => {
        if (trailParticle.isAlive()) {
          const emitter: Vector3 = trailParticle.emitter as Vector3
          emitter.copyFrom(entity.node.position)
        }
      })
      setTimeout(() => {
        onBeforeRender.remove()
        world.remove(entity)
      }, 3000)
    }
  })()
)

function TrailParticleEmitter(texture: string, point: Vector3, scene: Scene): ParticleSystem {
  //Cone around emitter
  var radius = 2
  var angle = Math.PI / 3

  // Create a particle system
  var particleSystem = new ParticleSystem("deathTrail", 2000, scene)

  //Texture of each particle
  particleSystem.particleTexture = new Texture(texture, scene, null, null, Texture.NEAREST_SAMPLINGMODE)

  // Where the particles come from
  particleSystem.emitter = point.clone()

  // Size of each particle (random between...
  particleSystem.minSize = 0.5
  particleSystem.maxSize = 2.5

  // Life time of each particle (random between...
  particleSystem.minLifeTime = 3
  particleSystem.maxLifeTime = 5

  // Emission rate
  particleSystem.emitRate = 100


  /******* Emission Space ********/
  // const coneEmiter = particleSystem.createConeEmitter(radius, angle)
  // coneEmiter.emitFromSpawnPointOnly = true
  particleSystem.emitter = point.clone()
  /// wait how do we set direction?

  // Speed
  particleSystem.minEmitPower = 2
  particleSystem.maxEmitPower = 4
  particleSystem.updateSpeed = 0.1

  particleSystem.targetStopDuration = 6
  particleSystem.disposeOnStop = true
  // Start the particle system
  particleSystem.start()
  return particleSystem
}