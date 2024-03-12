import { LatchMulti, LatchOn } from './../../../../utils/debounce';
import { FireCommand, MovementCommand, world } from '../../../world';
import { DualShockPad, GamepadManager, GenericPad, Gamepad, Scalar, Xbox360Pad } from "@babylonjs/core";
import { AppContainer } from "../../../../app.container";
import { DebounceTimedMulti } from '../../../../utils/debounce';
import { inputConfiguration } from './combatInputConfiguration';

const DriftThreshold = 1000
const FastThreshold = 333

const Drift = 0
const Camera = 1
const SpeedUp = 2
const WeaponFire = 3
const WeaponSelect = 4
const GunSelect = 5
const Target = 6

export class CombatControllerInput {
  gamepadManager: GamepadManager
  playerGamepad: Gamepad[] = []
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
        this.genericGamepad.browserGamepad = gamepad.browserGamepad
      }
      this.handleGeneric(dt, this.genericGamepad)
    }
    for (const gamepad of this.gamepadManager.gamepads) {
      
    }
  }

  handleGeneric(dt: number, gamepad: GenericPad) {
    const ic = inputConfiguration
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

    // get movement command from player
    let movementCommand = AppContainer.instance.player.playerEntity.movementCommand ?? {} as MovementCommand
    
    // SPEED DOWN / DRIFT
    if (this.genericButtons.has(ic.SpeedDown)) {
      let driftLatch = this.latchingDebounce.tryNow(Drift)
      if (driftLatch == LatchOn) {
        movementCommand.drift = 1
        this.wasDrift = true
      }
    } else {
      if (this.previous.get(ic.SpeedDown) && this.wasDrift == false) {
        movementCommand.deltaSpeed = -25
      }
      this.wasDrift = false
      this.latchingDebounce.clear(Drift)
    }
    this.previous.set(ic.SpeedDown, this.genericButtons.get(ic.SpeedDown) ?? 0)

    // SPEED UP
    if (this.genericButtons.has(ic.SpeedUp) && this.inputDebounce.tryNow(SpeedUp)) {
      movementCommand.deltaSpeed = +25
    } else if (this.genericButtons.has(ic.SpeedUp) == false) {
      this.inputDebounce.clear(SpeedUp)
    }
    // BRAKE
    if (this.genericButtons.has(ic.Brake)) {
      movementCommand.brake = 1
    }
    // CAMERA
    if (this.genericButtons.has(ic.Camera) && this.inputDebounce.tryNow(Camera)) {
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
    // WEAPONS SELECT
    if (this.genericButtons.has(ic.WeaponSelect) && this.inputDebounce.tryNow(WeaponSelect)) {
      const player = AppContainer.instance.player.playerEntity
      player.vduState.left = "weapons"
      player.weapons.selected += 1
      let weaponCount = player.weapons.mounts.length
      if (player.weapons.selected >= weaponCount) {
        player.weapons.selected = 0
      }
    }

    // PITCH YAW ROLL
    if (gamepad.leftStick.y || gamepad.leftStick.x) {
      this.ramp += dt
    }
    if (gamepad.leftStick.y) {
      let pitch = Scalar.Lerp(0, gamepad.leftStick.y, Math.min(1, this.ramp / FastThreshold))
      movementCommand.pitch = pitch
    }
    if (gamepad.leftStick.x) {
      let yaw = Scalar.Lerp(0, gamepad.leftStick.x, Math.min(1, this.ramp / FastThreshold))
      movementCommand.yaw = yaw
    }
    if (!gamepad.leftStick.y && !gamepad.leftStick.x) {
      this.ramp = 0
    }
    movementCommand.roll = gamepad.rightStick.x * -1

    /// AFTERBURNER - ACCELERATE
    if (this.genericButtons.has(ic.Afterburner)) {
      movementCommand.afterburner = 1
    }

    world.update(AppContainer.instance.player.playerEntity, "movementCommand", movementCommand)
    console.log("[combat input]", movementCommand)

    const fireCommand: FireCommand = AppContainer.instance.player.playerEntity.fireCommand ?? { gun: 0, weapon: 0, lock: false }
    if (this.genericButtons.get(ic.GunFire) > 0.2) {
      fireCommand.gun = 1
    }
    if (this.genericButtons.has(ic.WeaponFire) && this.inputDebounce.tryNow(WeaponFire)) {
      fireCommand.weapon = 1
    }
    if (this.genericButtons.has(ic.Target) && this.inputDebounce.tryNow(Target)) {
      fireCommand.lock = true
    }
    world.update(AppContainer.instance.player.playerEntity, "fireCommand", fireCommand)
  }
}