import { Curve3, Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import { random } from "./random";

export function DegreeToRadian(degrees: number): number {
  return degrees * (Math.PI/180)
}

export function Vector3FromObj(obj: {x: number, y: number, z: number}, ref?: Vector3 | undefined): Vector3 {
  if (ref != undefined) {
    ref.x = obj.x
    ref.y = obj.y
    ref.z = obj.z
    return ref
  }
  return new Vector3(obj.x, obj.y, obj.z)
}

export function QuaternionFromObj(obj: {x: number, y: number, z: number, w: number}, ref?: Quaternion | Quaternion): Quaternion {
  if (ref) {
    ref.x = obj.x
    ref.y = obj.y
    ref.z = obj.z
    ref.w = obj.w
    return ref
  }
  return new Quaternion(obj.x, obj.y, obj.z, obj.w);
}

export function ToDegree(radians: number): number {
  return radians * 180 / Math.PI
}

export function ToDegree360(radians: number): number {
  const half = radians * 180 / Math.PI
  if (half < 0) {
    return (180 - Math.abs(half)) + 180
  }
  return half
}

export function ToRadians(degrees) {
  return degrees * (Math.PI / 180)
}

/** unsigned angle in radians between two vectors, smallest possible angle, between 0 and 180 */
export function AngleBetweenVectors(vector1: Vector3, vector2: Vector3): number {
  // Calculate the dot product of normalized vectors
  const dotProduct = Vector3.Dot(vector1.normalize(), vector2.normalize());

  // Ensure dot product is within valid range [-1, 1]
  const clampedDotProduct = clamp(dotProduct, -1, 1);

  // Calculate the angle in radians using the arc cosine
  const angleRadians = Math.acos(clampedDotProduct);

  return angleRadians;
}

/** calculates the rotational quaternion needed to rotate a forward vector to match the velocity vector. forward is assumed to be Vector3.Forward() */
export function rotationFromVelocity(velocity: Vector3): Quaternion {
  // Get the forward vector (assumed to be Vector3.Forward())
  const forward = Vector3.Forward();

  // Calculate the angle between the forward vector and the velocity vector
  const angle = Math.acos(Vector3.Dot(forward.normalize(), velocity.normalize()));

  // Calculate the axis of rotation using cross product
  const axis = Vector3.Cross(forward, velocity).normalize();

  // Construct the rotation quaternion
  const rotation = Quaternion.RotationAxis(axis, angle);

  return rotation;
}
/** determine if a second point is behind the first point */
export function isPointBehind(
  firstPosition: Vector3,
  firstVelocity: Vector3,
  secondPosition: Vector3
): boolean {
  // Calculate vector from first point to second point
  const directionVector = secondPosition.subtract(firstPosition);

  // Check if the direction vector aligns with the velocity vector
  return Vector3.Dot(directionVector, firstVelocity) < 0;
}

/** find lerp to point along curve: WARN this can be computationally intense */
export function getCurvePoint(curve: Curve3, at: number) {
  let curvePoints = curve.getPoints();
  let curveLength = curve.length();
  let previousPoint = curvePoints[0];
  let currentPoint: Vector3;
  let currentLength = 0;
  let targetLength = at * curveLength;

  for (let i = 0; i < curvePoints.length; i++) {
      currentPoint = curvePoints[i];
      let distance = Vector3.Distance(previousPoint, currentPoint);
      currentLength += distance;
      if (currentLength === targetLength) {
          return currentPoint.clone();
      } else if (currentLength > targetLength) {
          let toLength = currentLength - targetLength;
          let diff = toLength / distance;
          let dir = previousPoint.subtract(currentPoint);
          return currentPoint.add(dir.scale(diff));
      }
      previousPoint = currentPoint;
  }
  return Vector3.Zero();
}

/** Function to find the closest point on a line segment to a given point */
export function closestPointOnLineSegment(point: Vector3, lineStart: Vector3, lineEnd: Vector3): Vector3 {
  const lineDirection = lineEnd.subtract(lineStart);
  const lineLengthSquared = lineDirection.lengthSquared();

  if (lineLengthSquared === 0) {
    // If the line segment has zero length, return the start point
    return lineStart.clone();
  }

  // Calculate the parameter t for the closest point on the line
  const t = Vector3.Dot(point.subtract(lineStart), lineDirection) / lineLengthSquared;

  if (t < 0) {
    // Closest point is beyond the 'lineStart' end of the line segment
    return lineStart.clone();
  } else if (t > 1) {
    // Closest point is beyond the 'lineEnd' end of the line segment
    return lineEnd.clone();
  } else {
    // Closest point is within the line segment
    const closestPointOnLine = lineStart.add(lineDirection.scale(t));
    return closestPointOnLine;
  }
}

/** Function iterates through each segment of the curve, finding the closest point along the curve to the provided point */
export function closestPointOnCurve(point: Vector3, curve: Curve3): Vector3 {
  let minDistanceSquared = Number.MAX_VALUE;
  let closestPoint = new Vector3();

  // Iterate over each segment in the curve
  for (let i = 0; i < curve.getPoints().length - 1; i++) {
    const lineStart = curve.getPoints()[i];
    const lineEnd = curve.getPoints()[i + 1];

    // Find closest point on the current segment
    const closestPointOnSegment = closestPointOnLineSegment(point, lineStart, lineEnd);

    // Calculate squared distance to the target point
    const distanceSquared = Vector3.DistanceSquared(closestPointOnSegment, point);

    // Update the closest point if necessary
    if (distanceSquared < minDistanceSquared) {
      minDistanceSquared = distanceSquared;
      closestPoint.copyFrom(closestPointOnSegment);
    }
  }

  return closestPoint;
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

export function pointInSphere(radius: number, offset?: Vector3, ref?: Vector3) {
  const phi = random() * Math.PI * 2
  const costheta = 2 * random() - 1
  const theta = Math.acos(costheta)
  let x = radius * Math.sin(theta) * Math.cos(phi)
  let y = radius * Math.sin(theta) * Math.sin(phi)
  let z = radius * Math.cos(theta)
  if (offset) {
    x += offset.x
    y += offset.y
    z += offset.z
  }
  if (ref) {
    ref.set(x, y, z)
    return ref
  }
  return new Vector3(x, y, z)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function signedAngle(from: Vector3, to: Vector3, axis: Vector3): number {
  return Vector3.GetAngleBetweenVectors(from, to, axis);
}