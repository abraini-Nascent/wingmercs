import {
  IDisposable,
  AxesViewer,
  Color3,
  LinesMesh,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  Texture,
} from "@babylonjs/core"
import { VRSystem } from "../../renderSystems/vrSystem"
import { setSpriteBackUVs, setSpriteUVs } from "../../../../utils/sprites"

const HandThumbDownOffset = 3
const HandClosed = 129
const HandPointer = 130
const HandOpen = 131

const GestureDistance = 0.05

const DEBUG = false

export class MotionHands implements IDisposable {
  static id = "motionHands"
  lastUpdate = 0
  inXR = false
  controllersAdded = false

  leftPlane: Mesh
  rightPlane: Mesh
  leftMaterial: StandardMaterial
  rightMaterial: StandardMaterial
  leftHandType: number = 2
  rightHandType: number = 2

  handsTexture: Texture

  moved: boolean = false
  movementPoints: Vector3[] = []
  lastPoint: Vector3
  movementVectors: Vector3[] = []
  debugLines: LinesMesh
  pointMeshes: Mesh[] = []
  debugMesh: Mesh
  debugAxis: AxesViewer
  normalAxis: AxesViewer

  constructor() {
    this.handsTexture = new Texture("assets/hands/hands.png", undefined, undefined, false, Texture.NEAREST_LINEAR)
    this.handsTexture.hasAlpha = true
  }

  dispose() {
    this.leftPlane?.dispose()
    this.rightPlane?.dispose()
    this.leftMaterial?.dispose()
    this.rightMaterial?.dispose()
    this.handsTexture?.dispose()
  }

  update(dt) {
    this.checkXR()
  }

  checkXR() {
    if (VRSystem.inXR) {
      if (this.inXR == false) {
        console.log("[xr input] entering xr")
        this.beginXrInput()
        this.inXR = true
      }
      // handle xr input
      this.handleXrInput()
    } else if (VRSystem.inXR == false && this.inXR) {
      console.log("[xr input] leaving xr")
      this.inXR = false
    }
  }

  beginXrInput() {
    this.leftPlane = MeshBuilder.CreatePlane("left-hand", {
      size: 0.2,
      sideOrientation: Mesh.DOUBLESIDE,
      updatable: true,
    })
    this.rightPlane = MeshBuilder.CreatePlane("right-hand", {
      size: 0.2,
      sideOrientation: Mesh.DOUBLESIDE,
      updatable: true,
    })
    this.leftMaterial = new StandardMaterial("left-Material")
    this.rightMaterial = new StandardMaterial("right-Material")
    this.leftMaterial.diffuseTexture = this.handsTexture.clone()
    this.rightMaterial.diffuseTexture = this.handsTexture.clone()
    this.leftMaterial.diffuseColor = new Color3(98 / 255, 74 / 255, 46 / 255)
    this.rightMaterial.diffuseColor = new Color3(98 / 255, 74 / 255, 46 / 255)

    this.leftPlane.material = this.leftMaterial
    this.rightPlane.material = this.rightMaterial

    this.rightPlane.isPickable = false
    this.rightPlane.isNearPickable = false

    this.leftPlane.isPickable = false
    this.leftPlane.isNearPickable = false

    this.leftPlane.rotation.y = (-80 * Math.PI) / 180
    this.leftPlane.rotation.z = (-135 * Math.PI) / 180

    this.rightPlane.rotation.y = (-100 * Math.PI) / 180
    this.rightPlane.rotation.z = (-135 * Math.PI) / 180

    setSpriteUVs(this.leftPlane, 2, 6, 2)
    setSpriteBackUVs(this.leftPlane, 2 + 6, 6, 2)
    setSpriteUVs(this.rightPlane, 2, 6, 2)
    setSpriteBackUVs(this.rightPlane, 2 + 6, 6, 2)
  }

