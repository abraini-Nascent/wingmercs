import { Color3, IDisposable, StandardMaterial, TmpVectors, TrailMesh, TransformNode, Vector3 } from "@babylonjs/core"
import { AppContainer } from "../../../app.container"
import { Entity, EntityUUID, queries, SetComponent, world } from "../../world"
import { QuaternionFromObj, Vector3FromObj } from "../../../utils/math"
import { MercParticlePointEmitter } from "../../../utils/particles/mercParticleEmitters"
import { MercParticles } from "../../../utils/particles/mercParticles"
import { MercParticleSystem } from "../../../utils/particles/mercParticleSystem"

let i = 0
/**
 * creates the meshes and transform nodes for trails for an entity based on it's "trail" component
 */

export class TrailersSystem implements IDisposable {
  entitySps = new Map<EntityUUID, MercParticleSystem>()
  constructor() {
    queries.trailers.onEntityAdded.subscribe(this.trailersOnEntityAdded)
    queries.trailers.onEntityRemoved.subscribe(this.trailersOnEntityRemoved)
  }

  dispose(): void {
    queries.trailers.onEntityAdded.unsubscribe(this.trailersOnEntityAdded)
    queries.trailers.onEntityRemoved.unsubscribe(this.trailersOnEntityRemoved)
    for (const [entityID, sps] of this.entitySps) {
      sps.dispose()
    }
    this.entitySps.clear()
  }
  trailersOnEntityAdded = (entity: Entity) => {
    console.log("[TrailersSystem] entity added", entity.id)
    const scene = AppContainer.instance.scene
    const trailMeshs: {
      particleSystems: MercParticleSystem[]
    } = { particleSystems: [] }
    for (const trailer of entity.trailOptions) {
      const pointEmitter = new MercParticlePointEmitter()
      pointEmitter.initialPositionFunction = (particle) => {
        Vector3FromObj(entity.position, particle.position)
        return particle
      }
      if (trailer.start) {
        pointEmitter.initialPositionFunction = (particle) => {
          // position
          const offset = TmpVectors.Vector3[0]
          offset.set(trailer.start.x, trailer.start.y, trailer.start.z)
          const entityRotationQuaternion = QuaternionFromObj(entity.rotationQuaternion, TmpVectors.Quaternion[0])
          offset.applyRotationQuaternionInPlace(entityRotationQuaternion)
          particle.position.x = offset.x + entity.position.x
          particle.position.y = offset.y + entity.position.y
          particle.position.z = offset.z + entity.position.z
          // rotation
          if (particle.props.rotationQuaternion == undefined) {
            particle.props.rotationQuaternion = entityRotationQuaternion.clone()
          } else {
            particle.props.rotationQuaternion.copyFrom(entityRotationQuaternion)
          }
          /*
          let rotation = Vector3.Forward()
          rotation.applyRotationQuaternionInPlace(
            QuaternionFromObj(entity.rotationQuaternion, TmpVectors.Quaternion[0])
          )
          // Compute the rotation vector (pitch, yaw, roll) based on the rotated up vector
          const pitch = Math.atan2(rotation.y, rotation.z) // Rotation around X-axis
          const yaw = Math.atan2(rotation.x, rotation.z) // Rotation around Y-axis
          const roll = Math.atan2(rotation.x, rotation.y) // Rotation around Z-axis

          // Create a Vector3 for rotation in Euler angles
          particle.props.rotation.x = pitch
          particle.props.rotation.y = yaw
          particle.props.rotation.z = roll
          */
          return particle
        }
      }
      let sps = MercParticles.engineTrail(`missile-trail-${++i}`, scene, pointEmitter)
      trailMeshs.particleSystems.push(sps)
      entity.disposables.add(sps)
      sps.colorGradients[0].color1.r = trailer.color.r
      sps.colorGradients[0].color1.g = trailer.color.g
      sps.colorGradients[0].color1.b = trailer.color.b
      sps.begin()
    }
    SetComponent(entity, "trailMeshs", trailMeshs)
  }
  trailersOnEntityRemoved = (entity) => {
    console.log("[TrailersSystem] entity removed", entity.id)
    const sps = this.entitySps.get(entity.id)
    if (sps) {
      sps.dispose()
      this.entitySps.delete(entity.id)
    }
  }
}
export class TrailersTrailMeshSystem implements IDisposable {
  constructor() {
    queries.trailers.onEntityAdded.subscribe(this.trailersOnEntityAdded)
    queries.trailers.onEntityRemoved.subscribe(this.trailersOnEntityRemoved)
  }

  dispose(): void {
    queries.trailers.onEntityAdded.unsubscribe(this.trailersOnEntityAdded)
    queries.trailers.onEntityRemoved.unsubscribe(this.trailersOnEntityRemoved)
  }

  trailersOnEntityAdded = (entity) => {
    const origin = queries.origin.first?.position
      ? Vector3FromObj(queries.origin.first?.position)
      : Vector3.ZeroReadOnly
    let node = entity.node
    let nodeCreated = false
    let disposables: IDisposable[] = []
    if (node == undefined) {
      nodeCreated = true
      node = new TransformNode(`trail-${i}-parent`)
      const { position } = entity
      node.position.x = position.x - origin.x
      node.position.y = position.y - origin.y
      node.position.z = position.z - origin.z
      disposables.push(node)
    }
    const scene = AppContainer.instance.scene
    let trails: { trail: TrailMesh; node: TransformNode }[] = []
    for (const trailOption of entity.trailOptions) {
      let trailNode = node
      if (trailOption.start) {
        trailNode = new TransformNode(`trail-${i}-transform`)
        trailNode.position.x = trailOption.start.x
        trailNode.position.y = trailOption.start.y
        trailNode.position.z = trailOption.start.z
        trailNode.parent = node
        if (!nodeCreated) {
          disposables.push(trailNode)
        }
      }
      const width = trailOption?.width ?? 0.2
      const length = trailOption?.length ?? 100
      const color = trailOption?.color
        ? new Color3(trailOption?.color.r, trailOption?.color.g, trailOption?.color.b)
        : Color3.Blue()
      const newTrail = new TrailMesh(`trail-${i}`, trailNode, scene, width, length, false)
      disposables.push(newTrail)
      setTimeout(() => {
        newTrail.start()
      }, 16)
      const entityMaterial = new StandardMaterial(`trailMat-${i}`)
      entityMaterial.emissiveColor = color.clone()
      entityMaterial.diffuseColor = color.clone()
      entityMaterial.specularColor = Color3.Black()
      newTrail.material = entityMaterial
      disposables.push(entityMaterial)
      trails.push({ trail: newTrail, node: trailNode })
    }
    world.update(entity, {
      trailMeshs: { trails, disposables },
      node,
    })
    i += 1
    AppContainer.instance.scene.onBeforeRenderObservable.add(() => {
      trails.forEach(({ trail }) => {
        trail._positions?.forEach((position, index) => {
          trail._positions[index].subtractInPlace(origin)
        })
      })
    })
  }

  trailersOnEntityRemoved = (entity) => {
    if (entity.trailMeshs != undefined && entity.trailMeshs.disposables.length > 0) {
      for (const disposable of entity.trailMeshs.disposables) {
        disposable.dispose()
      }
      queueMicrotask(() => {
        world.removeComponent(entity, "trailMeshs")
      })
    }
  }
}
