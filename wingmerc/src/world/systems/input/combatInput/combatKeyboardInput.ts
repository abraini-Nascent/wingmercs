import { DeviceSourceManager, DeviceType, Scalar, TransformNode } from "@babylonjs/core"
import { Display, FireCommand, MovementCommand, world } from "../../../world"
import { KeyboardMap } from "../../../../utils/keyboard"
import { Dirk } from "../../../../data/ships"
import { Inspector } from "@babylonjs/inspector"
import { AppContainer } from "../../../../app.container"
import { DebounceTimed } from "../../../../utils/debounce"

const LeftDisplays: Display[] = ["damage", "guns", "weapons"]
const RightDisplays: Display[] = ["target"]

const FastThreshold = 333
let dsm: DeviceSourceManager
let vduDebounce = new DebounceTimed()
let ramp = 0
/**
 *
 * @param dt delta time in milliseconds
 */
export function combatKeyboardInput(dt: number) {
  if (dsm == undefined) {
    dsm = new DeviceSourceManager(AppContainer.instance.engine)
  }
  const playerEntity = AppContainer.instance.player.playerEntity
  const movementCommand: MovementCommand = {
    afterburner: 0,
    brake: 0,
    deltaSpeed: 0,
    drift: 0,
    pitch: 0,
    roll: 0,
    yaw: 0,
  } as MovementCommand
  /// STEER / ROLL PITCH YAW
  let up = 0,
    down = 0,
    left = 0,
    right = 0,
    rollLeft = 0,
    rollRight = 0
  // "SHIFT" [16]
  const mod = dsm
    .getDeviceSource(DeviceType.Keyboard)
    ?.getInput(KeyboardMap.SHIFT)
    ? true
    : false
  // "Z" [90]
  const drift = dsm
    .getDeviceSource(DeviceType.Keyboard)
    ?.getInput(KeyboardMap.Z)
    ? true
    : false
  if (drift) {
    movementCommand.drift = 1
  }
  const keyboard = dsm.getDeviceSource(DeviceType.Keyboard)
  if (keyboard?.getInput(KeyboardMap.UP) || keyboard?.getInput(KeyboardMap.DOWN) ||
    keyboard?.getInput(KeyboardMap.LEFT) || keyboard?.getInput(KeyboardMap.RIGHT)) {
    ramp += dt
  } else {
    ramp = 0
  }
  // "UP" [38]
  if (keyboard?.getInput(KeyboardMap.UP)) {
    up = Scalar.Lerp(0, 1, Math.min(1, ramp / FastThreshold))
    movementCommand.pitch = up
  }
  // "DOWN" [40]
  if (keyboard?.getInput(KeyboardMap.DOWN)) {
    down = Scalar.Lerp(0, -1, Math.min(1, ramp / FastThreshold))
    movementCommand.pitch = down
  }
  // "RIGHT" [39]
  if (keyboard?.getInput(KeyboardMap.RIGHT)) {
    if (mod) {
      rollRight = 1
      movementCommand.roll = 1
    } else {
      right = Scalar.Lerp(0, 1, Math.min(1, ramp / FastThreshold))
      movementCommand.yaw = right
    }
  }
  // "LEFT" [37]
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.LEFT)) {
    if (mod) {
      rollLeft = 1
      movementCommand.roll = -1
    } else {
      left = Scalar.Lerp(0, -1, Math.min(1, ramp / FastThreshold))
      movementCommand.yaw = left
    }
  }
  // "OPEN_BRACKET", // [219]
  if (
    dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.OPEN_BRACKET)
  ) {
    if (vduDebounce.tryNow()) {
      let displayIdx =
        LeftDisplays.findIndex((d) => {
          return d == playerEntity.vduState.left
        }) + 1
      if (displayIdx >= LeftDisplays.length) {
        displayIdx = 0
      }
      playerEntity.vduState.left = LeftDisplays[displayIdx]
    }
  }

  // "CLOSE_BRACKET", // [221]
  if (
    dsm
      .getDeviceSource(DeviceType.Keyboard)
      ?.getInput(KeyboardMap.CLOSE_BRACKET)
  ) {
    if (vduDebounce.tryNow()) {
      let displayIdx =
        RightDisplays.findIndex((d) => {
          return d == playerEntity.vduState.right
        }) + 1
      if (displayIdx >= RightDisplays.length) {
        displayIdx = 0
      }
      playerEntity.vduState.right = RightDisplays[displayIdx]
    }
  }

  /// AFTERBURNER - ACCELERATE
  // "TAB" [9]
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.TAB)) {
    movementCommand.afterburner = 1
  }
  // "ALT" [18]
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.ALT)) {
    movementCommand.brake = 1
  }
  // "9" [57]
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap["9"])) {
    // TODO: debounce?
    movementCommand.deltaSpeed = -25
    let newSpeed = Math.max(playerEntity.setSpeed - 25, 0)
    world.update(playerEntity, "setSpeed", newSpeed)
  }
  // "0" [48]
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap["0"])) {
    // TODO: debounce?
    movementCommand.deltaSpeed = +25
    let newSpeed = Math.min(playerEntity.setSpeed + 25, Dirk.cruiseSpeed)
    world.update(playerEntity, "setSpeed", newSpeed)
  }

  world.update(playerEntity, "movementCommand", movementCommand)
  /// FIRE PROJECTILES
  // "CONTROL" 17
  // "SPACE" [32]
  let fire = 0
  let weapon = 0
  let lock = false
  let target = 0
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.SPACE)) {
    fire = 1
  }
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.CONTROL)) {
    fire = 1
  }
  /// FIRE WEAPONS
  // "ENTER" 13
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.ENTER)) {
    weapon = 1
  }
  /// LOCK TARGET
  // "L" [76]
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.L)) {
    lock = true
  }
  if (fire || weapon || lock || target) {
    const fireCommand: FireCommand = { gun: fire, weapon, lock }
    world.addComponent(playerEntity, "fireCommand", fireCommand)
  }

  // "TILDE", // [176]
  // ... YOUR SCENE CREATION
  if (dsm.getDeviceSource(DeviceType.Keyboard)?.getInput(KeyboardMap.TILDE)) {
    Inspector.Show(AppContainer.instance.scene, {})
  }
}
