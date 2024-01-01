import { FireCommand, MovementCommand, world } from './../world/world';
import { GamepadManager, Xbox360Pad } from "@babylonjs/core";
import { AppContainer } from "../app.container";

const DriftThreshold = 1000
const SlowThreshold = 333
export class InputAgent {
  gamepadManager: GamepadManager
  playerGamepad: number
  driftTime: number
  slowDebounce: number
  fastDebounce: number
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
    
    if (gamepad.buttonA) {
      console.log("[A]")
      this.driftTime += dt
      if (this.driftTime > DriftThreshold) {
        movementCommand.drift = 1
      } else {
        if (this.slowDebounce == 0) {
          movementCommand.deltaSpeed = -25
        }
        this.slowDebounce += dt
        if (this.slowDebounce > SlowThreshold) {
          this.slowDebounce == 0
        }
      }
    } else {
      this.driftTime = 0
      this.slowDebounce = 0
    }
    if (gamepad.buttonLB) {
      movementCommand.brake = 1
    }

    // pitch yaw roll
    movementCommand.pitch = gamepad.leftStick.y
    movementCommand.yaw = gamepad.leftStick.x
    movementCommand.roll = gamepad.rightStick.x * -1

    /// AFTERBURNER - ACCELERATE
    // "SPACE" [32]
    if (gamepad.buttonLeftStick) {
      movementCommand.afterburner = 1
    }
    // "0" [48]
    if (gamepad.buttonB) {
      if (this.fastDebounce == 0) {
        movementCommand.deltaSpeed = +25
      }
      this.fastDebounce += dt
      if (this.fastDebounce > SlowThreshold) {
        this.fastDebounce = 0
      }
    } else {
      this.fastDebounce = 0
    }

    world.update(AppContainer.instance.player.playerEntity, "movementCommand", movementCommand)

    const fireCommand: FireCommand = AppContainer.instance.player.playerEntity.fireCommand ?? { gun: 0, weapon: 0 }
    if (gamepad.rightTrigger > 0.2) {
      fireCommand.gun = 1
    }
    if (gamepad.buttonY) {
      fireCommand.weapon = 1
    }
    world.update(AppContainer.instance.player.playerEntity, "fireCommand", fireCommand)
  }
}