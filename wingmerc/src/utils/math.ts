import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";

export function DegreeToRadian(degrees: number): number {
  return degrees * (Math.PI/180)
}

export function Vector3FromObj(obj: {x: number, y: number, z: number}): Vector3 {
  return new Vector3(obj.x, obj.y, obj.z)
}

export function QuaternionFromObj(obj: {x: number, y: number, z: number, w: number}): Quaternion {
  return new Quaternion(obj.x, obj.y, obj.z, obj.w);
}

export function ToDegree(radians: number): number {
  return radians * 180 / Math.PI
}

export function ToRadians(degrees) {
  return degrees * (Math.PI / 180)
}

// unsigned angle in radians between two vectors, smallest possible angle, between 0 and 180
export function AngleBetweenVectors(vector1: Vector3, vector2: Vector3): number {
  // Calculate the dot product of normalized vectors
  const dotProduct = Vector3.Dot(vector1.normalize(), vector2.normalize());

  // Ensure dot product is within valid range [-1, 1]
  const clampedDotProduct = clamp(dotProduct, -1, 1);

  // Calculate the angle in radians using the arc cosine
  const angleRadians = Math.acos(clampedDotProduct);

  return angleRadians;
}

/** Function to calculate lead for intercepting a moving target */
export function firstOrderIntercept(
  shooterPosition: Vector3,
  shooterVelocity: Vector3,
  targetPosition: Vector3,
  targetVelocity: Vector3,
  projectileSpeed: number
): Vector3 | null {
  const relativePosition = targetPosition.subtract(shooterPosition);
  const relativeVelocity = targetVelocity.subtract(shooterVelocity);

  const timeToIntercept = relativePosition.length() / (
      projectileSpeed - Vector3.Dot(relativeVelocity.normalize(), relativePosition.normalize())
  );

  if (isFinite(timeToIntercept) && timeToIntercept > 0) {
      return targetPosition.add(targetVelocity.scale(timeToIntercept));
  } else {
      // The intercept is not possible
      return null;
  }
}

/** Rotate vector1 towards vector2 by angle in radians */
export function rotateByAngle(vector1: Vector3, vector2: Vector3, angle: number) {
  // Create a rotation matrix
  const rotationMatrix = Matrix.RotationAxis(vector2, angle);
  // Rotate vector1 towards vector2 by the specified angle
  const rotated = vector1.rotateByQuaternionToRef(Quaternion.FromRotationMatrix(rotationMatrix), new Vector3());
  return rotated;
}

export function calculateSteering(currentPosition: Vector3, currentRotation: Quaternion, targetPosition: Vector3): { pitch: number, roll: number, yaw: number } {
  let error = targetPosition.subtract(currentPosition)
  error = error.applyRotationQuaternion(Quaternion.Inverse(currentRotation)) // transform to local space

  let errorDirection = error.normalizeToNew()
  let pitchError = new Vector3(0,       error.y, error.z).normalize()
  let rollError  = new Vector3(error.x, error.y, 0      ).normalize()
  let yawError   = new Vector3(error.x, 0,       error.z).normalize()

  let targetInput = new Vector3()
  let pitch = signedAngle(Vector3.Forward(true), pitchError, Vector3.Right()) * -1
  let yaw = signedAngle(Vector3.Forward(true), yawError, Vector3.Up())
  let roll = signedAngle(Vector3.Up(), rollError, Vector3.Forward(true))
  // we need to clamp from -1 to 1
  pitch = clamp(pitch, -1, 1)
  yaw = clamp(yaw, -1, 1)
  roll = clamp(roll, -1, 1)
  targetInput.x = pitch
  targetInput.y = yaw
  targetInput.z = roll

  // TODO: clamp turning speeds to ship roll, pitch, yaw capabilities
  return { pitch, roll: 0, yaw }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function signedAngle(from: Vector3, to: Vector3, axis: Vector3): number {
  
  return Vector3.GetAngleBetweenVectors(from, to, axis);

  // Calculate the cross product between 'from' and 'to'
  let cross = Vector3.Cross(from, to);

  // Check the direction of the cross product to determine the sign of the angle
  let dot = Vector3.Dot(axis, cross);
  let sign = dot < 0 ? -1 : 1;

  // Apply the sign to the unsigned angle
  let signedAngle = unsignedAngle * sign;

  return signedAngle;
}