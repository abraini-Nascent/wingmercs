import { ParticleSystem, PhysicsRaycastResult, Quaternion, Scene, Texture, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../world"
import { AppContainer } from "../../app.container"
import { registerHit } from "../damage"

export function particleSystem() {
  for (const entity of queries.particle) {
    const { position, particleRange } = entity
    if (position == undefined) {
      // lul wut
      world.removeComponent(entity, "particleRange")
      continue
    }
    if (world.has(entity) == false) {
      console.log("[Particle System] dead particle found and removed")
      queries.particle.remove(entity)
      // skipping dead particle
      continue
    }
    // check if particle passed through an entity
    var raycastResult = new PhysicsRaycastResult()
    var start = new Vector3(particleRange.lastPosition.x, particleRange.lastPosition.y, particleRange.lastPosition.z)
    var end = new Vector3(position.x, position.y, position.z)
    const physicsEngine = AppContainer.instance.scene.getPhysicsEngine()
    physicsEngine.raycastToRef(start, end, raycastResult);
    if (raycastResult.hasHit && entity.originatorId != ""+raycastResult.body.entityId) {
      const hitEntity = world.entity(raycastResult.body.entityId)
      if (entity.originatorId == hitEntity.originatorId) {
        // we were shot out by the same thing!
        console.log("[ParticleSystem] we were shot out by the same thing and hit each other!")
        continue
      }
      console.log(`[ParticleSystem] contact: ${world.id(entity)}`)
      // console.log("Collision at ", raycastResult.hitPointWorld, "to: ", raycastResult.body.entityId)
      registerHit(hitEntity, entity, raycastResult.hitPointWorld)
      const shooter = world.entity(parseInt(entity.originatorId))
      if (shooter?.nerdStats) {
        shooter.nerdStats.roundsHit += 1
      }
      // world.removeComponent(entity, "particleRange")
      world.remove(entity)
      continue
    }
    // check if particle is end of life
    const deltaV = new Vector3(particleRange.lastPosition.x, particleRange.lastPosition.y, particleRange.lastPosition.z)
    deltaV.subtractInPlace(new Vector3(position.x, position.y, position.z))
    const delta = deltaV.length()
    particleRange.total += delta
    particleRange.lastPosition = { x: position.x, y: position.y, z: position.z }
    if (particleRange.total >= particleRange.max) {
      // end of the line
      // console.log("[ParticleSystem] end of line")
      const shooter = world.entity(parseInt(entity.originatorId))
      if (shooter?.nerdStats) {
        shooter.nerdStats.roundsMissed += 1
      }
      // world.removeComponent(entity, "particleRange")
      world.remove(entity)
    }
  }
}