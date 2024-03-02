import { MercParticleSystemPool } from './../../utils/particles/mercParticleSystem';
import { Color3, IDisposable, Material, Mesh, MeshBuilder, Quaternion, Scalar, Sound, StandardMaterial, TmpColors, TmpVectors, TrailMesh, TransformNode, Vector3 } from "@babylonjs/core"
import { Entity, queries, world } from "../world"
import { ObjModels } from "../../assetLoader/objModels"
import { AppContainer } from "../../app.container"
import { ToRadians, Vector3FromObj } from "../../utils/math"
import { MercParticles } from "../../utils/particles/mercParticles"
import { MercParticleCustomEmitter, MercParticlesEmitter } from "../../utils/particles/mercParticleEmitters"
import { SoundEffects } from '../../utils/sounds/soundEffects';


let targetingBox: Mesh
/**
 * applies the entity's component details to the babylonjs transform node
 */
export function updateRenderSystem() {
  for (const { position, node, rotationQuaternion, rotation, scale, targeting, visible } of queries.updateRender) {

    let transform = node as TransformNode
    transform.position.x = position.x
    transform.position.y = position.y
    transform.position.z = position.z
    if (rotationQuaternion != null) {
      if (transform.rotationQuaternion == null) {
        transform.rotationQuaternion = Quaternion.Identity()
      }
      transform.rotationQuaternion.x = rotationQuaternion.x
      transform.rotationQuaternion.y = rotationQuaternion.y
      transform.rotationQuaternion.z = rotationQuaternion.z
      transform.rotationQuaternion.w = rotationQuaternion.w
    }
    if (rotation != undefined) {
      transform.rotation.set(rotation.x, rotation.y, rotation.z)
    }
    if (scale != undefined) {
      transform.scaling.set(scale.x, scale.y, scale.z)
    }
    if (visible != undefined) {
      for (const mesh of transform.getChildMeshes()) {
        mesh.isVisible = visible
      }
    }

    // temp hack for now
  //   if (targeting != undefined) {
  //     if (targetingBox == undefined) {
  //       targetingBox = MeshBuilder.CreateBox("targetingBox", {size: 10})
  //       const mat = new StandardMaterial("targeting box mat")
  //       mat.diffuseColor = new Color3(1, 0, 0)
  //       mat.emissiveColor = new Color3(1, 0 ,0)
  //       mat.specularColor = new Color3(0,0,0)
  //       targetingBox.material = mat
  //     }
  //     if (targeting.gunInterceptPosition != undefined) {
  //       targetingBox.position.x = targeting.gunInterceptPosition.x
  //       targetingBox.position.y = targeting.gunInterceptPosition.y
  //       targetingBox.position.z = targeting.gunInterceptPosition.z
  //       targetingBox.isVisible = true
  //     } else {
  //       targetingBox.isVisible = false
  //     }
  //   } 
  }
}

/**
 * creates the meshes and transform node for an entity based on it's "meshName" component
 */
