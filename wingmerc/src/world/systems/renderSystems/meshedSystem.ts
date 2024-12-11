import { Color3, IDisposable, Mesh, StandardMaterial, TransformNode } from "@babylonjs/core"
import { Entity, world } from "../../world"
import { ObjModels } from "../../../assetLoader/objModels"
import { GreasedLineModel } from "../../../utils/greasedLineModel"

const DEBUG = false
let i = 0

export class MeshedSystem implements IDisposable {
  disposables = new Set<() => void>()
  queries = {
    meshed: world.with("meshName"),
    shielded: world.with("node", "shieldMeshName"),
  }
  constructor() {
    this.disposables.add(this.queries.meshed.onEntityAdded.subscribe(this.meshedOnEntityAdded))
    this.disposables.add(this.queries.shielded.onEntityAdded.subscribe(this.shieldedOnEntityAdded))
    this.disposables.add(this.queries.meshed.onEntityRemoved.subscribe(this.meshedOnEntityRemoved))
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable()
    }
  }

  shieldedOnEntityAdded = (entity: Entity) => {
    MeshedSystem.addShieldMesh(entity, entity.shieldMeshName)
  }

  meshedOnEntityAdded = (entity: Entity) => {
    if (!entity.meshName) {
      return
    }
    // create the mesh
    MeshedSystem.addEntityMesh(entity, entity.meshName)
  }

  meshedOnEntityRemoved = (entity) => {
    DEBUG && console.log("[meshed] disposing entity", entity)
    const oldNode = entity.node
    if (oldNode == undefined) {
      return
    }
    const children = oldNode.getChildMeshes()
    for (let mi = 0; mi < children.length; mi += 1) {
      const mesh = children[mi]
      mesh.isVisible = false
      // in the past i've seen stutters when too many meshes are disposed at once
      // it might be a good idea to add these to a queue and dispose a set limit per frame
      DEBUG && console.log("[meshed] disposing mesh", mesh)
      mesh.dispose()
    }
    if (entity.trailMeshs) {
      entity.trailMeshs.disposables.forEach((mesh) => {
        mesh.dispose()
      })
    }
    oldNode.dispose()
  }

  static addLineMesh(entity: Entity, meshName: string, existingNode?: TransformNode) {
    const meshNode = ObjModels[meshName] as TransformNode
    const node = existingNode ?? entity.node ?? new TransformNode(`${entity}-${meshName}-node-${i}`)
    const children = meshNode.getChildMeshes()
    for (let mi = 0; mi < children.length; mi += 1) {
      const mesh = children[mi]
      const lines = GreasedLineModel.fromMesh(mesh, { thresholdAngle: 10, color: "#ff0000" })
      lines.setParent(node)
    }
    if (entity.node == undefined) {
      world.addComponent(entity, "node", node)
    }
  }

  static addWireframeMesh(entity: Entity, meshName: string, existingNode?: TransformNode) {
    const meshNode = ObjModels[meshName] as TransformNode
    const node = existingNode ?? entity.node ?? new TransformNode(`${entity}-${meshName}-node-${i}`)
    const children = meshNode.getChildMeshes()
    let mat: StandardMaterial = undefined
    mat = new StandardMaterial(`${meshName}-mat-wireframe-${i}`)
    mat.emissiveColor = Color3.White()
    mat.diffuseColor = Color3.White()
    mat.specularColor = Color3.Black()
    mat.wireframe = true
    for (let mi = 0; mi < children.length; mi += 1) {
      const mesh = children[mi]
      // TODO: we could actually make instances instead of cloning
      const instanceMesh = (mesh as Mesh).clone(`${meshName}-mesh-${i}-${mi}`, node)
      if (mat != undefined) {
        instanceMesh.material = mat
      }
      instanceMesh.isVisible = true
    }
  }

  static addEntityMesh(entity: Entity, meshName: string, existingNode?: TransformNode) {
    const meshNode = ObjModels[meshName] as TransformNode
    const node = existingNode ?? entity.node ?? new TransformNode(`${entity}-${meshName}-node-${i}`)
    const children = meshNode.getChildMeshes()
    let mat: StandardMaterial = undefined
    let engineMesh: Mesh = undefined
    let radius = 0
    if (entity.meshColor != undefined) {
      mat = new StandardMaterial(`${meshName}-mat-${i}`)
      mat.emissiveColor = new Color3(entity.meshColor.r, entity.meshColor.g, entity.meshColor.b)
      mat.diffuseColor = new Color3(entity.meshColor.r, entity.meshColor.g, entity.meshColor.b)
      mat.specularColor = Color3.Black()
    }
    for (let mi = 0; mi < children.length; mi += 1) {
      const mesh = children[mi]
      // TODO: we could actually make instances instead of cloning
      const instanceMesh = (mesh as Mesh).clone(`${meshName}-mesh-${i}-${mi}`, node)
      instanceMesh.isVisible = true
      if (mat != undefined) {
        instanceMesh.material = mat
      }
      if (instanceMesh.material?.name == "engine") {
        // found the engine mesh
        engineMesh = instanceMesh
        engineMesh.material = engineMesh.material.clone(engineMesh.material.name + "_engine")
      }
      const meshRadius = instanceMesh.getBoundingInfo().boundingSphere.radius
      if (meshRadius > radius) {
        radius = meshRadius
      }
    }
    if (entity.node == undefined) {
      world.addComponent(entity, "node", node)
    }
    if (engineMesh) {
      world.addComponent(entity, "engineMesh", engineMesh)
    }
    if (entity.physicsRadius == undefined) {
      world.addComponent(entity, "physicsRadius", radius)
    } else if (entity.physicsRadius < radius) {
      entity.physicsRadius = radius
    }
  }

  static addShieldMesh(entity: Entity, meshName: string, existingNode?: TransformNode) {
    let shieldMesh: Mesh
    const node = existingNode ?? entity.node ?? new TransformNode(`${entity}-${meshName}-node-${i}`)
    const hullMesh = ObjModels[meshName] as TransformNode
    const hullChildren = hullMesh.getChildMeshes()
    // there should be only one child
    let radius = 0
    for (let mi = 0; mi < hullChildren.length; mi += 1) {
      const mesh = hullChildren[mi]
      const instanceMesh = (mesh as Mesh).clone(`${meshName}-hull-${i}-${mi}`, node)
      const mat = new StandardMaterial(`${meshName}-mat-${i}`)
      mat.emissiveColor = new Color3(0, 0, 0.5)
      mat.diffuseColor = new Color3(0, 0, 0.5)
      mat.specularColor = Color3.Black()
      mat.alpha = 0
      mat.wireframe = true
      instanceMesh.material = mat
      instanceMesh.isVisible = true
      shieldMesh = instanceMesh
      let meshRadius = instanceMesh.getBoundingInfo().boundingSphere.radius
      if (meshRadius > radius) {
        radius = meshRadius
      }
    }
    if (entity.node == undefined) {
      world.addComponent(entity, "node", node)
    }
    if (entity.physicsRadius == undefined) {
      world.addComponent(entity, "physicsRadius", radius)
    } else if (entity.physicsRadius < radius) {
      entity.physicsRadius = radius
    }
    if (shieldMesh) {
      world.addComponent(entity, "shieldMesh", shieldMesh)
    }
  }

  static addCockpitMesh(entity: Entity, meshName: string, existingNode?: TransformNode) {
    const meshNode = ObjModels[meshName] as TransformNode
    const node = existingNode ?? entity.node ?? new TransformNode(`${entity}-${meshName}-node-${i}`)
    const children = meshNode.getChildMeshes()
    for (let mi = 0; mi < children.length; mi += 1) {
      const mesh = children[mi]
      // TODO: we could actually make instances instead of cloning
      const instanceMesh = (mesh as Mesh).clone(`${meshName}-mesh-${i}-${mi}`, node)
      instanceMesh.isVisible = true
    }
  }
}
