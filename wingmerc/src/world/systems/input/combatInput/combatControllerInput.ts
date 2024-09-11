import { LatchMulti, LatchOn } from './../../../../utils/debounce';
import { FireCommand, MovementCommand, world } from '../../../world';
import { DualShockPad, GamepadManager, GenericPad, Scalar, Xbox360Pad, Gamepad as BabylonPad } from "@babylonjs/core";
import { AppContainer } from "../../../../app.container";
import { DebounceTimedMulti } from '../../../../utils/debounce';
import { inputConfiguration } from './combatInputConfiguration';
import type { ControllerInputAssignment, GamepadAssignedButtons} from './combatInputConfiguration';
import { ToRadians } from '../../../../utils/math';

const DriftThreshold = 1000
const FastThreshold = 333

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

export class CombatControllerInput {
  gamepadManager: GamepadManager
  playerGamepad: BabylonPad[] = []
  genericGamepad: GenericPad
  driftTime: number
  slowDebounce: number
  fastDebounce: number
  inputDebounce: DebounceTimedMulti = new DebounceTimedMulti()
  latchingDebounce: LatchMulti = new LatchMulti()
  ramp: number = 0

  previous = new Map<number, number>()
  wasDrift = false

  genericGamepadId: string = undefined
  genericButtons = new Map<number, number>()

  constructor() {
    const gamepadManager = new GamepadManager();
    this.gamepadManager = gamepadManager
  }

  checkInput(dt: number) {
    for (let index = 0; index < this.gamepadManager.gamepads.length; index += 1) {
      const gamepad = this.gamepadManager.gamepads[index]
      if (this.playerGamepad[index] == undefined || this.playerGamepad[index] != gamepad) {
        this.playerGamepad[index] = gamepad
        if (this.genericGamepad != undefined) {
          this.genericGamepad.dispose()
          this.genericGamepad = undefined
        }
        if (gamepad instanceof Xbox360Pad) {
          this.genericGamepad = new GenericPad(gamepad.id, gamepad.index, gamepad.browserGamepad)
        }
        if (gamepad instanceof GenericPad) {
          this.genericGamepad = gamepad
        }
        if (gamepad instanceof DualShockPad) {
          this.genericGamepad = new GenericPad(gamepad.id, gamepad.index, gamepad.browserGamepad)
        }
      } else {
        // we need to update the browser gamepad because chrome doesn't update the object
        this.genericGamepad.browserGamepad = gamepad.browserGamepad as Gamepad
      }
      this.handleGeneric(dt, this.genericGamepad)
    }
    for (const gamepad of this.gamepadManager.gamepads) {
      
    }
  }

  adjustedValue = (rawValue: number, exponent: number = 2) => { return Math.sign(rawValue) * Math.pow(Math.abs(rawValue), exponent) };

