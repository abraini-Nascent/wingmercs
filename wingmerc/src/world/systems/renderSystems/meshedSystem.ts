import { Color3, IDisposable, Mesh, StandardMaterial, TransformNode } from "@babylonjs/core"
import { queries, world } from "../../world"
import { ObjModels } from "../../../assetLoader/objModels"

let i = 0

/**
 * creates the meshes and transform node for an entity based on it's "meshName" component
 */
export class MeshedSystem implements IDisposable {
  constructor() {
    queries.meshed.onEntityAdded.subscribe(this.meshedOnEntityAdded)
    queries.meshed.onEntityRemoved.subscribe(this.meshedOnEntityRemoved)
  }

  dispose(): void {
    queries.meshed.onEntityAdded.unsubscribe(this.meshedOnEntityAdded)
    queries.meshed.onEntityRemoved.unsubscribe(this.meshedOnEntityRemoved)
  }
  
  meshedOnEntityAdded = (entity) => {
    const visible = entity.visible ?? true
    const meshNode = ObjModels[entity.meshName] as TransformNode
    // create the mesh
    const newNode = new TransformNode(`${entity.meshName}-node-${i}`)
    const children = meshNode.getChildMeshes()
    let mat: StandardMaterial = undefined
    let engineMesh: Mesh = undefined
    let shieldMesh: Mesh = undefined
    let radius: number = 0
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
      if (instanceMesh.getBoundingInfo().boundingSphere.radiusWorld > radius) {
        radius = instanceMesh.getBoundingInfo().boundingSphere.radiusWorld
      }
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
        if (instanceMesh.getBoundingInfo().boundingSphere.radiusWorld > radius) {
          radius = instanceMesh.getBoundingInfo().boundingSphere.radiusWorld
        }
        shieldMesh = instanceMesh
      }
    }
    world.addComponent(entity, "node", newNode)
    world.addComponent(entity, "engineMesh", engineMesh)
    world.addComponent(entity, "physicsRadius", radius)
    if (shieldMesh) {
      world.addComponent(entity, "shieldMesh", shieldMesh)
    }
  }

  meshedOnEntityRemoved = (entity) => {
    console.log("[meshed] disposing entity", entity)
    const oldNode = entity.node
    if (oldNode == undefined) { return }
    const children = oldNode.getChildMeshes()
    for (let mi = 0; mi < children.length; mi += 1) {
      const mesh = children[mi]
      mesh.isVisible = false
      // in the past i've seen stutters when too many meshes are disposed at once
      // it might be a good idea to add these to a queue and dispose a set limit per frame
      console.log("[meshed] disposing mesh", mesh)
      mesh.dispose()
    }
    if (entity.trailMeshs) {
      entity.trailMeshs.disposables.forEach((mesh) => { mesh.dispose() })
    }
    oldNode.dispose()
  }
}
