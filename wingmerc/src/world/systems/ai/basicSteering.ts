import { Quaternion, Vector3 } from "@babylonjs/core"

/** the steering error (-180 to 180 degrees) is clamped to -90 to 90 and normalized to -1 to 1, an error of < 1 degree is clamped to 0 */
export function SteeringHardNormalizeClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  // console.log("[SteeringHardNormalizeClamp] error", { pitch, roll, yaw})
  // remove less than 1 degree
  pitch = (Math.abs(pitch) <= Math.PI / 180) ? 0 : pitch
  yaw = (Math.abs(yaw) <= Math.PI / 180) ? 0 : yaw
  roll = (Math.abs(roll) <= Math.PI / 180) ? 0 : roll
  // clamp
  pitch = clamp(pitch, -Math.PI / 2, Math.PI / 2)
  yaw = clamp(yaw, -Math.PI / 2, Math.PI / 2)
  roll = clamp(roll, -Math.PI / 2, Math.PI / 2)
  // console.log("[SteeringHardNormalizeClamp] clamp", { pitch, roll, yaw})
  // normalize
  pitch = pitch / (Math.PI / 2)
  yaw = yaw / (Math.PI / 2)
  roll = roll / (Math.PI / 2)
  // console.log("[SteeringHardNormalizeClamp] normalize", { pitch, roll, yaw})

  return { pitch, roll, yaw }
}
/** the steering error (-180 to 180 degrees) is normalized to -1 to 1, an error of < 1 degree is clamped to 0 */
export function SteeringSoftNormalizeClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  pitch = (Math.abs(pitch) <= Math.PI / 180) ? 0 : pitch
  yaw = (Math.abs(yaw) <= Math.PI / 180) ? 0 : yaw
  roll = (Math.abs(roll) <= Math.PI / 180) ? 0 : roll
  pitch = pitch / Math.PI
  yaw = yaw / Math.PI
  roll = roll / Math.PI

  return { pitch, roll, yaw }
}
/** if the steering error is greater than 1 degree a full turn command is given */
export function SteeringHardTurnClamp({ pitch, yaw, roll }: SteeringResult): SteeringResult {
  pitch = (Math.abs(pitch) > Math.PI / 180 ? (pitch < 0 ? -1 : 1) : 0)
  yaw = Math.abs(yaw) > Math.PI / 180 ? (yaw < 0 ? -1 : 1) : 0
  roll = Math.abs(roll) > Math.PI / 180 ? (roll < 0 ? -1 : 1) : 0

  if (yaw != 0 || pitch != 0) {
    roll = 0
  }
  return { pitch, roll, yaw }
}
export type SteeringResult = { pitch: number, roll: number, yaw: number }

export function calculateSteering(dt: number, currentPosition: Vector3, currentRotation: Quaternion, targetPosition: Vector3, clampStrategy?: (input: SteeringResult) => SteeringResult): SteeringResult {
  let error = targetPosition.subtract(currentPosition)
  error = error.applyRotationQuaternion(Quaternion.Inverse(currentRotation)) // transform to local space

  let errorDirection = error.normalizeToNew()
  let pitchError = new Vector3(0,       error.y, error.z).normalize()
  let rollError  = new Vector3(error.x, error.y, 0      ).normalize()
  let yawError   = new Vector3(error.x, 0,       error.z).normalize()

  let pitch = signedAngle(Vector3.Forward(true), pitchError, Vector3.Right()) * -1 // pitch is inverted
  let yaw = signedAngle(Vector3.Forward(true), yawError, Vector3.Up())
  let roll = signedAngle(Vector3.Up(), rollError, Vector3.Forward(true))
  // we need to clamp from -1 to 1
  if (clampStrategy != undefined) {
    return clampStrategy({ pitch, roll, yaw })
  }
  pitch = clampInput(pitch)
  yaw = clampInput(yaw)
  roll = clampInput(roll)
  if (Math.floor(pitch * 100) == 0) {
    pitch = 0
  }
  if (Math.floor(roll * 100) == 0) {
    roll = 0
  }
  if (Math.floor(yaw * 100) == 0) {
    yaw = 0
  }

  return { pitch, roll, yaw }
}

/** Will convert from -180/180 degrees in radians to -1/1 */
function clampInput(angle: number) {
  return angle / Math.PI
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function signedAngle(from: Vector3, to: Vector3, axis: Vector3): number {
  return Vector3.GetAngleBetweenVectors(from, to, axis);
}