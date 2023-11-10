import { TargetCamera } from "@babylonjs/core";
import { RubberbandCameraController } from "../../camera/rubberbandCameraController";
import { PlayerAgent } from "../../agents/playerAgent";

let playerFollowCamera: RubberbandCameraController = undefined;
export function cameraSystem(player: PlayerAgent, camera: TargetCamera) {
  if (player?.node == undefined || camera == undefined) { return }

  let ship = player.node
  if (ship && playerFollowCamera == undefined) {
    playerFollowCamera = new RubberbandCameraController(camera, ship)
  } else {
    playerFollowCamera.update()
  }
}