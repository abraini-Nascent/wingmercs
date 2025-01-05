import { Direction } from "yoga-layout"
import { KeyboardMap } from "../../../../utils/keyboard"

const CombatInputConfigurationStorageKey = "wingMerc_CombatInputConfiguration"

export const GenericButtons = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  Select: 8,
  Start: 9,
  LS: 10,
  RS: 11,
  Up: 12,
  Down: 13,
  Left: 14,
  Right: 15,
}

export const GenericButtonNames = {
  0: "A",
  1: "B",
  2: "X",
  3: "Y",
  4: "LB",
  5: "RB",
  6: "LT",
  7: "RT",
  8: "Select",
  9: "Start",
  10: "LSB",
  11: "RSB",
  12: "Up",
  13: "Down",
  14: "Left",
  15: "Right",
}

export const GenericAxisNames = {
  "0": {
    "-1": "LS Left",
    "1": "LS Right",
  },
  "1": {
    "-1": "LS Down",
    "1": "LS Up",
  },
  "2": {
    "-1": "RS Left",
    "1": "RS Right",
  },
  "3": {
    "-1": "RS Down",
    "1": "RS Up",
  },
}

export const InputNames = {
  Afterburner: "Afterburner",
  AutoPilot: "AutoPilot",
  Brake: "Brake",
  Drift: "Drift",
  SpeedUp: "Speed Up",
  SpeedDown: "Speed Down",
  WeaponFire: "Weapon Fire",
  WeaponSelect: "Weapon Select",
  GunFire: "Gun Fire",
  GunSelect: "Gun Select",
  Target: "Target",
  Lock: "Lock",
  Navigation: "Navigation",
  PitchUp: "Pitch Up",
  PitchDown: "Pitch Down",
  RollLeft: "Roll Left",
  RollRight: "Roll Right",
  YawLeft: "Yaw Left",
  YawRight: "Yaw Right",
  VDULeft: "VDU Left",
  VDURight: "VDU Right",
  CameraLeft: "Camera Left",
  CameraRight: "Camera Right",
  CameraUp: "Camera Up",
  CameraDown: "Camera Down",
  CameraReset: "Camera Reset",
  CameraToggle: "Camera Toggle",
  CommsOpen: "Comms Open",
  CommsOne: "Comms One",
  CommsTwo: "Comms Two",
  CommsThree: "Comms Three",
  CommsFour: "Comms Four",
  CommsFive: "Comms Five",
  CommsSix: "Comms Six",
}

export type ControllerInputAssignment =
  | {
      mod?: number
      button?: number
      held?: boolean
      axis?: number
      direction?: number
    }
  | number

export const GamepadAssignedButton = {
  Afterburner: GenericButtons.LS,
  AutoPilot: GenericButtons.X,
  Brake: { held: true, button: GenericButtons.B },
  Drift: { held: true, button: GenericButtons.LB },
  SpeedUp: GenericButtons.A,
  SpeedDown: GenericButtons.B,
  WeaponFire: GenericButtons.LT,
  WeaponSelect: GenericButtons.Left,
  GunFire: GenericButtons.RT,
  GunSelect: GenericButtons.Right,
  Target: GenericButtons.Y,
  Lock: { held: true, button: GenericButtons.Y },
  Navigation: GenericButtons.Down,
  PitchUp: { axis: 1, direction: 1 },
  PitchDown: { axis: 1, direction: -1 },
  YawLeft: { axis: 0, direction: -1 },
  YawRight: { axis: 0, direction: 1 },
  RollLeft: { axis: 2, direction: -1 },
  RollRight: { axis: 2, direction: 1 },
  VDULeft: { mod: GenericButtons.RS, button: GenericButtons.Left },
  VDURight: { mod: GenericButtons.RS, button: GenericButtons.Right },
  CameraLeft: { mod: GenericButtons.RS, axis: 2, direction: -1 },
  CameraRight: { mod: GenericButtons.RS, axis: 2, direction: 1 },
  CameraUp: { mod: GenericButtons.RS, axis: 3, direction: 1 },
  CameraDown: { mod: GenericButtons.RS, axis: 3, direction: -1 },
  CameraReset: GenericButtons.RS,
  CameraToggle: GenericButtons.Up,
}
export type GamepadAssignedButton = keyof typeof GamepadAssignedButton
export type GamepadAssignedButtons = { [button in GamepadAssignedButton]: ControllerInputAssignment }