queries.meshed.onEntityAdded.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      const visible = entity.visible ?? true
      const meshNode = ObjModels[entity.meshName] as TransformNode
      // create the mesh
      const newNode = new TransformNode(`${entity.meshName}-node-${i}`)
      const children = meshNode.getChildMeshes()
      let mat: StandardMaterial = undefined
      let engineMesh: Mesh = undefined
      let shieldMesh: Mesh = undefined
      if (entity.meshColor != undefined) {
        // TODO: we could cache and reuse mats of the same color
        mat = new StandardMaterial(`${entity.meshName}-mat-${i}`)
        mat.emissiveColor = new Color3(entity.meshColor.r, entity.meshColor.g, entity.meshColor.b)
        mat.diffuseColor = new Color3(entity.meshColor.r, entity.meshColor.g, entity.meshColor.b)
        mat.specularColor = Color3.Black()
      }
      for (let mi = 0; mi < children.length; mi += 1) {
        const mesh = children[mi]
        // TODO: we could actually make instances instead of cloning
        const instanceMesh = (mesh as Mesh).clone(`${entity.meshName}-mesh-${i}-${mi}`, newNode)
        if (mat != undefined) {
          instanceMesh.material = mat
        }
        if (instanceMesh.material?.name == "engine") {
          // found the engine mesh
          engineMesh = instanceMesh
        }
        //.createInstance(`asteroid-mesh-${i}-${mi}`)
        instanceMesh.isVisible = visible
        // instanceMesh.setParent(newNode)
      }
      if (entity.shieldMeshName) {
        const hullMesh =  ObjModels[entity.shieldMeshName] as TransformNode
        const hullChildren = hullMesh.getChildMeshes()
        for (let mi = 0; mi < hullChildren.length; mi += 1) {
          const mesh = hullChildren[mi]
          // TODO: we could actually make instances instead of cloning
          const instanceMesh = (mesh as Mesh).clone(`${entity.shieldMeshName}-hull-${i}-${mi}`, newNode)
          // instanceMesh.rotate(Vector3.Forward(true), ToRadians(180))
          // instanceMesh.bakeCurrentTransformIntoVertices()
          const mat = new StandardMaterial(`${entity.shieldMeshName}-mat-${i}`)
          mat.emissiveColor = new Color3(0, 0, 0.5)
          mat.diffuseColor = new Color3(0, 0, 0.5)
          mat.specularColor = Color3.Black()
          mat.alpha = 0
          mat.wireframe = true
          instanceMesh.material = mat
          instanceMesh.isVisible = visible
          shieldMesh = instanceMesh
        }
      }
      world.addComponent(entity, "node", newNode)
      world.addComponent(entity, "engineMesh", engineMesh)
      if (shieldMesh) {
        world.addComponent(entity, "shieldMesh", shieldMesh)
      }
    }
  })()
)

const ColorMaterialCache = (() => {
  const cache = new Map<number, StandardMaterial>()
  return (color: Color3) => {
    const hash = color.getHashCode()
    let mat = cache.get(hash)
    if (mat) { return mat }
    mat = new StandardMaterial(`trailMat-${hash}`)
    mat.emissiveColor = color.clone()
    mat.diffuseColor = color.clone()
    mat.specularColor = Color3.Black()
    cache.set(hash, mat)
    return mat
  }
})();

queries.trailers.onEntityAdded.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      setTimeout(() => {
        let node = entity.node
        let nodeCreated = false
        let disposables: IDisposable[] = []
        if (node == undefined) {
          nodeCreated = true
          node = new TransformNode(`trail-${i}-parent`)
          const { position } = entity
          node.position.x = position.x
          node.position.y = position.y
          node.position.z = position.z
          disposables.push(node)
        }
        const scene = AppContainer.instance.scene
        let trails: TrailMesh[] = []
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
          const color = trailOption?.color ? new Color3(trailOption?.color.r, trailOption?.color.g, trailOption?.color.b) : Color3.Blue()
          const newTrail = new TrailMesh(`trail-${i}`, trailNode, scene, width, length, false)
          disposables.push(newTrail)
          setTimeout(() => { newTrail.start() }, 16)
          const entityMaterial = new StandardMaterial(`trailMat-${i}`)
          entityMaterial.emissiveColor = color.clone()
          entityMaterial.diffuseColor = color.clone()
          entityMaterial.specularColor = Color3.Black()
          newTrail.material = entityMaterial
          disposables.push(entityMaterial)
          trails.push(newTrail)
        }
        world.update(entity, {
          trailMeshs: {trails, disposables},
          node
        })
        i += 1
      }, 1)
    }
  })()
)
queries.trailers.onEntityRemoved.subscribe((entity) => {
  if (entity.trailMeshs != undefined && entity.trailMeshs.disposables.length > 0) {
    for (const disposable of entity.trailMeshs.disposables) {
        disposable.dispose()
    }
    queueMicrotask(() => {
      world.removeComponent(entity, "trailMeshs")
    })
  }
})