  handleGeneric(dt: number, gamepad: GenericPad) {
    const ic = inputConfiguration.gamepadConfig
    if (this.genericGamepadId == undefined || this.genericGamepadId != gamepad.id) {
      gamepad.onbuttondown((button) => {
        this.genericButtons.set(button, 1)
      })
      gamepad.onbuttonup((button) => {
        this.genericButtons.delete(button)

      })
      this.genericGamepadId = gamepad.id
    }

    gamepad.update()

    // helper

    const checkAssignedButtons = (assignedInput: ControllerInputAssignment): boolean => {

      if (typeof assignedInput === 'number') {
        return this.genericButtons.has(assignedInput)
      } else if (assignedInput.button !== undefined) {
        if (assignedInput.mod !== undefined) {
          return this.genericButtons.has(assignedInput.button) && this.genericButtons.has(assignedInput.mod)
        }
        if (assignedInput.held) {
          if (this.genericButtons.has(assignedInput.button)) {
            let totalTimeHeld = this.previous.get(assignedInput.button) ?? 0
            if (totalTimeHeld > 300) {
              return true
            } else {
              this.previous.set(assignedInput.button, totalTimeHeld + dt)
              return false
            }
          } else {
            this.previous.delete(assignedInput.button)
            return false
          }
        }
        return this.genericButtons.has(assignedInput.button)
      } else if (assignedInput.axis !== undefined) {
        if (assignedInput.mod && this.genericButtons.has(assignedInput.mod) == false) {
          return false
        }
        let browserGamepad = gamepad.browserGamepad as Gamepad
        let axisValue = browserGamepad.axes[assignedInput.axis]
        if (assignedInput.direction < 0 && axisValue < 0) {
          return true
        }
        if (assignedInput.direction >0 && axisValue > 0) {
          return true
        }
        return false
      }
  
      return false
    }

    const getAssignedAxisValue = (assignedInput: ControllerInputAssignment): number => {
      if (typeof assignedInput === 'number') {
        return 0
      }
      if (assignedInput.axis == undefined) {
        return 0
      }
      let browserGamepad = gamepad.browserGamepad as Gamepad
      let axisValue = browserGamepad.axes[assignedInput.axis]
      return axisValue
    }

    // get movement command from player
    let movementCommand = AppContainer.instance.player.playerEntity.movementCommand ?? {} as MovementCommand
    
    /// DRIFT
    if (checkAssignedButtons(ic.Drift)) {
      movementCommand.drift = 1
    }

    /// BRAKE
    if (checkAssignedButtons(ic.Brake)) {
      movementCommand.brake = 1
    }

    // SPEED DOWN note, can't speed up or down if braking
    if (!movementCommand.brake && checkAssignedButtons(ic.SpeedDown)) {
      if (this.inputDebounce.tryNow(DebounceIds.SpeedDown)) {
        movementCommand.deltaSpeed = -25
      }
    } else {
      this.inputDebounce.clear(DebounceIds.SpeedDown)
    }

    /// SPEED UP
    if (!movementCommand.brake && checkAssignedButtons(ic.SpeedUp) && this.inputDebounce.tryNow(DebounceIds.SpeedUp)) {
      movementCommand.deltaSpeed = +25
    } else if (checkAssignedButtons(ic.SpeedUp) == false) {
      this.inputDebounce.clear(DebounceIds.SpeedUp)
    }
    /// CAMERA
    if (checkAssignedButtons(ic.CameraToggle) && this.inputDebounce.tryNow(DebounceIds.Camera)) {
      let follow = false
      if (AppContainer.instance.player.playerEntity.camera == "follow") {
        world.update(AppContainer.instance.player.playerEntity, "camera", "cockpit")
      } else if (AppContainer.instance.player.playerEntity.camera == "cockpit") {
        world.update(AppContainer.instance.player.playerEntity, "camera", "follow")
        follow = true
      } else {
        world.addComponent(AppContainer.instance.player.playerEntity, "camera", "follow")
        follow = true
      }
      if (follow) {
        world.update(AppContainer.instance.player.playerEntity, "visible", true)
      } else {
        world.update(AppContainer.instance.player.playerEntity, "visible", false)
      }
    }
    /// WEAPONS SELECT
    if (checkAssignedButtons(ic.WeaponSelect) && this.inputDebounce.tryNow(DebounceIds.WeaponSelect)) {
      const player = AppContainer.instance.player.playerEntity
      player.vduState.left = "weapons"
      player.weapons.selected += 1
      let weaponCount = player.weapons.mounts.length
      if (player.weapons.selected >= weaponCount) {
        player.weapons.selected = 0
      }
    } else if (checkAssignedButtons(ic.WeaponSelect) == false) {
      this.inputDebounce.clear(DebounceIds.WeaponSelect)
    }
    /// GUN SELECT
    if (checkAssignedButtons(ic.GunSelect) && this.inputDebounce.tryNow(DebounceIds.GunSelect)) {
      const player = AppContainer.instance.player.playerEntity
      player.vduState.left = "guns"
      player.guns.selected += 1
      let gunGroupCount = player.guns.groups.length
      if (player.guns.selected >= gunGroupCount) {
        player.guns.selected = 0
      }
    } else if (checkAssignedButtons(ic.GunSelect) == false) {
      this.inputDebounce.clear(DebounceIds.GunSelect)
    }

    /// AFTERBURNER - ACCELERATE
    if (checkAssignedButtons(ic.Afterburner)) {
      movementCommand.afterburner = 1
    }

    /// PITCH YAW ROLL
    if (checkAssignedButtons(ic.YawLeft) || checkAssignedButtons(ic.YawRight) ||
      checkAssignedButtons(ic.PitchUp) || checkAssignedButtons(ic.PitchDown) ||
      checkAssignedButtons(ic.RollLeft) || checkAssignedButtons(ic.RollRight)) {
      this.ramp += dt
    } else {
      this.ramp = 0
    }
    if (checkAssignedButtons(ic.PitchUp)) {
      let axisValue = getAssignedAxisValue(ic.PitchUp)
      let pitch = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      movementCommand.pitch = this.adjustedValue(pitch * -1)
    } 
    if (checkAssignedButtons(ic.PitchDown)) {
      let axisValue = getAssignedAxisValue(ic.PitchDown)
      let pitch = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      movementCommand.pitch = this.adjustedValue(pitch)
    }
    if (checkAssignedButtons(ic.YawLeft)) {
      let axisValue = getAssignedAxisValue(ic.YawLeft)
      let yaw = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      movementCommand.yaw = this.adjustedValue(yaw * -1)
    } 
    if (checkAssignedButtons(ic.YawRight)) {
      let axisValue = getAssignedAxisValue(ic.YawRight)
      let yaw = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      movementCommand.yaw = this.adjustedValue(yaw)
    }
    if (checkAssignedButtons(ic.RollLeft)) {
      let axisValue = getAssignedAxisValue(ic.RollLeft)
      let roll = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      movementCommand.roll = this.adjustedValue(roll)
    } 
    if (checkAssignedButtons(ic.RollRight)) {
      let axisValue = getAssignedAxisValue(ic.RollRight)
      let roll = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      movementCommand.roll = this.adjustedValue(roll * -1)
    }

    /// CAMERA MOVEMENT

    const playerEntity = AppContainer.instance.player.playerEntity
    let looking = false
    if (checkAssignedButtons(ic.CameraUp)) {
      let axisValue = getAssignedAxisValue(ic.CameraUp)
      let pitch = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      // playerEntity.cameraDirection.y = pitch * ToRadians(160) * -1
      playerEntity.cameraMovement.y -= (pitch * ToRadians((180 / 1000))) * dt // 5 degrees per second
      looking = true
    } 
    if (checkAssignedButtons(ic.CameraDown)) {
      let axisValue = getAssignedAxisValue(ic.CameraDown)
      let pitch = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      // playerEntity.cameraDirection.y = pitch * ToRadians(160)
      playerEntity.cameraMovement.y += (pitch * ToRadians((180 / 1000))) * dt // 5 degrees per second
      looking = true
    }
    if (checkAssignedButtons(ic.CameraLeft)) {
      let axisValue = getAssignedAxisValue(ic.CameraLeft)
      let yaw = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      // playerEntity.cameraDirection.x = yaw * ToRadians(160) * -1
      playerEntity.cameraMovement.x -= (yaw * ToRadians((180 / 1000))) * dt // 5 degrees per second
      looking = true
    } 
    if (checkAssignedButtons(ic.CameraRight)) {
      let axisValue = getAssignedAxisValue(ic.CameraRight)
      let yaw = Math.abs(Scalar.Lerp(0, axisValue, Math.min(1, this.ramp / FastThreshold)))
      // playerEntity.cameraDirection.x = yaw * ToRadians(160)
      playerEntity.cameraMovement.x += (yaw * ToRadians((180 / 1000))) * dt // 5 degrees per second
      looking = true
    }
    if (looking == false && checkAssignedButtons(ic.CameraReset) == false) {
      playerEntity.cameraDirection.x = Scalar.Lerp(playerEntity.cameraDirection.x, 0, 0.5)
      playerEntity.cameraDirection.y = Scalar.Lerp(playerEntity.cameraDirection.y, 0, 0.5)
    }

    /// Assign Movement Command
    world.update(AppContainer.instance.player.playerEntity, "movementCommand", movementCommand)
    // console.log("[combat input]", movementCommand)

    /// Handle Weapon Commands
    const fireCommand: FireCommand = AppContainer.instance.player.playerEntity.fireCommand ?? { gun: 0, weapon: 0, lock: false, target: false, nav: undefined }
    /// FIRE GUN
    if (checkAssignedButtons(ic.GunFire)) { // > 0.2) {
      fireCommand.gun = 1
    }
    /// FIRE WEAPON
    if (checkAssignedButtons(ic.WeaponFire) && this.inputDebounce.tryNow(DebounceIds.WeaponFire)) {
      fireCommand.weapon = 1
    } else if (checkAssignedButtons(ic.WeaponFire) == false) {
      this.inputDebounce.clear(DebounceIds.WeaponFire)
    }
    /// LOCK
    if (checkAssignedButtons(ic.Lock) && this.inputDebounce.tryNow(DebounceIds.Lock)) {
      fireCommand.lock = true
    } else if (checkAssignedButtons(ic.Lock) == false) {
      this.inputDebounce.clear(DebounceIds.Lock)
    }
    /// TARGET
    if (checkAssignedButtons(ic.Target) && this.inputDebounce.tryNow(DebounceIds.Target)) {
      fireCommand.lock = true
    } else if (checkAssignedButtons(ic.Target) == false) {
      this.inputDebounce.clear(DebounceIds.Target)
    }
    /// Assign Fire Command
    world.update(AppContainer.instance.player.playerEntity, "fireCommand", fireCommand)
  }
}