import { Color3, Material, Mesh, MeshBuilder, Quaternion, Scalar, StandardMaterial, TmpColors, TrailMesh, TransformNode, Vector3 } from "@babylonjs/core"
import { queries, world } from "../world"
import { ObjModels } from "../../assetLoader/objModels"
import { AppContainer } from "../../app.container"
import { ToRadians } from "../../utils/math"


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
          mat.alpha = 0.25
          mat.wireframe = true
          instanceMesh.material = mat
          instanceMesh.isVisible = visible
        }
      }
      world.addComponent(entity, "node", newNode)
      world.addComponent(entity, "engineMesh", engineMesh)
    }
  })()
)

queries.trailers.onEntityAdded.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      setTimeout(() => {
        const node = entity.node
        const scene = AppContainer.instance.scene
        let trails: TrailMesh[] = []
        for (const trailOption of entity.trailOptions) {
          const trailNode = new TransformNode(`trail-${i}-transform`)
          if (trailOption.start) {
            trailNode.position.x = trailOption.start.x
            trailNode.position.y = trailOption.start.y
            trailNode.position.z = trailOption.start.z
          }
          trailNode.parent = node
          const width = trailOption?.width ?? 0.2
          const length = trailOption?.length ?? 100
          const color = trailOption?.color ? new Color3(trailOption?.color.r, trailOption?.color.g, trailOption?.color.b) : Color3.Blue()
          const newTrail = new TrailMesh(`trail-${i}`, trailNode, scene, width, length, true)
          const sourceMat = new StandardMaterial(`trailMat-${1}`, scene)
          sourceMat.emissiveColor = color
          sourceMat.diffuseColor = color
          sourceMat.specularColor = Color3.Black()
          newTrail.material = sourceMat
          trails.push(newTrail)
        }
        world.addComponent(entity, "trailMeshs", trails)
      }, 1)
    }
  })()
)
queries.trailers.onEntityRemoved.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      if (world.has(entity)) {
        if (entity.trail == undefined && entity.trailMeshs != undefined && entity.trailMeshs.length > 0) {
          for (const trailMesh of entity.trailMeshs) {
            if (trailMesh.parent) {
              trailMesh.parent.dispose()
            } else {
              trailMesh.dispose()
            }
          }
          world.removeComponent(entity, "trailMeshs")
        }
      }
    }
  })()
)

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
        entity.trailMeshs.forEach((mesh) => { mesh.dispose() })
      }
      oldNode.dispose()
    }
  })()
)

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
      for (let i = 0; i < trailMeshs.length; i += 1) {
        const trailMesh = trailMeshs[i]
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
      for (let i = 0; i < trailMeshs.length; i += 1) {
        const trailMesh = trailMeshs[i]
        const trailOption = trailOptions[i]
        let mat = trailMesh.material as StandardMaterial
        let target = TmpColors.Color3[0]
        let result = TmpColors.Color3[0]
        target.set(trailOption?.color?.r ?? 1, trailOption?.color?.g ?? 1, trailOption?.color?.b ?? 1)
        const scale = duration / 1000
        // 100% in one second
        Color3.LerpToRef(mat.emissiveColor, target, scale, result)
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