import { Quaternion, Vector3 } from "@babylonjs/core";
import { queries } from "../world";


/**
 * applies the entity's component details to the babylonjs transform node
 */
export function rotationalVelocitySystem() {
  for (const { direction, rotation, rotationQuaternion, rotationalVelocity } of queries.rotating) {

    // change the raw objects to babylonjs classes
    // TODO: store these as babylon vecs in the world, this is a lot of instantiation
    let rotationVec = new Vector3(rotation.x, rotation.y, rotation.z);
    let rotationQuaternionB = new Quaternion(rotationQuaternion.x, rotationQuaternion.y, rotationQuaternion.z, rotationQuaternion.w)
    // Quaternion.RotationYawPitchRoll(rotationVec.y, rotationVec.x, rotationVec.z);
    // helpful yaw, pitch, roll implementation found in https://playground.babylonjs.com/#UL7W2M
    const { pitch, yaw, roll } = rotationalVelocity;
    var axis = new Vector3(0, 0, -1);
    var partRotQuat  = new Quaternion();

    Quaternion.RotationAxisToRef(axis, toRadians(roll), partRotQuat);
    (rotationQuaternionB as Quaternion).multiplyInPlace(partRotQuat);

    Quaternion.RotationAxisToRef(axis.set(-1, 0, 0), toRadians(pitch), partRotQuat);
    rotationQuaternionB.multiplyInPlace(partRotQuat);

    Quaternion.RotationAxisToRef(axis.set(0, 1, 0), toRadians(yaw), partRotQuat);
    rotationQuaternionB.multiplyInPlace(partRotQuat);
    
    rotationQuaternionB.toEulerAnglesToRef(rotationVec);

    // move the values back into the entity
    rotationQuaternion.x = rotationQuaternionB.x
    rotationQuaternion.y = rotationQuaternionB.y
    rotationQuaternion.z = rotationQuaternionB.z
    rotationQuaternion.w = rotationQuaternionB.w
    rotation.y = rotationVec.y
    rotation.x = rotationVec.x
    rotation.z = rotationVec.z
    const forward = new Vector3(0, 0, -1)
    forward.applyRotationQuaternionInPlace(rotationQuaternionB)
    direction.y = forward.y
    direction.x = forward.x
    direction.z = forward.z
  }
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}