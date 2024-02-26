import { LatchMulti, LatchOn, LatchToggle } from './../../../../utils/debounce';
import { FireCommand, MovementCommand, world } from '../../../world';
import { GamepadManager, Xbox360Pad } from "@babylonjs/core";
import { AppContainer } from "../../../../app.container";
import { Debounce, DebounceTimedMulti } from '../../../../utils/debounce';

const DriftThreshold = 1000
const SlowThreshold = 333

const Drift = 0
const Camera = 1
const SpeedUp = 2
const WeaponFire = 3
const WeaponSelect = 4
const GunSelect = 5
const Target = 6

export class CombatControllerInput {
  gamepadManager: GamepadManager
  playerGamepad: number
  driftTime: number
  slowDebounce: number
  fastDebounce: number
  inputDebounce: DebounceTimedMulti = new DebounceTimedMulti()
  latchingDebounce: LatchMulti = new LatchMulti()

  constructor() {
    const gamepadManager = new GamepadManager();
    this.gamepadManager = gamepadManager
  }

  checkInput(dt: number) {
    for (const gamepad of this.gamepadManager.gamepads) {
      if (this.playerGamepad != undefined && this.playerGamepad != gamepad.index) {
        continue
      }
      this.playerGamepad = gamepad.index
      if (gamepad instanceof Xbox360Pad) {
        this.handle360(dt, gamepad)
      }
    }
  }

  handle360(dt: number, gamepad: Xbox360Pad) {
    // get movement command from player
    let movementCommand = AppContainer.instance.player.playerEntity.movementCommand ?? {} as MovementCommand
    /// STEER / ROLL PITCH YAW
    let up = 0, down = 0, left = 0, right = 0, rollLeft = 0, rollRight  = 0;
    // "Z" [90]
    const drift = 0
    
    // SPEED DOWN / DRIFT
    if (gamepad.buttonA) {
      let driftLatch = this.latchingDebounce.tryNow(Drift)
      if (driftLatch == LatchToggle) {
        movementCommand.deltaSpeed = -25
      } else if (driftLatch == LatchOn) {
        movementCommand.drift = 1
      }
    } else {
      this.latchingDebounce.clear(Drift)
    }

    if (gamepad.buttonB && this.inputDebounce.tryNow(SpeedUp)) {
      movementCommand.deltaSpeed = +25
    } else if (gamepad.buttonB == 0) {
      this.inputDebounce.clear(SpeedUp)
    }
    // BRAKE
    if (gamepad.buttonLB) {
      movementCommand.brake = 1
    }
    if (gamepad.dPadUp && this.inputDebounce.tryNow(Camera)) {
      if (AppContainer.instance.player.playerEntity.camera == "follow") {
        world.update(AppContainer.instance.player.playerEntity, "camera", "cockpit")
      } else if (AppContainer.instance.player.playerEntity.camera == "cockpit") {
        world.update(AppContainer.instance.player.playerEntity, "camera", "follow")
      } else {
        world.addComponent(AppContainer.instance.player.playerEntity, "camera", "follow")
      }
    }
    if (gamepad.dPadLeft && this.inputDebounce.tryNow(WeaponSelect)) {
      const player = AppContainer.instance.player.playerEntity
      player.weapons.selected += 1
      let weaponCount = player.weapons.mounts.length
      if (player.weapons.selected >= weaponCount) {
        player.weapons.selected = 0
      }
    }

    // pitch yaw roll
    movementCommand.pitch = gamepad.leftStick.y
    movementCommand.yaw = gamepad.leftStick.x
    movementCommand.roll = gamepad.rightStick.x * -1

    /// AFTERBURNER - ACCELERATE
    if (gamepad.buttonLeftStick) {
      movementCommand.afterburner = 1
    }

    world.update(AppContainer.instance.player.playerEntity, "movementCommand", movementCommand)

    const fireCommand: FireCommand = AppContainer.instance.player.playerEntity.fireCommand ?? { gun: 0, weapon: 0, lock: false }
    if (gamepad.rightTrigger > 0.2) {
      fireCommand.gun = 1
    }
    if (gamepad.buttonX && this.inputDebounce.tryNow(WeaponFire)) {
      fireCommand.weapon = 1
    }
    if (gamepad.buttonY && this.inputDebounce.tryNow(Target)) {
      fireCommand.lock = true
    }
    world.update(AppContainer.instance.player.playerEntity, "fireCommand", fireCommand)
  }
}