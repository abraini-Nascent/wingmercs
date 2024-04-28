import { DeviceSourceManager, DeviceType, PointerInput, Scalar, TransformNode } from "@babylonjs/core"
import { Display, FireCommand, MovementCommand, world } from "../../../world"
import { KeyboardMap } from "../../../../utils/keyboard"
import { Dirk } from "../../../../data/ships"
import { Inspector } from "@babylonjs/inspector"
import { AppContainer } from "../../../../app.container"
import { DebounceTimed, DebounceTimedMulti } from "../../../../utils/debounce"

const LeftDisplays: Display[] = ["damage", "guns", "weapons"]
const RightDisplays: Display[] = ["target"]

const FastThreshold = 333
let dsm: DeviceSourceManager
let vduDebounce = new DebounceTimed()
let inputDebounce = new DebounceTimedMulti()
let ramp = 0


function lockPointer() {
  // Pointer lock
  const canvas = AppContainer.instance.engine.getRenderingCanvas()
  console.log('locking pointer')
  canvas.requestPointerLock = canvas.requestPointerLock ||
    canvas.msRequestPointerLock ||
    canvas.mozRequestPointerLock ||
    canvas.webkitRequestPointerLock;

  if (canvas.requestPointerLock) {
    canvas.requestPointerLock()
  }
}

