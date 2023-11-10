import { Color3, Mesh, Quaternion, StandardMaterial, TrailMesh, TransformNode } from "@babylonjs/core"
import { queries, world } from "../world"
import { ObjModels } from "../../objModels"
import { AppContainer } from "../../app.container"

/**
 * applies the entity's component details to the babylonjs transform node
 */
export function updateRenderSystem() {
  for (const { position, node, rotationQuaternion, rotation, scale } of queries.updateRender) {
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
  }
}

/**
 * creates the meshes and transform node for an entity based on it's "meshName" component
 */
queries.meshed.onEntityAdded.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      const meshNode = ObjModels[entity.meshName] as TransformNode
      // create the mesh
      const newNode = new TransformNode(`${entity.meshName}-node-${i}`)
      const children = meshNode.getChildMeshes()
      for (let mi = 0; mi < children.length; mi += 1) {
        const mesh = children[mi]
        const instanceMesh = (mesh as Mesh).clone(`${entity.meshName}-mesh-${i}-${mi}`, newNode)
        //.createInstance(`asteroid-mesh-${i}-${mi}`)
        instanceMesh.isVisible = true
        // instanceMesh.setParent(newNode)
      }
      world.addComponent(entity, "node", newNode)
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
        const width = entity.trailOptions?.width ?? 0.2
        const length = entity.trailOptions?.length ?? 100
        const color = entity.trailOptions?.color ? new Color3(entity.trailOptions?.color.r, entity.trailOptions?.color.g, entity.trailOptions?.color.b) : Color3.Blue()
        const newTrail = new TrailMesh(`trail-${i}`, node, scene, width, length, true)
        const sourceMat = new StandardMaterial(`trailMat-${1}`, scene)
        sourceMat.emissiveColor = color
        sourceMat.diffuseColor = color
        sourceMat.specularColor = Color3.Black()
        newTrail.material = sourceMat
        world.addComponent(entity, "trailMesh", newTrail)
      }, 1)
    }
  })()
)
queries.trailers.onEntityRemoved.subscribe(
  (() => {
    let i = 0
    return (entity) => {
      if (world.has(entity)) {
        if (entity.trail == undefined && entity.trailMesh) {
          entity.trailMesh.dispose()
          world.removeComponent(entity, "trailMesh")
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
      if (entity.trailMesh) {
        entity.trailMesh.dispose()
      }
      oldNode.dispose()
    }
  })()
)