  handleXrInput() {
    const input = VRSystem.xr.input
    // console.log("[xr input] XR Input ", input)
    for (const controller of input.controllers) {
      const motion = controller.motionController
      if (motion == undefined) {
        continue
      }
      let plane = this.rightPlane
      let handType = this.rightHandType
      if (motion.handedness == "left") {
        plane = this.leftPlane
        handType = this.leftHandType
      } else if (motion.handedness == "right") {
        plane = this.rightPlane
        handType = this.rightHandType
      } else {
        continue
      }
      let squeeze = motion.getComponentOfType("squeeze")?.pressed ?? false
      let trigger = motion.getComponentOfType("trigger")?.pressed ?? false
      let thumbrest = motion.getComponent("thumbrest")?.touched ?? false
      let spriteIndex = 2 // open
      if (thumbrest && trigger && squeeze) {
        spriteIndex = 3 // fist
      } else if (squeeze && !thumbrest && !trigger) {
        spriteIndex = 1 // finger guns
      } else if (squeeze && thumbrest && !trigger) {
        spriteIndex = 4 // point
      } else if (squeeze && !thumbrest && trigger) {
        spriteIndex = 0 // thumbs up
      } else if (!squeeze && thumbrest && !trigger) {
        spriteIndex = 5 // thumbs down fingers out
      }
      if (handType != spriteIndex) {
        if (motion.handedness == "left") {
          setSpriteUVs(plane, spriteIndex, 6, 2)
          setSpriteBackUVs(plane, spriteIndex + 6, 6, 2)
          this.leftHandType = spriteIndex
        } else {
          // TODO i need to figure out how to flip this plane around so it faces inside
          setSpriteUVs(plane, spriteIndex + 6, 6, 2)
          setSpriteBackUVs(plane, spriteIndex, 6, 2)
          this.rightHandType = spriteIndex
        }
      }
      plane.parent = controller.grip ?? controller.pointer
    }
  }
}

// onControllersSet = (oldValue: MotionControllerState, newValue: MotionControllerState) => {
//   switch (newValue.state) {
//     case "added":
//       const input = System.contexts.get(Contexts.Input) as Input
//       const scene = System.contexts.get(Contexts.BabylonScene) as Scene
//       // create the hand mesh
//       let left = this.meshManager.create("leftHand", HandOpen)
//       this.leftSprite = left
//       left.index = HandOpen
//       let leftMesh: InstancedMesh = left.instance as unknown as InstancedMesh
//       // scale hand to 12 cm
//       leftMesh.scaling = new Vector3(0.096, 0.096, 0.096)

//       let leftInputSource = input.leftInputSource
//       leftMesh.isPickable = false
//       leftMesh.parent =  leftInputSource.grip || leftInputSource.pointer
//       // leftMesh.rotation.x = 90 * Math.PI/180
//       leftMesh.rotation.y = -90 * Math.PI/180
//       leftMesh.rotation.z = -135 * Math.PI/180

//       // create the hand mesh
//       let right = this.meshManager.create("leftHand", HandOpen)
//       this.rightSprite = right
//       right.index = HandOpen
//       let rightMesh: InstancedMesh = right.instance as unknown as InstancedMesh
//       rightMesh.isPickable = false
//       // scale hand to 12 cm
//       rightMesh.scaling = new Vector3(0.096, 0.096, 0.096)
//       rightMesh.rotation.y = -90 * Math.PI/180
//       rightMesh.rotation.z = -135 * Math.PI/180
//       // add the mesh to the controller
//       let rightInputSource = input.rightInputSource
//       rightMesh.parent = rightInputSource.grip || rightInputSource.pointer

//       //// test item sprites
//       // let pivotBox = MeshBuilder.CreateBox("pivot-box", { size: 2.5/16 * 0.4 }, scene)
//       // let pivotBox = MeshBuilder.CreateSphere("pivot-example", {diameter: 2.5/16 * 0.4}, scene)
//       // move the handle into the position of the hand
//       let rightItem = this.itemMeshManager.create("rightItem", 64)
//       rightItem.instance.isVisible = false
//       // rightItem.index = 64
//       // rightItem.playKeyframeAnimation("weapons", [64,65,66,67,68,69,70,71], true, 1000)
//       let rightItemMesh: InstancedMesh = rightItem.instance as unknown as InstancedMesh
//       rightItemMesh.isPickable = false
//       rightItemMesh.scaling = new Vector3(0.4, 0.4, 0.4) // 1 meter sprite
//       // rotate the item into alignment with the hand

