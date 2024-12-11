import { AutoPilotCommand, SetComponent } from "./../../../world"
import { DeviceSourceManager, DeviceType, PointerInput, Scalar, TransformNode } from "@babylonjs/core"
import { Display, FireCommand, MovementCommand, world } from "../../../world"
import { KeyboardMap } from "../../../../utils/keyboard"
import { Inspector } from "@babylonjs/inspector"
import { AppContainer } from "../../../../app.container"
import { DebounceTimedMulti } from "../../../../utils/debounce"
import { AssignedKeyConfig, inputConfiguration } from "./combatInputConfiguration"
import { ToRadians } from "../../../../utils/math"

const LeftDisplays: Display[] = ["damage", "guns", "weapons", "objectives", "debugAi", "debugInput"]
const RightDisplays: Display[] = ["target", "destination", "debugAi"]

const FastThreshold = 333
let dsm: DeviceSourceManager
let inputDebounce = new DebounceTimedMulti()
let ramp = 0

const DebounceIds = {
  Autopilot: 101,
  VDULeft: 102,
  VDURight: 103,
  WeaponSelect: 104,
  GunSelect: 105,
  CameraSelect: 106,
  SpeedUp: 107,
  SpeedDown: 108,
  WeaponFire: 109,
  Lock: 110,
  Target: 111,
  Navigation: 112,
  Comms: {
    open: 200,
    one: 201,
    two: 202,
    three: 203,
    four: 204,
    five: 205,
    six: 206,
  },
}

