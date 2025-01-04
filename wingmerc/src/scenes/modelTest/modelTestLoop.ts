import { MeshedSystem } from "./../../world/systems/renderSystems/meshedSystem"
import { CreateEntity } from "./../../world/world"
import { SkyboxSystems } from "../../world/systems/visualsSystems/skyboxSystems"
import { DebounceTimedMulti } from "../../utils/debounce"
import { GameScene } from "../gameScene"
import { AppContainer } from "../../app.container"
import { ModelTestScreen } from "./modelTestScreen"
import {
  ArcRotateCamera,
  Color3,
  IDisposable,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core"
import { ToRadians } from "../../utils/math"
import { updateRenderSystem } from "../../world/systems/renderSystems/updateRenderSystem"
import { Ships } from "../../data/ships"
import { ObjModels } from "../../assetLoader/objModels"
import { world } from "../../world/world"
import { UpdatePhysicsSystem } from "../../world/systems/renderSystems/updatePhysicsSystem"

const Radius = 50
export class ModelTestLoop implements GameScene, IDisposable {
  screen: ModelTestScreen

  debouncer = new DebounceTimedMulti()
  mesh = new MeshedSystem()
  physics = new UpdatePhysicsSystem()

  // systems

  skyboxSystems: SkyboxSystems

  constructor() {
    const appContainer = AppContainer.instance
    this.screen = new ModelTestScreen()
    appContainer.camera.detachControl()
    appContainer.scene.removeCamera(appContainer.camera)
    appContainer.camera.dispose()
    // appContainer.camera = new ArcRotateCamera("ModelViewerCamera", ToRadians(45), 0, Radius, Vector3.Zero(), appContainer.scene)
    appContainer.camera = new UniversalCamera("uni-cam", new Vector3(0, 0, -50))
    appContainer.camera.attachControl()
    appContainer.camera.maxZ = 50000
    this.skyboxSystems = new SkyboxSystems(appContainer.scene)

    this.setup()
  }

  dispose() {
    this.screen.dispose()
    this.screen = undefined

    // systems
    // dispose systems last since they help with cleanup
    this.skyboxSystems.dispose()
  }

  setup() {
    MeshBuilder.CreateBox("middle", { size: 1 })
    let i = 0
    for (const [shipName, shipDetails] of Object.entries(Ships)) {
      if (shipName == "LiteCarrier") {
        continue
      }
      i += 1
      console.log("Testing ship:", shipName)
      CreateEntity({
        meshName: shipDetails.modelDetails.base,
        physicsMeshName: shipDetails.modelDetails.physics,
        bodyType: "animated",
        position: { x: i * -25, y: 0, z: 0 },
      })
      const meshNode = ObjModels[shipDetails.modelDetails.base] as TransformNode
      // create the mesh
      const baseNode = new TransformNode(`${shipDetails.name}-node-${i}`)
      const children = meshNode.getChildMeshes()
      let mat: StandardMaterial = undefined
      let engineMesh: Mesh = undefined
      let shieldNode: TransformNode = undefined
      let cockpitNode: TransformNode = undefined
      let firstPersonNode: TransformNode = undefined
      let radius: number = 0
      let scale = 1
      baseNode.metadata = {
        keepVisible: true,
      }
      // if (shipDetails.modelDetails.cockpit) {
      //   const baseCockpitNode = ObjModels[shipDetails.modelDetails.cockpit] as TransformNode
      //   cockpitNode = new TransformNode(`${shipDetails.name}-cockpit-node-${i}`)
      //   const children = baseCockpitNode.getChildMeshes()
      //   for (let mi = 0; mi < children.length; mi += 1) {
      //     const mesh = children[mi]
      //     mesh.metadata = {
      //       keepVisible: true,
      //     }
      //     const instanceMesh = (mesh as Mesh).clone(`${shipDetails.name}-mesh-${i}-${mi}`, cockpitNode)
      //     instanceMesh.bakeCurrentTransformIntoVertices()
      //     instanceMesh.visibility = 1
      //     instanceMesh.isVisible = true
      //     if (mat != undefined) {
      //       instanceMesh.material = mat
      //     }
      //   }
      // }

      // if (shipDetails.modelDetails.firstPerson) {
      //   const planeNode = ObjModels[shipDetails.modelDetails.firstPerson] as TransformNode
      //   firstPersonNode = new TransformNode(`${shipDetails.name}-first-node-${i}`)
      //   const children = planeNode.getChildMeshes()
      //   for (let mi = 0; mi < children.length; mi += 1) {
      //     const mesh = children[mi]
      //     mesh.metadata = {
      //       keepVisible: true,
      //     }
      //     const instanceMesh = (mesh as Mesh).clone(`${shipDetails.name}-mesh-${i}-${mi}`, firstPersonNode)
      //     instanceMesh.alwaysSelectAsActiveMesh = true
      //     instanceMesh.bakeCurrentTransformIntoVertices()
      //     instanceMesh.visibility = 1
      //     instanceMesh.isVisible = true
      //     if (mat != undefined) {
      //       instanceMesh.material = mat
      //     }
      //   }
      // }

      for (let mi = 0; mi < children.length; mi += 1) {
        const mesh = children[mi]
        // TODO: we could actually make instances instead of cloning
        const instanceMesh = (mesh as Mesh).clone(`${shipDetails.name}-mesh-${i}-${mi}`, baseNode)
        instanceMesh.visibility = 1
        instanceMesh.isVisible = true
        if (mat != undefined) {
          instanceMesh.material = mat
        }
        if (instanceMesh.material?.name == "engine") {
          // found the engine mesh
          engineMesh = instanceMesh
          engineMesh.material = engineMesh.material.clone(engineMesh.material.name + "_engine")
        }
        if (instanceMesh.getBoundingInfo().boundingSphere.radiusWorld > radius) {
          radius = instanceMesh.getBoundingInfo().boundingSphere.radiusWorld
        }
      }
      if (shipDetails.modelDetails.shield) {
        const hullMesh = ObjModels[shipDetails.modelDetails.shield] as TransformNode
        const hullChildren = hullMesh.getChildMeshes()
        shieldNode = new TransformNode(`${shipDetails.name}-shield-${i}`)
        for (let mi = 0; mi < hullChildren.length; mi += 1) {
          const mesh = hullChildren[mi]
          // TODO: we could actually make instances instead of cloning
          const instanceMesh = (mesh as Mesh).clone(`${shipDetails.name}-hull-${i}-${mi}`, shieldNode)
          instanceMesh.visibility = 1
          instanceMesh.isVisible = true
          const mat = new StandardMaterial(`${shipDetails.name}-mat-${i}`)
          mat.emissiveColor = new Color3(0, 0, 0.5)
          mat.diffuseColor = new Color3(0, 0, 0.5)
          mat.specularColor = Color3.Black()
          mat.alpha = 1
          mat.wireframe = true
          instanceMesh.material = mat
          instanceMesh.isVisible = true
          if (instanceMesh.getBoundingInfo().boundingSphere.radiusWorld > radius) {
            radius = instanceMesh.getBoundingInfo().boundingSphere.radiusWorld
          }
        }
      }
      baseNode.position.x += i * 20
      if (shieldNode) {
        shieldNode.position.x = baseNode.position.x
        shieldNode.position.y = -20
      }
      if (firstPersonNode) {
        firstPersonNode.position.x = baseNode.position.x
        firstPersonNode.position.y = +20
      }
      if (cockpitNode) {
        cockpitNode.position.x = baseNode.position.x
        cockpitNode.position.y = +20
      }
    }
  }

  checkInput(dt: number) {}

  runLoop = (delta: number) => {
    const scene = AppContainer.instance.scene
    this.screen.updateScreen(delta)

    this.skyboxSystems.update(delta)
    updateRenderSystem()

    scene.render()
  }
}
