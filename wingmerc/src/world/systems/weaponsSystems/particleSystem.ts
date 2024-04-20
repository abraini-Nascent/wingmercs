import { HavokPlugin, PhysicsEngineV2, PhysicsRaycastResult, Quaternion, ShapeCastResult, Vector3 } from "@babylonjs/core"
import { queries, world } from "../../world"
import { AppContainer } from "../../../app.container"
import { registerHit } from "../../damage"
import { QuaternionFromObj } from "../../../utils/math"

const shapeLocalResult = new ShapeCastResult()
const hitWorldResult = new ShapeCastResult()
const DEFAULT_ROTATION = Quaternion.Zero()
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
    shapeLocalResult.reset()
    hitWorldResult.reset()
    // check if particle passed through an entity
    // var raycastResult = new PhysicsRaycastResult()
    var start = new Vector3(particleRange.lastPosition.x, particleRange.lastPosition.y, particleRange.lastPosition.z)
    var end = new Vector3(position.x, position.y, position.z)
    const physicsEngine = AppContainer.instance.scene.getPhysicsEngine() as PhysicsEngineV2
    const havok = physicsEngine.getPhysicsPlugin() as HavokPlugin
    havok.shapeCast({
      shape: entity.body.shape,
      rotation: DEFAULT_ROTATION,
      startPosition: start,
      endPosition: end,
      shouldHitTriggers: false,
  }, shapeLocalResult, hitWorldResult)
    
    // physicsEngine.raycastToRef(start, end, raycastResult);
    // if (shapeLocalResult.hasHit) {
    //   debugger;
    // }
    if (shapeLocalResult.hasHit && entity.originatorId != ""+hitWorldResult.body.entityId) {
      const hitEntity = world.entity(hitWorldResult.body.entityId)
      if (hitEntity == undefined) {
        console.error("we collided with a mesh that has an entity id that doesn't exist in the world!", hitWorldResult.body, hitWorldResult.body.entityId)
        continue
      }
      if (entity.originatorId == hitEntity.originatorId) {
        // we were shot out by the same thing!
        console.log("[ParticleSystem] we were shot out by the same thing and hit each other!")
        continue
      }
      console.log(`[ParticleSystem] contact: ${world.id(entity)}`)
      // console.log("Collision at ", raycastResult.hitPointWorld, "to: ", raycastResult.body.entityId)
      registerHit(hitEntity, entity, hitWorldResult.hitPoint, entity.damage ?? 1)
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