function lockPointer() {
  // Pointer lock
  const canvas = AppContainer.instance.engine.getRenderingCanvas()
  console.log("locking pointer")
  canvas.requestPointerLock =
    canvas.requestPointerLock ||
    canvas.msRequestPointerLock ||
    canvas.mozRequestPointerLock ||
    canvas.webkitRequestPointerLock

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
  const playerEntity = AppContainer.instance.player?.playerEntity
  if (playerEntity == undefined) {
    return
  }
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
  let target = false
  let nav = false
  /// STEER / ROLL PITCH YAW
  let up = 0,
    down = 0,
    left = 0,
    right = 0,
    rollLeft = 0,
    rollRight = 0

  const keyboard = dsm.getDeviceSource(DeviceType.Keyboard)
  const mouse = dsm.getDeviceSource(DeviceType.Mouse)

  /// MOUSE INPUT
  // capture mouse?!
  if (mouse?.getInput(PointerInput.LeftClick) && captured == false) {
    // lockPointer()
    document.body.style.cursor = "url('assets/crosshairs/crosshairs_01.png'), auto"
    captured = true
  }
  if (keyboard?.getInput(KeyboardMap.ESCAPE) && captured) {
    captured = false
    document.body.style.cursor = "none"
  }
  if (captured) {
    if (mouse?.getInput(PointerInput.LeftClick)) {
      fire = 1
    }
    if (mouse?.getInput(PointerInput.RightClick)) {
      weapon = 1
    }
    let height = AppContainer.instance.engine.getRenderHeight()
    let width = AppContainer.instance.engine.getRenderWidth()

    // Calculate 80% of the largest width or height
    let validRange = Math.min(width, height) * 0.8

    // Calculate the center of the window
    let centerX = width / 2
    let centerY = height / 2

    let horizontal = mouse?.getInput(PointerInput.Horizontal)
    let vertical = mouse?.getInput(PointerInput.Vertical)

    // Clamp horizontal and vertical inputs within 80% range centered to the middle
    let clampedHorizontal = Math.max(-1, Math.min(1, (horizontal - centerX) / (validRange / 2)))
    let clampedVertical = Math.max(-1, Math.min(1, (vertical - centerY) / (validRange / 2)))

    let yaw = clampedHorizontal
    let pitch = clampedVertical // Invert pitch to match typical conventions

    movementCommand.yaw = yaw
    movementCommand.pitch = pitch
  }
  if (
    keyboard?.getInput(KeyboardMap.UP) ||
    keyboard?.getInput(KeyboardMap.DOWN) ||
    keyboard?.getInput(KeyboardMap.LEFT) ||
    keyboard?.getInput(KeyboardMap.RIGHT)
  ) {
    ramp += dt
  } else {
    ramp = 0
  }

  const ic = inputConfiguration.keyboardConfig

  /// HELPER
  const checkAssignedKey = (assignedKey: AssignedKeyConfig) => {
    const checkKey = (key: number): boolean => {
      return (keyboard?.getInput(key) ?? 0) > 0
    }
    if (Array.isArray(assignedKey)) {
      return assignedKey.some((key) => checkKey(key))
    }
    if (typeof assignedKey === "object" && "mod" in assignedKey && "key" in assignedKey) {
      // Do something with the mod and key properties
      const modKeyPressed = checkKey(assignedKey.mod)
      const keyKeyPressed = checkKey(assignedKey.key)
      return modKeyPressed && keyKeyPressed
    }

    if (typeof assignedKey === "number") {
      return checkKey(assignedKey)
    }
    return false
  }
  const checkAssignedDebounceKey = (debounceId: number, assignedKey: AssignedKeyConfig, action: () => void) => {
    if (checkAssignedKey(assignedKey)) {
      if (inputDebounce.tryNow(debounceId)) {
        action()
      }
    } else {
      inputDebounce.clear(debounceId)
    }
  }

  /// Comms
  if (playerEntity.openComms !== undefined) {
    let open = false
    let option: number = undefined
    const options: [string, AssignedKeyConfig, number][] = [
      ["one", ic.CommsOne, 0],
      ["two", ic.CommsTwo, 1],
      ["three", ic.CommsThree, 2],
      ["four", ic.CommsFour, 3],
      ["five", ic.CommsFive, 4],
      ["six", ic.CommsSix, 5],
    ]
    for (const commOption of options) {
      const [debounce, key, index] = commOption
      checkAssignedDebounceKey(DebounceIds.Comms[debounce], key, () => {
        open = true
        option = index
      })
    }
    if (open) {
      world.addComponent(playerEntity, "commsCommand", { open, option })
    }
  } else {
    checkAssignedDebounceKey(DebounceIds.Comms.open, ic.CommsOpen, () => {
      world.addComponent(playerEntity, "openComms", playerEntity.id)
      if (playerEntity.vduState) {
        playerEntity.vduState.left = "comms"
      }
    })
  }

  /// Autopilot
  if (checkAssignedKey(ic.AutoPilot)) {
    if (inputDebounce.tryNow(DebounceIds.Autopilot)) {
      const autoPilotCommand: AutoPilotCommand = {
        autopilot: true,
        runTime: 0,
        wingmen: [],
        location: { x: 100, y: 100, z: 0 }, // TODO this should come from the current targeted nav becon
      }
      world.addComponent(playerEntity, "autoPilotCommand", autoPilotCommand)
    }
  } else {
    inputDebounce.clear(DebounceIds.Autopilot)
  }

  /// PITCH & YAW
  // pitch down
  if (checkAssignedKey(ic.PitchDown)) {
    up = Scalar.Lerp(0, 1, Math.min(1, ramp / FastThreshold))
    movementCommand.pitch = up
  }
  // pitch up
  if (checkAssignedKey(ic.PitchUp)) {
    down = Scalar.Lerp(0, -1, Math.min(1, ramp / FastThreshold))
    movementCommand.pitch = down
  }
  // roll/yaw right
  if (checkAssignedKey(ic.RollRight)) {
    rollRight = 1
    movementCommand.roll = -1
  } else if (checkAssignedKey(ic.YawRight)) {
    right = Scalar.Lerp(0, 1, Math.min(1, ramp / FastThreshold))
    movementCommand.yaw = right
  }
  // roll/yaw left
  if (checkAssignedKey(ic.RollLeft)) {
    rollLeft = 1
    movementCommand.roll = 1
  } else if (checkAssignedKey(ic.YawLeft)) {
    left = Scalar.Lerp(0, -1, Math.min(1, ramp / FastThreshold))
    movementCommand.yaw = left
  }

  /// DISPLAYS
  // left vdu
  if (checkAssignedKey(ic.VDULeft)) {
    if (inputDebounce.tryNow(DebounceIds.VDULeft)) {
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
    inputDebounce.clear(DebounceIds.VDULeft)
  }
  // right vdu
  if (checkAssignedKey(ic.VDURight)) {
    if (inputDebounce.tryNow(DebounceIds.VDURight)) {
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
    inputDebounce.clear(DebounceIds.VDURight)
  }

  /// CAMERA Controls
  if (checkAssignedKey(ic.CameraLeft)) {
    playerEntity.cameraMovement.x -= ToRadians(180 / 1000) * dt // 5 degrees per second
  }
  if (checkAssignedKey(ic.CameraRight)) {
    playerEntity.cameraMovement.x += ToRadians(180 / 1000) * dt // 5 degrees per second
  }
  if (checkAssignedKey(ic.CameraUp)) {
    playerEntity.cameraMovement.y -= ToRadians(180 / 1000) * dt // 5 degrees per second
  }
  if (checkAssignedKey(ic.CameraDown)) {
    playerEntity.cameraMovement.y += ToRadians(180 / 1000) * dt // 5 degrees per second
  }
  if (checkAssignedKey(ic.CameraReset)) {
    playerEntity.cameraDirection.x = 0
    playerEntity.cameraDirection.y = 0
  }

  /// WEAPONS SELECT
  if (checkAssignedKey(ic.VDURight)) {
    if (inputDebounce.tryNow(DebounceIds.VDURight)) {
    }
  } else {
    inputDebounce.clear(DebounceIds.VDURight)
  }

  if (checkAssignedKey(ic.WeaponSelect)) {
    if (inputDebounce.tryNow(DebounceIds.WeaponSelect)) {
      const player = AppContainer.instance.player.playerEntity
      player.vduState.left = "weapons"
      player.weapons.selected += 1
      let weaponCount = player.weapons.mounts.length
      if (player.weapons.selected >= weaponCount) {
        player.weapons.selected = 0
      }
    }
  } else {
    inputDebounce.clear(DebounceIds.WeaponSelect)
  }

  /// GUN SELECT
  if (checkAssignedKey(ic.GunSelect)) {
    if (inputDebounce.tryNow(DebounceIds.GunSelect)) {
      const player = AppContainer.instance.player.playerEntity
      player.vduState.left = "guns"
      player.guns.selected += 1
      let gunGroupCount = player.guns.groups.length
      if (player.guns.selected >= gunGroupCount) {
        player.guns.selected = 0
      }
    }
  } else {
    inputDebounce.clear(DebounceIds.GunSelect)
  }

  /// VIEW SELECT
  if (checkAssignedKey(ic.CameraToggle)) {
    if (inputDebounce.tryNow(DebounceIds.CameraSelect)) {
      let follow = false
      if (AppContainer.instance.player.playerEntity.camera == "follow") {
        SetComponent(AppContainer.instance.player.playerEntity, "camera", "cockpit")
      } else if (AppContainer.instance.player.playerEntity.camera == "cockpit") {
        SetComponent(AppContainer.instance.player.playerEntity, "camera", "follow")
        follow = true
      } else {
        world.addComponent(AppContainer.instance.player.playerEntity, "camera", "follow")
        follow = true
      }
      if (follow) {
        SetComponent(AppContainer.instance.player.playerEntity, "visible", true)
      } else {
        SetComponent(AppContainer.instance.player.playerEntity, "visible", false)
      }
    }
  } else {
    inputDebounce.clear(DebounceIds.CameraSelect)
  }

  /// AFTERBURNER - ACCELERATE
  if (checkAssignedKey(ic.Afterburner)) {
    movementCommand.afterburner = 1
  }
  /// BRAKE
  if (checkAssignedKey(ic.Brake)) {
    movementCommand.brake = 1
  }
  /// DRIFT
  if (checkAssignedKey(ic.Drift)) {
    movementCommand.drift = 1
  }
  /// SPEED UP
  if (checkAssignedKey(ic.SpeedUp)) {
    if (inputDebounce.tryNow(DebounceIds.SpeedUp)) {
      movementCommand.deltaSpeed = +25
      let newSpeed = Math.max(playerEntity.setSpeed + 25, 0)
      SetComponent(playerEntity, "setSpeed", newSpeed)
    }
  } else {
    inputDebounce.clear(DebounceIds.SpeedUp)
  }
  /// SPEED DOWN
  if (checkAssignedKey(ic.SpeedDown)) {
    if (inputDebounce.tryNow(DebounceIds.SpeedDown)) {
      movementCommand.deltaSpeed = -25
      let newSpeed = Math.min(playerEntity.setSpeed - 25, playerEntity.engine.cruiseSpeed)
      SetComponent(playerEntity, "setSpeed", newSpeed)
    }
  } else {
    inputDebounce.clear(DebounceIds.SpeedDown)
  }

  /// ASSIGN Movement Command
  SetComponent(playerEntity, "movementCommand", movementCommand)

  /// WEAPON COMMANDS
  /// FIRE GUNS
  if (checkAssignedKey(ic.GunFire)) {
    fire = 1
  }
  /// FIRE WEAPONS
  if (checkAssignedKey(ic.WeaponFire)) {
    if (inputDebounce.tryNow(DebounceIds.WeaponFire)) {
      weapon = 1
    }
  } else {
    inputDebounce.clear(DebounceIds.WeaponFire)
  }
  /// LOCK TARGET
  if (checkAssignedKey(ic.Lock)) {
    if (inputDebounce.tryNow(DebounceIds.Lock)) {
      lock = true
    }
  } else {
    inputDebounce.clear(DebounceIds.Lock)
  }
  /// TARGET
  if (checkAssignedKey(ic.Target)) {
    if (inputDebounce.tryNow(DebounceIds.Target)) {
      target = true
    }
  } else {
    inputDebounce.clear(DebounceIds.Target)
  }
  /// NEXT NAVIGATION DESTINATION
  if (checkAssignedKey(ic.Navigation)) {
    if (inputDebounce.tryNow(DebounceIds.Navigation)) {
      nav = true
    }
  } else {
    inputDebounce.clear(DebounceIds.Navigation)
  }

  /// ASSIGN FIRE COMMAND
  if (fire || weapon || lock || target || nav) {
    let fireCommand: FireCommand = playerEntity.fireCommand
    if (fireCommand == undefined) {
      fireCommand = {} as FireCommand
      world.addComponent(playerEntity, "fireCommand", fireCommand)
    }
    fireCommand.gun = fire
    fireCommand.weapon = weapon
    fireCommand.lock = lock
    fireCommand.target = target
    fireCommand.nav = nav
  }

  // "TILDE", // [176]
  // ... YOUR SCENE CREATION
  if (keyboard?.getInput(KeyboardMap.BACK_QUOTE)) {
    Inspector.Show(AppContainer.instance.scene, {})
  }
}
