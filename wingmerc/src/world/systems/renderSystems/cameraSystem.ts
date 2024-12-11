import { Camera, FreeCamera, Quaternion, TargetCamera, Vector3, WebXRState } from "@babylonjs/core";
import { RubberbandCameraController } from "../../../camera/rubberbandCameraController";
import { Entity, queries } from "../../world";
import { Vector3FromObj } from "../../../utils/math";
import { VRSystem } from "./vrSystem";

let playerFollowCamera: RubberbandCameraController = undefined;
export function cameraFollowSystem(player: Entity, camera: TargetCamera) {
  if (player?.node == undefined || camera == undefined) { return }

  let ship = player.node
  if (ship && playerFollowCamera == undefined) {
    playerFollowCamera = new RubberbandCameraController(camera, ship)
  } else {
    playerFollowCamera.update()
  }
}

let dramaticCamera: {
  worldPosition?: Vector3
  position?: Vector3
} = {}
export function dramaticCameraSystem(target: Entity, camera: TargetCamera) {
  if (target?.node == undefined || camera == undefined) { return }

  const origin = queries.origin.first?.position ? Vector3FromObj(queries.origin.first?.position) : Vector3.Zero()
  if (dramaticCamera.position == undefined) {
    let forwardOffset = Vector3FromObj(target.direction)
    forwardOffset = forwardOffset.multiplyByFloats(250, 250, 250)
    forwardOffset.x += 50 // lower than plane
    dramaticCamera.worldPosition = Vector3FromObj(target.position).addInPlace(forwardOffset)
    dramaticCamera.position = Vector3FromObj(target.position).addInPlace(forwardOffset).subtractInPlace(origin)
    camera.position.copyFrom(dramaticCamera.position)
  } else {
    dramaticCamera.position = dramaticCamera.worldPosition.subtract(origin)
    camera.position.copyFrom(dramaticCamera.position)
  }
  // console.log("[DramaticCamera] tracking target", target.position)
  camera.setTarget(Vector3FromObj(target.position).subtractInPlace(origin))
}

const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
export function cameraSystem(cameraEntity: Entity, camera: Camera) {
  const origin = queries.origin.first?.position ?? Vector3.Zero()
  if (cameraEntity == undefined) { return }
  let { rotationQuaternion, position } = cameraEntity
  const cameraOverride = queries.cameras.first
  if (VRSystem.xr && VRSystem.xr.baseExperience && VRSystem.xr.baseExperience.state == WebXRState.IN_XR) {
    // do xr camera stuff
    // console.log(VRSystem.xr.baseExperience.camera.rotation)
    const vrCamera = VRSystem.xrCameraParent
    vrCamera.position.x = position.x - origin.x
    vrCamera.position.y = position.y - origin.y
    vrCamera.position.z = position.z - origin.z
    if (vrCamera.rotationQuaternion == undefined) {
      vrCamera.rotationQuaternion = Quaternion.Identity()
    }
    vrCamera.rotationQuaternion.x = rotationQuaternion.x
    vrCamera.rotationQuaternion.y = rotationQuaternion.y
    vrCamera.rotationQuaternion.z = rotationQuaternion.z
    vrCamera.rotationQuaternion.w = rotationQuaternion.w
    return
  }
  if (cameraOverride != undefined && cameraOverride.camera == "dramatic") {
    dramaticCameraSystem(cameraOverride, camera as TargetCamera)
    return
  } else if (dramaticCamera.position != undefined) {
    dramaticCamera.position = undefined
  }
  if (cameraOverride != undefined && cameraOverride.camera == "cockpit") {
    rotationQuaternion = cameraOverride.rotationQuaternion
    position = cameraOverride.position
  } else if (cameraOverride != undefined && cameraOverride.camera == "follow") {
    cameraFollowSystem(cameraOverride, camera as TargetCamera)
    return
  }
   else if (cameraOverride != undefined && cameraOverride.camera == "debug") {
    return
  }
  if (camera instanceof TargetCamera || camera instanceof FreeCamera) {
    if (camera.rotationQuaternion == undefined) {
      camera.rotationQuaternion = new Quaternion(rotationQuaternion.x, rotationQuaternion.y, rotationQuaternion.z, rotationQuaternion.w)
    }
    // Angle to look left or right (in radians)
    const angle = Math.PI / 6; // 30 degrees for example

    if (cameraEntity.cameraMovement?.x && cameraEntity.cameraDirection != undefined) {
      cameraEntity.cameraDirection.x += cameraEntity.cameraMovement.x
      cameraEntity.cameraMovement.x = 0
    }
    if (cameraEntity.cameraMovement?.y && cameraEntity.cameraDirection != undefined) {
      cameraEntity.cameraDirection.y += cameraEntity.cameraMovement.y
      cameraEntity.cameraMovement.y = 0
    }
    // Create a quaternion for left or right rotation around the Y-axis
    const leftRightRotation = Quaternion.FromEulerAngles(0, cameraEntity.cameraDirection.x ?? 0, 0); // Left right rotation
    const upDownRotation = Quaternion.FromEulerAngles(cameraEntity.cameraDirection.y, 0, 0); // Up down rotation

    camera.position.x = position.x - origin.x
    camera.position.y = position.y - origin.y
    camera.position.z = position.z - origin.z
    camera.rotationQuaternion.x = rotationQuaternion.x
    camera.rotationQuaternion.y = rotationQuaternion.y
    camera.rotationQuaternion.z = rotationQuaternion.z
    camera.rotationQuaternion.w = rotationQuaternion.w
    
    camera.rotationQuaternion = camera.rotationQuaternion.multiply(leftRightRotation);
    camera.rotationQuaternion = camera.rotationQuaternion.multiply(upDownRotation);
    // for some reason we look backwards?
    camera.rotationQuaternion.multiplyInPlace(TURN)
  }
}