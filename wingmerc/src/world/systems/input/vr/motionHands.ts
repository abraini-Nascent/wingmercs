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
  AbstractMesh,
  Observable,
} from "@babylonjs/core"
import { VRSystem } from "../../renderSystems/vrSystem"
import { setSpriteBackUVs, setSpriteUVs } from "../../../../utils/sprites"

const HandThumbDownOffset = 3
const HandClosed = 129
const HandPointer = 130
const HandOpen = 131

const GestureDistance = 0.05

const DEBUG = false

export class MotionHandCollision {
  state: MotionHandCollision.State = MotionHandCollision.State.outside
  constructor(public mesh: AbstractMesh, public radius: number, public callback: MotionHandCollision.Callback) {}
}
export namespace MotionHandCollision {
  export type Callback = (mesh: AbstractMesh, state: State) => void
  export enum State {
    outside = 0,
    entering = 1,
    continueing = 2,
    exiting = 3,
  }
}

export class MotionHands implements IDisposable {
  static id = "motionHands"
  static instance: MotionHands
  lastUpdate = 0
  inXR = false
  controllersAdded = false

  private collisionChecks: MotionHandCollision[] = []

  leftPointer: Mesh
  leftPlane: Mesh
  rightPointer: Mesh
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
    MotionHands.instance = this
  }

  dispose() {
    this.leftPointer?.dispose()
    this.rightPointer?.dispose()
    this.leftPlane?.dispose()
    this.rightPlane?.dispose()
    this.leftMaterial?.dispose()
    this.rightMaterial?.dispose()
    this.handsTexture?.dispose()
    this.collisionChecks = []
  }

  addCollisionCheck(mesh: AbstractMesh, radius: number, callback: MotionHandCollision.Callback) {
    let collisionCheck = new MotionHandCollision(mesh, radius, callback)
    this.collisionChecks.push(collisionCheck)
  }

  update(dt) {
    this.checkXR()
    if (this.inXR) {
      // TODO debouce?
      // TODO separate collision tick vs framerate
      let leftPointerPosition = this.leftPointer.absolutePosition
      let rightPointerPosition = this.rightPointer.absolutePosition
      for (let collisionCheck of this.collisionChecks) {
        let buttonWorldPosition = collisionCheck.mesh.getAbsolutePosition()
        let leftDistance = leftPointerPosition.subtract(buttonWorldPosition).length()
        let rightDistance = rightPointerPosition.subtract(buttonWorldPosition).length()
        if (leftDistance - collisionCheck.radius < 0.01 || rightDistance - collisionCheck.radius < 0.01) {
          switch (collisionCheck.state) {
            case MotionHandCollision.State.outside:
            case MotionHandCollision.State.exiting: {
              collisionCheck.state = MotionHandCollision.State.entering
              break
            }
            case MotionHandCollision.State.entering: {
              collisionCheck.state = MotionHandCollision.State.continueing
              break
            }
          }
          collisionCheck.callback(collisionCheck.mesh, collisionCheck.state)
        } else {
          switch (collisionCheck.state) {
            case MotionHandCollision.State.outside: {
              continue
              break
            }
            case MotionHandCollision.State.entering:
            case MotionHandCollision.State.continueing: {
              collisionCheck.state = MotionHandCollision.State.exiting
              break
            }
            case MotionHandCollision.State.exiting: {
              collisionCheck.state = MotionHandCollision.State.outside
              break
            }
          }
          collisionCheck.callback(collisionCheck.mesh, collisionCheck.state)
        }
      }
    }
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
    this.leftPointer = MeshBuilder.CreateIcoSphere("left-pointer", { radius: 0.015, subdivisions: 2 })
    this.leftPointer.isVisible = false
    this.rightPointer = MeshBuilder.CreateIcoSphere("right-pointer", { radius: 0.015, subdivisions: 2 })
    this.rightPointer.isVisible = false
    this.leftMaterial = new StandardMaterial("left-Material")
    this.rightMaterial = new StandardMaterial("right-Material")
    this.leftMaterial.diffuseTexture = this.handsTexture.clone()
    this.rightMaterial.diffuseTexture = this.handsTexture.clone()
    this.leftMaterial.diffuseColor = new Color3(98 / 255, 74 / 255, 46 / 255)
    this.rightMaterial.diffuseColor = new Color3(98 / 255, 74 / 255, 46 / 255)
    this.leftMaterial.specularColor = new Color3(98 / 255, 74 / 255, 46 / 255)
    this.rightMaterial.specularColor = new Color3(98 / 255, 74 / 255, 46 / 255)

    this.leftPlane.material = this.leftMaterial
    this.rightPlane.material = this.rightMaterial

    this.rightPlane.isPickable = false
    this.rightPlane.isNearPickable = false

    this.leftPlane.isPickable = false
    this.leftPlane.isNearPickable = false

    this.leftPlane.rotation.y = (-80 * Math.PI) / 180
    this.leftPlane.rotation.z = (-135 * Math.PI) / 180

    this.leftPointer.position.set(-0.0325, 0.09, 0)
    this.leftPointer.parent = this.leftPlane
    this.rightPointer.position.set(-0.0325, 0.09, 0)
    this.rightPointer.parent = this.rightPlane

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
      let pointer = this.rightPointer
      if (motion.handedness == "left") {
        plane = this.leftPlane
        handType = this.leftHandType
        pointer = this.leftPointer
        // pointer.parent = controller.grip ?? controller.pointer
        // this.rightPointer.parent = controller.grip ?? controller.pointer
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