export type AssignedKeyConfig =
  | {
      mod: number
      key: number
    }
  | number
  | number[]

export const KeyboardAssignedKey = {
  Afterburner: KeyboardMap.TAB,
  AutoPilot: KeyboardMap.A,
  Brake: KeyboardMap.ALT,
  Drift: KeyboardMap.Z,
  SpeedUp: KeyboardMap["0"],
  SpeedDown: KeyboardMap["9"],
  WeaponFire: KeyboardMap.ENTER,
  WeaponSelect: KeyboardMap.W,
  GunFire: [KeyboardMap.CONTROL, KeyboardMap.SPACE],
  GunSelect: KeyboardMap.G,
  Target: KeyboardMap.T,
  Lock: KeyboardMap.L,
  Navigation: KeyboardMap.N,
  PitchUp: KeyboardMap.UP,
  PitchDown: KeyboardMap.DOWN,
  RollLeft: { mod: KeyboardMap.SHIFT, key: KeyboardMap.LEFT },
  RollRight: { mod: KeyboardMap.SHIFT, key: KeyboardMap.RIGHT },
  YawLeft: KeyboardMap.LEFT,
  YawRight: KeyboardMap.RIGHT,
  VDULeft: KeyboardMap.OPEN_BRACKET,
  VDURight: KeyboardMap.CLOSE_BRACKET,
  CameraLeft: { mod: KeyboardMap.SLASH, key: KeyboardMap.LEFT },
  CameraRight: { mod: KeyboardMap.SLASH, key: KeyboardMap.RIGHT },
  CameraUp: { mod: KeyboardMap.SLASH, key: KeyboardMap.UP },
  CameraDown: { mod: KeyboardMap.SLASH, key: KeyboardMap.DOWN },
  CameraReset: { mod: KeyboardMap.SLASH, key: KeyboardMap.PERIOD },
  CameraToggle: KeyboardMap.V,
  CommsOpen: KeyboardMap.C,
  CommsOne: KeyboardMap["1"],
  CommsTwo: KeyboardMap["2"],
  CommsThree: KeyboardMap["3"],
  CommsFour: KeyboardMap["4"],
  CommsFive: KeyboardMap["5"],
  CommsSix: KeyboardMap["6"],
}

export type KeyboardAssignedKey = keyof typeof KeyboardAssignedKey
export type KeyboardAssignedKeys = { [button in KeyboardAssignedKey]: AssignedKeyConfig }

class CombatInputConfiguration {
  gamepadConfig: GamepadAssignedButtons
  keyboardConfig: KeyboardAssignedKeys

  private useMemory = null

  constructor() {
    if (this.load() == false) {
      // load default
      this.gamepadConfig = { ...GamepadAssignedButton }
      this.keyboardConfig = { ...KeyboardAssignedKey }
    }
  }
  save() {
    if (this.isLocalStorageAvailable()) {
      const payload = {
        gamepad: this.gamepadConfig,
        keyboard: this.keyboardConfig,
      }
      localStorage.setItem(CombatInputConfigurationStorageKey, JSON.stringify(payload))
    }
  }
  load(): boolean {
    if (this.isLocalStorageAvailable()) {
      const payloadString = localStorage.getItem(CombatInputConfigurationStorageKey)
      if (payloadString == undefined || payloadString == "") {
        return false
      }
      try {
        const payload = JSON.parse(payloadString)
        if (payload.keyboard) {
          this.keyboardConfig = payload.keyboard as KeyboardAssignedKeys
        }
        if (payload.gamepad) {
          this.gamepadConfig = payload.gamepad as GamepadAssignedButtons
        }
        return true
      } catch (e) {
        console.error("[CombatInputConfiguration] load failed", e)
        return false
      }
    } else {
      return false
    }
  }

  private isLocalStorageAvailable() {
    if (this.useMemory !== null) {
      return !this.useMemory
    }
    try {
      window.localStorage.setItem("check", "true")
      window.localStorage.removeItem("check")
      // console.log("LocalStorage Available")
      this.useMemory = false
      return true
    } catch (error) {
      // console.log("LocalStorage NOT Available")
      this.useMemory = true
      return false
    }
  }
}

export const inputConfiguration = new CombatInputConfiguration()
