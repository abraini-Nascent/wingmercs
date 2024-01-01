import { FreeCamera, Quaternion, TargetCamera } from "@babylonjs/core";
import { RubberbandCameraController } from "../../camera/rubberbandCameraController";
import { PlayerAgent } from "../../agents/playerAgent";

let playerFollowCamera: RubberbandCameraController = undefined;
export function cameraFollowSystem(player: PlayerAgent, camera: TargetCamera) {
  if (player?.node == undefined || camera == undefined) { return }

  let ship = player.node
  if (ship && playerFollowCamera == undefined) {
    playerFollowCamera = new RubberbandCameraController(camera, ship)
  } else {
    playerFollowCamera.update()
  }
}
const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0);
export function cameraSystem(player: PlayerAgent, camera: FreeCamera) {
  if (player?.playerEntity == undefined) { return }
  const { rotationQuaternion, position } = player.playerEntity
  if (camera.rotationQuaternion == undefined) {
    camera.rotationQuaternion = new Quaternion(rotationQuaternion.x, rotationQuaternion.y, rotationQuaternion.z, rotationQuaternion.w)
  }
  camera.position.x = position.x
  camera.position.y = position.y
  camera.position.z = position.z
  camera.rotationQuaternion.x = rotationQuaternion.x
  camera.rotationQuaternion.y = rotationQuaternion.y
  camera.rotationQuaternion.z = rotationQuaternion.z
  camera.rotationQuaternion.w = rotationQuaternion.w
  // for some reason we look backwards?
  camera.rotationQuaternion.multiplyInPlace(TURN)
}