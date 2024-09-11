import { Entity } from './../../world';
import { IDisposable, Scalar, TmpVectors, Vector3 } from "@babylonjs/core";
import { queries, world } from "../../world";
import { damagedSystemsSprayParticlePool } from "../../../visuals/damagedSystemsSprayParticles";
import { QuaternionFromObj, Vector3FromObj } from "../../../utils/math";
import { MercParticleCustomEmitter } from "../../../utils/particles/mercParticleEmitters";

export class SystemsDamagedSpraySystem implements IDisposable {
  
  constructor() {
    queries.systemsDamaged.onEntityAdded.subscribe(this.systemsDamagedOnEntityAdded)
    queries.systemsDamaged.onEntityRemoved.subscribe(this.systemsDamagedOnEntityRemoved)
  }

  dispose(): void {
    queries.systemsDamaged.onEntityAdded.unsubscribe(this.systemsDamagedOnEntityAdded)
    queries.systemsDamaged.onEntityRemoved.unsubscribe(this.systemsDamagedOnEntityRemoved)
  }

  systemsDamagedOnEntityAdded = (entity: Entity) => {
    const emitter = new MercParticleCustomEmitter(
      (particle) => {
        Vector3FromObj(entity.position, particle.position)
        if (entity.trailOptions && entity.rotationQuaternion) {
          const rot = QuaternionFromObj(entity.rotationQuaternion, TmpVectors.Quaternion[0])
          const start = TmpVectors.Vector3[0]
          start.x = entity.trailOptions[0]?.start?.x ?? 0
          start.y = entity.trailOptions[0]?.start?.y ?? 0
          start.z = entity.trailOptions[0]?.start?.z ?? 0
          start.rotateByQuaternionToRef(rot, start)
          particle.position.x += start.x
          particle.position.y += start.y
          particle.position.z += start.z
        }
        return particle
      },
      (particle) => {
        const velocity = Vector3FromObj(entity.velocity, TmpVectors.Vector3[0])
        velocity.scaleInPlace(0.9)
        // velocity.x = velocity.x * -1
        // velocity.y = velocity.y * -1
        // velocity.z = velocity.z * -1
        let direction = (particle.props.direction as Vector3)
        direction.set(velocity.x, velocity.y, velocity.z)
        direction.x += Scalar.RandomRange(-Math.PI, Math.PI)
        direction.y += Scalar.RandomRange(-Math.PI, Math.PI)
        direction.z += Scalar.RandomRange(-Math.PI, Math.PI)
        return particle
      }
    )
    let entityId = entity.id
    console.log(`[SystemsDamaged] \\${entityId}\\ added damaged systems spray`)
    let system = damagedSystemsSprayParticlePool.getSystem(entityId, emitter)
    system.begin()
    let timeout: unknown
    let spark: () => void
    spark = () => {
      let delay = Scalar.RandomRange(2000, 2500)
      timeout = setTimeout(() => {
        if (world.has(entity) == false || entity.deathRattle) {
          clearTimeout(timeout as number)
          damagedSystemsSprayParticlePool.release(entityId)
          return
        }
        system.begin()
        spark()
      }, delay)
    }
    spark()
  }

  systemsDamagedOnEntityRemoved = (entity: Entity) => {
    console.log(`[SystemsDamaged] \\${entity.id}\\ removed damaged systems spray`)
    damagedSystemsSprayParticlePool.release(entity.id)
  }
}