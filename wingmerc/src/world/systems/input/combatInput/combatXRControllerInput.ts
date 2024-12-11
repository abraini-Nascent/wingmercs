import { FireCommand, MovementCommand, world } from "./../../../world"
import {
  IDisposable,
  ISceneLoaderAsyncResult,
  Mesh,
  Quaternion,
  SceneLoader,
  TransformNode,
  Vector3,
  WebXRInputSource,
} from "@babylonjs/core"
import { VRSystem } from "../../renderSystems/vrSystem"
import { AppContainer } from "../../../../app.container"
import { ToRadians } from "../../../../utils/math"
import { DebounceTimedMulti } from "../../../../utils/debounce"

const DebounceIds = {
  SpeedDown: 101,
  SpeedUp: 102,
  Camera: 103,
  WeaponSelect: 104,
  GunSelect: 105,
  WeaponFire: 106,
  Target: 107,
  Lock: 108,
}

export class CombatXRControllerInput implements IDisposable {
  static current: CombatXRControllerInput | undefined
  inXR = false
  initialRightGripOrientation: Quaternion | null = null
  initialLeftGripOrientation: Quaternion | null = null
  inputDebounce: DebounceTimedMulti = new DebounceTimedMulti()
  // rightJoystick: TransformNode
  // rightJoystickGhost: TransformNode
  // leftJoystick: TransformNode
  leftSqueeze: boolean = false
  rightSqueeze: boolean = false
  get hotas(): boolean {
    return this.leftSqueeze && this.rightSqueeze
  }

  constructor() {
    CombatXRControllerInput.current = this
    // SceneLoader.ImportMeshAsync("", "./assets/models/joystick.glb").then((result) => {
    // glb root node
    // this.rightJoystick = result.transformNodes[0]
    // this.leftJoystick = this.rightJoystick.clone("left", undefined)
    // this.rightJoystick.scaling.setAll(0.1)
    // this.rightJoystick.getChildMeshes().forEach((m) => {
    //   m.rotate(Vector3.UpReadOnly, ToRadians(90))
    //   ;(m as Mesh).bakeCurrentTransformIntoVertices()
    // })
    // this.rightJoystick.setEnabled(false)
    // this.rightJoystickGhost = this.rightJoystick.clone("right-ghost", undefined)
    // this.rightJoystickGhost.setEnabled(false)
    // this.leftJoystick.scaling.setAll(0.1)
    // this.leftJoystick.setEnabled(false)
    // })
  }

