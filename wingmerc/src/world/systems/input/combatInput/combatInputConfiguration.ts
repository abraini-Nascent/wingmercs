
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
  Right: 15
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
  10: "LS",
  11: "RS",
  12: "Up",
  13: "Down",
  14: "Left",
  15: "Right",
}

export const InputNames = {
"Afterburner": "Afterburner",
"Brake": "Brake",
"Drift": "Drift",
"Camera": "Camera",
"SpeedUp": "Speed Up",
"SpeedDown": "Speed Down",
"WeaponFire": "Weapon Fire",
"WeaponSelect": "Weapon Select",
"GunFire": "Gun Fire",
"GunSelect": "Gun Select",
"Target": "Target",
"Pitch": "Pitch",
"Roll": "Roll",
"Yaw": "Yaw",
}

export const KeyboardKeys = {
  "Afterburner": "Tab",
  "Brake": "Alt",
  "Drift": "Z",
  "SpeedUp": "0",
  "SpeedDown": "9",
  "WeaponFire": "Enter",
  "WeaponSelect": "W",
  "GunFire": "Space/\nCtrl",
  "GunSelect": "G",
  "Target": "T",
  "Pitch": "Up/\nDown",
  "Roll": "Shift+\nYaw",
  "Yaw": "Left/\nRight",
}

class CombatInputConfiguration {

  Afterburner: number
  Brake: number
  Drift: number
  Camera: number
  SpeedUp: number
  SpeedDown: number
  WeaponFire: number
  WeaponSelect: number
  GunFire: number
  GunSelect: number
  Target: number
  Pitch: string
  Roll: string
  Yaw: string

  private useMemory = null

  constructor() {
    if (this.load() == false) {
      // load default
      this.Afterburner = GenericButtons.LS
      this.Brake = GenericButtons.LB
      this.Drift = GenericButtons.B
      this.Camera = GenericButtons.Up
      this.SpeedUp = GenericButtons.A
      this.SpeedDown = GenericButtons.B
      this.WeaponFire = GenericButtons.X
      this.WeaponSelect = GenericButtons.Left
      this.GunFire = GenericButtons.RT
      this.GunSelect = GenericButtons.Right
      this.Target = GenericButtons.Y
      // TODO these should be broken into the axis number
      this.Pitch = "leftStick"
      this.Roll = "rightStick"
      this.Yaw = "leftStick"
    }
  }
  save() {
    if (this.isLocalStorageAvailable()) {
      const payload = {
        Afterburner: this.Afterburner,
        Brake: this.Brake,
        Drift: this.Drift,
        Camera: this.Camera,
        SpeedUp: this.SpeedUp,
        SpeedDown: this.SpeedDown,
        WeaponFire: this.WeaponFire,
        WeaponSelect: this.WeaponSelect,
        GunFire: this.GunFire,
        GunSelect: this.GunSelect,
        Target: this.Target,
        Pitch: this.Pitch,
        Roll: this.Roll,
        Yaw: this.Yaw,
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
        this.Brake = payload.Brake
        this.Drift = payload.Drift
        this.Camera = payload.Camera
        this.SpeedUp = payload.SpeedUp
        this.SpeedDown = payload.SpeedDown
        this.WeaponFire = payload.WeaponFire
        this.WeaponSelect = payload.WeaponSelect
        this.GunFire = payload.GunFire
        this.GunSelect = payload.GunSelect
        this.Target = payload.Target
        this.Pitch = payload.Pitch
        this.Roll = payload.Roll
        this.Yaw = payload.Yaw
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
      window.localStorage.setItem("check", "true");
      window.localStorage.removeItem("check");
      // console.log("LocalStorage Available")
      this.useMemory = false
      return true;
    } catch(error) {
      // console.log("LocalStorage NOT Available")
      this.useMemory = true
      return false;
    }
  }
}

export const inputConfiguration = new CombatInputConfiguration()