queries.meshed.onEntityRemoved.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      const oldNode = entity.node
      if (oldNode == undefined) { return }
      const children = oldNode.getChildMeshes()
      for (let mi = 0; mi < children.length; mi += 1) {
        const mesh = children[mi]
        mesh.isVisible = false
        // in the past i've seen stutters when too many meshes are disposed at once
        // it might be a good idea to add these to a queue and dispose a set limit per frame
        mesh.dispose()
      }
      if (entity.trailMeshs) {
        entity.trailMeshs.disposables.forEach((mesh) => { mesh.dispose() })
      }
      oldNode.dispose()
    }
  })()
)

const AfterburnerSounds = new Map<Entity, Sound>()
queries.afterburner.onEntityAdded.subscribe((entity) => {
  // console.log("afterburner on")
  if (AfterburnerSounds.has(entity) == false) {
    let sound = SoundEffects.AfterburnerEngine(Vector3FromObj(entity.position))
    sound.attachToMesh(entity.node)
    sound.loop = true
    sound.play()
    sound.setVolume(0)
    sound.setVolume(1, 3)
    AfterburnerSounds.set(entity, sound)
  }
})
queries.afterburner.onEntityRemoved.subscribe((entity) => {
  // console.log("afterburner off")
    if (AfterburnerSounds.has(entity)) {
      let sound = AfterburnerSounds.get(entity)
      SoundEffects.Silience(sound)
      AfterburnerSounds.delete(entity)
    }
})
const DriftSounds = new Map<Entity, Sound>()
queries.drift.onEntityAdded.subscribe((entity) => {
  // console.log("drift on")
  if (DriftSounds.has(entity) == false) {
    let sound = SoundEffects.DriftMode(Vector3FromObj(entity.position))
    sound.attachToMesh(entity.node)
    sound.loop = true
    sound.play()
    sound.setVolume(0)
    sound.setVolume(1, 1)
    DriftSounds.set(entity, sound)
  }
})
queries.drift.onEntityRemoved.subscribe((entity) => {
  // console.log("drift off")
    if (DriftSounds.has(entity)) {
      let sound = DriftSounds.get(entity)
      SoundEffects.Silience(sound)
      DriftSounds.delete(entity)
    }
})
const BrakeSounds = new Map<Entity, Sound>()
queries.brake.onEntityAdded.subscribe((entity) => {
  // console.log("brake on")
  if (BrakeSounds.has(entity) == false) {
    let sound = SoundEffects.BrakeMode(Vector3FromObj(entity.position))
    sound.attachToMesh(entity.node)
    sound.loop = true
    sound.play()
    sound.setVolume(0)
    sound.setVolume(1, 1)
    BrakeSounds.set(entity, sound)
  }
})
queries.brake.onEntityRemoved.subscribe((entity) => {
  // console.log("brake off")
    if (BrakeSounds.has(entity)) {
      let sound = BrakeSounds.get(entity)
      SoundEffects.Silience(sound)
      BrakeSounds.delete(entity)
    }
})