  dispose() {}
  update() {
    this.checkXR()
  }
  checkXR() {
    if (VRSystem.inXR) {
      if (this.inXR == false) {
        console.log("[xr input] entering xr")
        this.inXR = true
      }
      // handle xr input
      this.handleXrInput()
    } else if (VRSystem.inXR == false && this.inXR) {
      console.log("[xr input] leaving xr")
      this.inXR = false
    }
  }
  handleXrInput() {
    const input = VRSystem.xr.input
    const player = AppContainer.instance.player.playerEntity
    // if (this.rightJoystick && player.node && this.rightJoystick.parent == undefined) {
    //   this.rightJoystick.parent = player.node
    // }
    let moveCommand = player.movementCommand as MovementCommand
    if (moveCommand == undefined) {
      moveCommand = {} as MovementCommand
      world.addComponent(player, "movementCommand", moveCommand)
    }
    let fireCommand = player.fireCommand as FireCommand
    if (fireCommand == undefined) {
      fireCommand = {} as FireCommand
      world.addComponent(player, "fireCommand", fireCommand)
    }
    for (const controller of input.controllers) {
      const motion = controller.motionController
      if (motion == undefined) {
        continue
      }
      if (motion.handedness == "right") {
        this.handleRight(controller, moveCommand, fireCommand)
      }
      if (motion.handedness == "left") {
        this.handleLeft(controller, moveCommand, fireCommand)
      }
      this.pointerUpdate()
    }
  }
  handleRight(controller: WebXRInputSource, moveCommand: MovementCommand, fireCommand: FireCommand) {
    const aButton = controller.motionController.getComponent("a-button")
    const bButton = controller.motionController.getComponent("b-button")
    const thumbstick = controller.motionController.getComponent("xr-standard-thumbstick")
    const trigger = controller.motionController.getComponent("xr-standard-trigger")
    const squeeze = controller.motionController.getComponent("xr-standard-squeeze")?.pressed ?? false
    if (squeeze) {
      this.rightSqueeze = true
      const orientationQuaternion = controller.grip?.rotationQuaternion

      if (orientationQuaternion) {
        if (!this.initialRightGripOrientation) {
          this.initialRightGripOrientation = orientationQuaternion.clone() // Save the initial "zero" orientation
          // if (this.rightJoystick) {
          //   this.rightJoystick.setEnabled(true)
          //   this.rightJoystickGhost.setEnabled(true)
          //   this.rightJoystick.position.set(0, -0.1, 0)
          //   this.rightJoystickGhost.position.set(0, -0.1, 0)
          //   this.rightJoystick.parent = controller.grip
          //   if (this.rightJoystick.rotationQuaternion == undefined) {
          //     this.rightJoystick.rotationQuaternion = this.initialRightGripOrientation.clone()
          //   }
          // }
        }
        // this.rightJoystick?.rotationQuaternion.copyFrom(orientationQuaternion)
        // Compute relative orientation by applying the inverse of the initial orientation
        const relativeOrientation = this.initialRightGripOrientation.invert().multiply(orientationQuaternion)
        const axes = getJoystickFromQuaternion(relativeOrientation, ToRadians(35))
        console.log(`Virtual Joystick Right X: ${axes.x}, Y: ${axes.y}`)
        moveCommand.pitch = axes.y * -1
        moveCommand.yaw = axes.x
      }
    } else {
      this.rightSqueeze = false
      this.initialRightGripOrientation = undefined
      // this.rightJoystick.setEnabled(false)
      // this.rightJoystickGhost.setEnabled(false)
      if (thumbstick) {
        moveCommand.roll = thumbstick.axes.x
        moveCommand.deltaSpeed = thumbstick.axes.y
        moveCommand.drift = thumbstick.pressed ? 1 : 0
      }
    }
    if (trigger) {
      fireCommand.gun = trigger.pressed ? 1 : 0
    }
    if (aButton && aButton.pressed) {
      if (this.inputDebounce.tryNow(DebounceIds.Target)) {
        fireCommand.target = aButton.pressed
      }
    } else {
      this.inputDebounce.clear(DebounceIds.Target)
    }
    if (bButton && bButton.pressed) {
      if (this.inputDebounce.tryNow(DebounceIds.Lock)) {
        fireCommand.lock = bButton.pressed
      }
    } else {
      this.inputDebounce.clear(DebounceIds.Lock)
    }
  }
  handleLeft(controller: WebXRInputSource, moveCommand: MovementCommand, fireCommand: FireCommand) {
    const xButton = controller.motionController.getComponent("x-button")
    const yButton = controller.motionController.getComponent("y-button")
    const thumbstick = controller.motionController.getComponent("xr-standard-thumbstick")
    const trigger = controller.motionController.getComponent("xr-standard-trigger")
    const squeeze = controller.motionController.getComponent("xr-standard-squeeze")?.pressed ?? false

    if (squeeze) {
      this.leftSqueeze = true
      const orientationQuaternion = controller.grip?.rotationQuaternion

      if (orientationQuaternion) {
        if (!this.initialLeftGripOrientation) {
          this.initialLeftGripOrientation = orientationQuaternion.clone() // Save the initial "zero" orientation
          // this.leftJoystick?.setEnabled(true)
          // this.leftJoystick?.position.copyFrom(controller.grip.position)
          // if (this.leftJoystick?.rotationQuaternion == undefined) {
          //   this.leftJoystick.rotationQuaternion = this.initialLeftGripOrientation.clone()
          // }
        }
        // this.leftJoystick?.position.copyFrom(controller.grip.absolutePosition)
        // this.leftJoystick?.rotationQuaternion.copyFrom(orientationQuaternion)
        // Compute relative orientation by applying the inverse of the initial orientation
        const relativeOrientation = this.initialLeftGripOrientation.invert().multiply(orientationQuaternion)
        const throttle = getJoystickFromQuaternion(relativeOrientation, Math.PI / 2)
        const roll = getJoystickFromQuaternion(relativeOrientation, ToRadians(35))
        console.log(`Virtual Joystick Left Throttle X: ${throttle.x}, Y: ${throttle.y}`)
        console.log(`Virtual Joystick Left Roll X: ${throttle.x}, Y: ${throttle.y}`)
        // range is 90 degrees to we can add some dead zone and extreme limits
        if (Math.abs(throttle.y) > (1 / 90) * 10) {
          // over the dead zone
          if (Math.abs(throttle.y) < (1 / 90) * 45) {
            // under extreme limit
            moveCommand.deltaSpeed = 25 * (throttle.y > 0 ? -1 : 1) // clamp from 15 / 45 degrees
          } else {
            if (throttle.y > 0) {
              moveCommand.brake = 1
            } else {
              moveCommand.afterburner = 1
            }
          }
        }
        if (Math.abs(roll.x) > (1 / 35) * 10) {
          moveCommand.roll = roll.x * -1
        }
      }
    } else {
      this.leftSqueeze = false
      this.initialLeftGripOrientation = undefined
      // this.leftJoystick.setEnabled(false)
      if (thumbstick) {
        moveCommand.afterburner = thumbstick.pressed ? 1 : 0
        moveCommand.pitch = thumbstick.axes.y
        moveCommand.yaw = thumbstick.axes.x
      }
    }
    if (trigger && trigger.pressed) {
      if (this.inputDebounce.tryNow(DebounceIds.WeaponFire)) {
        fireCommand.weapon = trigger.pressed ? 1 : 0
      }
    } else {
      this.inputDebounce.clear(DebounceIds.WeaponFire)
    }
    if (yButton && yButton.pressed) {
      if (this.inputDebounce.tryNow(DebounceIds.GunSelect)) {
        fireCommand.nav = yButton.pressed
      }
    } else {
      this.inputDebounce.clear(DebounceIds.GunSelect)
    }
    if (xButton && xButton.pressed) {
      moveCommand.drift = 1
    }
  }

  pointerUpdate() {
    if (this.hotas) {
      VRSystem.setPointerEnabled(false)
    } else {
      VRSystem.setPointerEnabled(true)
    }
  }
}

type Radians = number
function getJoystickFromQuaternion(
  rotationQuaternion: Quaternion,
  maxTilt: Radians = Math.PI / 4 // 45 degrees
): { x: number; y: number } {
  // Convert quaternion to Euler angles
  const euler = rotationQuaternion.toEulerAngles()

  // Use yaw (y-axis rotation) for left/right axis
  // Use pitch (x-axis rotation) for up/down axis

  // Map the Euler angles to the -1 to +1 range:
  // Assuming -PI/4 to +PI/4 as a comfortable range of tilt for joystick-like control.
  // Adjust as needed for sensitivity.

  // Normalize values by dividing by maxTilt and clamping to -1 to 1
  const x = Math.max(-1, Math.min(1, euler.y / maxTilt)) // Left/Right
  const y = Math.max(-1, Math.min(1, -euler.x / maxTilt)) // Up/Down (negated to match joystick Y direction)

  return { x, y }
}