let captured = false
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
  /// WEAPON COMMANDS
  let fire = 0
  let weapon = 0
  let lock = false
  let target = 0
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
  const mouse = dsm.getDeviceSource(DeviceType.Mouse)

  /// capture mouse?!
  if (mouse.getInput(PointerInput.LeftClick) && captured == false) {
    // lockPointer()
    document.body.style.cursor = "url('assets/crosshairs/crosshairs_01.png'), auto";
    captured = true
  }
  if (keyboard?.getInput(KeyboardMap.ESCAPE) && captured) {
    captured = false
    document.body.style.cursor = "none";
  }
  if (captured) {
    if (mouse.getInput(PointerInput.LeftClick)) {
      fire = 1
    }
    if (mouse.getInput(PointerInput.RightClick)) {
      weapon = 1
    }
    let height = AppContainer.instance.engine.getRenderHeight();
    let width = AppContainer.instance.engine.getRenderWidth();

    // Calculate 80% of the largest width or height
    let validRange = Math.min(width, height) * 0.8;

    // Calculate the center of the window
    let centerX = width / 2;
    let centerY = height / 2;

    let horizontal = mouse.getInput(PointerInput.Horizontal);
    let vertical = mouse.getInput(PointerInput.Vertical);

    // Clamp horizontal and vertical inputs within 80% range centered to the middle
    let clampedHorizontal = Math.max(-1, Math.min(1, (horizontal - centerX) / (validRange / 2)));
    let clampedVertical = Math.max(-1, Math.min(1, (vertical - centerY) / (validRange / 2)));

    let yaw = clampedHorizontal;
    let pitch = clampedVertical; // Invert pitch to match typical conventions

    movementCommand.yaw = yaw;
    movementCommand.pitch = pitch;
  }
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
  if (keyboard?.getInput(KeyboardMap.LEFT)) {
    if (mod) {
      rollLeft = 1
      movementCommand.roll = -1
    } else {
      left = Scalar.Lerp(0, -1, Math.min(1, ramp / FastThreshold))
      movementCommand.yaw = left
    }
  }
  // "OPEN_BRACKET", // [219]
  if (keyboard?.getInput(KeyboardMap.OPEN_BRACKET)) {
    if (inputDebounce.tryNow(KeyboardMap.OPEN_BRACKET)) {
      let displayIdx =
        LeftDisplays.findIndex((d) => {
          return d == playerEntity.vduState.left
        }) + 1
      if (displayIdx >= LeftDisplays.length) {
        displayIdx = 0
      }
      playerEntity.vduState.left = LeftDisplays[displayIdx]
    }
  } else {
    inputDebounce.clear(KeyboardMap.OPEN_BRACKET)
  }
  // "CLOSE_BRACKET", // [221]
  if (keyboard?.getInput(KeyboardMap.CLOSE_BRACKET)) {
    if (inputDebounce.tryNow(KeyboardMap.CLOSE_BRACKET)) {
      let displayIdx =
        RightDisplays.findIndex((d) => {
          return d == playerEntity.vduState.right
        }) + 1
      if (displayIdx >= RightDisplays.length) {
        displayIdx = 0
      }
      playerEntity.vduState.right = RightDisplays[displayIdx]
    }
  } else {
    inputDebounce.clear(KeyboardMap.OPEN_BRACKET)
  }

  // WEAPONS SELECT
  if (keyboard?.getInput(KeyboardMap.W) && inputDebounce.tryNow(KeyboardMap.W)) {
    const player = AppContainer.instance.player.playerEntity
    player.vduState.left = "weapons"
    player.weapons.selected += 1
    let weaponCount = player.weapons.mounts.length
    if (player.weapons.selected >= weaponCount) {
      player.weapons.selected = 0
    }
  }
  // GUN SELECT
  if (keyboard?.getInput(KeyboardMap.G) && inputDebounce.tryNow(KeyboardMap.G)) {
    const player = AppContainer.instance.player.playerEntity
    player.vduState.left = "guns"
    player.guns.selected += 1
    let gunGroupCount = player.guns.groups.length
    if (player.guns.selected >= gunGroupCount) {
      player.guns.selected = 0
    }
  }

  /// AFTERBURNER - ACCELERATE
  if (keyboard?.getInput(KeyboardMap.TAB)) {
    movementCommand.afterburner = 1
  }
  /// BRAKE
  if (keyboard?.getInput(KeyboardMap.ALT)) {
    movementCommand.brake = 1
  }
  /// DRIFT
  if (keyboard?.getInput(KeyboardMap.Z)) {
    movementCommand.drift = 1
  }
  /// SPEED UP
  if (keyboard?.getInput(KeyboardMap["9"])) {
    if (inputDebounce.tryNow(KeyboardMap["9"])) {
      movementCommand.deltaSpeed = -25
      let newSpeed = Math.max(playerEntity.setSpeed - 25, 0)
      world.update(playerEntity, "setSpeed", newSpeed)
    }
  } else {
    inputDebounce.clear(KeyboardMap["9"])
  }
  /// SPEED DOWN
  if (keyboard?.getInput(KeyboardMap["0"])) {
    if (inputDebounce.tryNow(KeyboardMap["0"])) {
      movementCommand.deltaSpeed = +25
      let newSpeed = Math.min(playerEntity.setSpeed + 25, playerEntity.engine.cruiseSpeed)
      world.update(playerEntity, "setSpeed", newSpeed)
    }
  } else {
    inputDebounce.clear(KeyboardMap["0"])
  }

  world.update(playerEntity, "movementCommand", movementCommand)
  /// FIRE PROJECTILES
  // "CONTROL" 17
  // "SPACE" [32]
  if (keyboard?.getInput(KeyboardMap.SPACE)) {
    fire = 1
  }
  if (keyboard?.getInput(KeyboardMap.CONTROL)) {
    fire = 1
  }
  /// FIRE WEAPONS
  // "ENTER" 13
  if (keyboard?.getInput(KeyboardMap.ENTER) && inputDebounce.tryNow(KeyboardMap.ENTER)) {
    weapon = 1
  }
  /// LOCK TARGET
  // "L" [76]
  if (keyboard?.getInput(KeyboardMap.L) && inputDebounce.tryNow(KeyboardMap.L)) {
    lock = true
  }
  if (fire || weapon || lock || target) {
    const fireCommand: FireCommand = { gun: fire, weapon, lock }
    world.addComponent(playerEntity, "fireCommand", fireCommand)
  }

  // "TILDE", // [176]
  // ... YOUR SCENE CREATION
  if (keyboard?.getInput(KeyboardMap.TILDE)) {
    Inspector.Show(AppContainer.instance.scene, {})
  }
}