queries.afterburnerTrails.onEntityAdded.subscribe(
  (entity) => {
    const {trailMeshs, trailOptions} = entity
    let entityHidden = entity as any
    if (entityHidden.afterburnerAnimation) {
      if (entityHidden.afterburnerAnimation.remove) {
        entityHidden.afterburnerAnimation.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    }
    let duration = 0
    let observer = AppContainer.instance.scene.onAfterRenderObservable.add((scene) => {
      const dt = scene.getEngine().getDeltaTime()
      duration += dt
      const scale = duration / 1000
      for (let i = 0; i < trailMeshs.trails.length; i += 1) {
        const trailMesh = trailMeshs.trails[i]
        const trailOption = trailOptions[i]
        let mat = trailMesh.material as StandardMaterial
        
        let target = TmpColors.Color3[0]
        target.set(235/255, 113/255, 52/255)
        let start = TmpColors.Color3[2]
        start.set(trailOption?.color?.r ?? 1, trailOption?.color?.g ?? 1, trailOption?.color?.b ?? 1)
        let result = TmpColors.Color3[1]
        // 100% in one second
        Color3.LerpToRef(start, target, scale, result)

        mat.emissiveColor.copyFrom(result)
        trailMesh.diameter = Scalar.Lerp(0.2, 1, scale)
        if (entity.engineMesh != undefined) {
          const engineMat = entity.engineMesh.material as StandardMaterial
          if (mat.emissiveColor) {
            engineMat.emissiveColor.copyFrom(result)
          } else {
            engineMat.emissiveColor = target.clone()
          }
          // engineMat.diffuseColor.copyFrom(result)
        }
      }
      if (duration >= 1000) {
        observer.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    })
    entityHidden.afterburnerAnimation = observer
  }
)

queries.afterburnerTrails.onEntityRemoved.subscribe(
  (entity) => {
    const {trailMeshs, trailOptions} = entity
    let entityHidden = entity as any
    if (entityHidden.afterburnerAnimation) {
      if (entityHidden.afterburnerAnimation.remove) {
        entityHidden.afterburnerAnimation.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    }
    let duration = 0
    let observer = AppContainer.instance.scene.onAfterRenderObservable.add((scene) => {
      let dt = scene.getEngine().getDeltaTime()
      duration += dt
      for (let i = 0; i < trailMeshs.trails.length; i += 1) {
        const trailMesh = trailMeshs.trails[i]
        const trailOption = trailOptions[i]
        let mat = trailMesh.material as StandardMaterial
        let start = TmpColors.Color3[0]
        start.set(235/255, 113/255, 52/255)
        let target = TmpColors.Color3[1]
        target.set(trailOption?.color?.r ?? 1, trailOption?.color?.g ?? 1, trailOption?.color?.b ?? 1)
        const scale = duration / 1000
        // 100% in one second
        let result = TmpColors.Color3[2]
        Color3.LerpToRef(start, target, scale, result)
        mat.emissiveColor.copyFrom(result)
        trailMesh.diameter = Scalar.Lerp(1, 0.2, scale)
        if (entity.engineMesh != undefined) {
          const engineMat = entity.engineMesh.material as StandardMaterial
          if (mat.emissiveColor) {
            engineMat.emissiveColor.copyFrom(result)
          } else {
            engineMat.emissiveColor = result.clone()
          }
          // engineMat.diffuseColor.copyFrom(result)
        }
      }
      if (duration >= 1000) {
        observer.remove()
        entityHidden.afterburnerAnimation = undefined
      }
    })
    entityHidden.afterburnerAnimation = observer
  }
)

/**
 * Adds the particle system that occasionally spits out sparks behind the ship, more sparks the more damaged
 */
export const damagedSystemsSprayParticlePool = new MercParticleSystemPool((count: number, emitter: MercParticlesEmitter) => {
  return MercParticles.damagedSystemsSpray(`damages-systems-${count}`, AppContainer.instance.scene, emitter, false, false)
})
// TODO clear pool when scene changes

queries.systemsDamaged.onEntityAdded.subscribe((entity) => {
  const emitter = new MercParticleCustomEmitter(
    (particle) => {
      Vector3FromObj(entity.position, particle.position)
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
  let entityId = world.id(entity)
  console.log(`[SystemsDamaged] \\${entityId}\\ added damaged systems spray`)
  let system = damagedSystemsSprayParticlePool.getSystem(entityId, emitter)
  system.begin()
  let timeout: number
  let spark: () => void
  spark = () => {
    let delay = Scalar.RandomRange(2000, 2500)
    timeout = setTimeout(() => {
      if (world.has(entity) == false || entity.deathRattle) {
        clearTimeout(timeout)
        damagedSystemsSprayParticlePool.release(entityId)
        return
      }
      system.begin()
      spark()
    }, delay)
  }
  spark()
})
queries.systemsDamaged.onEntityRemoved.subscribe((entity) => {
  console.log(`[SystemsDamaged] \\${world.id(entity)}\\ removed damaged systems spray`)
  damagedSystemsSprayParticlePool.release(world.id(entity))
})