//       rightItemMesh.rotation.y = -90 * Math.PI/180
//       rightItemMesh.rotation.z = -45 * Math.PI/180
//       rightItemMesh.addRotation(-5 * Math.PI/180,0,0)
//       // rightItemMesh.rotation = new Vector3(0,0,0)

//       rightItemMesh.parent = rightInputSource.grip || rightInputSource.pointer
//       let windowa = window as any
//       windowa.rightItemMesh = rightItemMesh
//       this.rightItemSprite = rightItem

//       this.controllersAdded = true
//       console.log("[MotionHands] Hand Meshes Loaded")

//       if (DEBUG) {
//         // this.debugLines = LinesBuilder.CreateLines("hand-lines", { updatable: true, points: [] }, scene)
//         // this.debugLines.color = new Color3(1,0,0)

//         this.pointMeshes = [0.2,0.4,0.6,0.8,1].map((c) => {
//           let mesh = MeshBuilder.CreateSphere("point-1", { diameter: 0.025 }, scene);
//           let mat = new StandardMaterial("ball-" + c, scene)
//           // mat.emissiveColor = new Color3(c,c,c)
//           mat.diffuseColor = new Color3(c,c,c)
//           mat.specularColor = new Color3(0,0,0)
//           mesh.material = mat
//           return mesh
//         })

//         this.debugMesh = MeshBuilder.CreateSphere("debug-sphere", { diameter: 0.2 }, scene)
//         let dmat = new StandardMaterial("ball-d", scene)
//         // mat.emissiveColor = new Color3(c,c,c)
//         dmat.diffuseColor = new Color3(0,0,0)
//         dmat.specularColor = new Color3(0,0,0)
//         this.debugMesh.material = dmat
//         this.debugMesh.parent = leftInputSource.grip || leftInputSource.pointer
//         this.debugAxis = new AxesViewer(scene, 0.2)
//         this.normalAxis = new AxesViewer(scene, 0.25)
//       }
//       this.debugAxis = new AxesViewer(scene, 0.2)
//       break
//     case "removed":
//       this.controllersAdded = false
//       // dispose hand meshes
//       if (this.rightItemSprite) {
//         this.rightItemSprite.instance.dispose()
//         this.rightItemSprite = undefined
//       }
//       this.leftSprite.instance.dispose()
//       this.leftSprite = undefined
//       this.rightSprite.instance.dispose()
//       this.rightSprite = undefined

//       //// debug items to dispose
//       if (DEBUG) {
//         this.normalAxis.dispose()
//         this.normalAxis = undefined
//         this.debugAxis.dispose()
//         this.debugAxis = undefined
//         this.debugMesh.dispose()
//         this.debugMesh = undefined
//         for (let mesh of this.pointMeshes) {
//           mesh.dispose()
//         }
//         this.pointMeshes = []
//       }
//       break
//   }
// }
// getPlayerHeldItem() {
//   const level = LevelModel.currentLevel
//   if (level == undefined || level.state != "ready") { return }
//   const player = Component.Tag.firstWith(Tags.Player)
//   if (player == undefined) { return }
//   const equipment = Equipment.from(player)
//   if (equipment == undefined) { return }
//   let sprite = equipment.handHeldSprite
//   if (this.rightItemSprite == undefined) { return }
//   if (sprite == undefined) {
//     this.rightItemSprite.instance.isVisible = false
//   } else {
//     let spriteData = SpriteData[sprite]
//     this.rightItemSprite.instance.isVisible = true
//     this.rightItemSprite.index = spriteData.index
//     let rightItemMesh = this.rightItemSprite.instance

//     if (spriteData.handRotation != undefined) {
//       rightItemMesh.rotation = new Vector3(0,0,0)
//       rightItemMesh
//         .addRotation(spriteData.handRotation.x,0,0)
//         .addRotation(0,spriteData.handRotation.y,0)
//         .addRotation(0,0,spriteData.handRotation.z)
//     } else {
//       rightItemMesh.rotation.y = -90 * Math.PI/180
//       rightItemMesh.rotation.z = -45 * Math.PI/180
//       rightItemMesh.rotation.x = 0
//       rightItemMesh.addRotation(-5 * Math.PI/180,0,0)

//     }
//   }
// }
