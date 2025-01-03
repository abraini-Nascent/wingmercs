import {
  Engine,
  Quaternion,
  TransformNode,
  WebXRControllerPointerSelection,
  WebXRDefaultExperience,
  WebXRFeatureName,
  WebXRInputSource,
  WebXRState,
} from "@babylonjs/core"
import { AppContainer } from "../../../app.container"
import { debugLog } from "../../../utils/debuglog"
import { debugDir } from "../../../utils/debugDir"

const TURN = Quaternion.FromEulerAngles(0, Math.PI, 0)
export class VRSystem {
  static xr: WebXRDefaultExperience | undefined
  static xrCameraParent: TransformNode | undefined
  private static pointerEnabled: boolean = true
  static get inXR(): boolean {
    return this.xr?.baseExperience?.state == WebXRState.IN_XR
  }
  /** will try to enable vr support, returns true if vr support is enabled */
  static async tryVR(): Promise<boolean> {
    const canMultiview = AppContainer.instance.scene.getEngine().getCaps().multiview
    debugLog("[XR] Can Multiview", canMultiview)
    return AppContainer.instance.scene
      .createDefaultXRExperienceAsync({
        disableTeleportation: true,
        disableNearInteraction: true,
        disableHandTracking: true,
        inputOptions: {
          doNotLoadControllerMeshes: true,
        },
      })
      .then((xr) => {
        if (xr.baseExperience == undefined) {
          debugLog("[XR] NO SUPPORTED")
          this.xr = undefined
          return false
        }
        if (canMultiview && false) {
          const _layers = xr.baseExperience.featuresManager.enableFeature(
            WebXRFeatureName.LAYERS,
            "latest",
            {
              preferMultiviewOnInit: true,
            },
            true,
            false
          )
        }
        debugLog("[XR] READY")
        debugDir(xr)
        this.xr = xr

        xr.input.onControllerAddedObservable.addOnce((controller: WebXRInputSource) => {
          debugLog("[XR] controller connected", controller.motionController?.handedness)
          debugLog(
            `[XR] ${controller.motionController?.handedness}] controller`,
            controller.motionController?.getComponentIds()
          )
        })
        // pointer selection
        let pointerSelection = xr.baseExperience.featuresManager.getEnabledFeature(
          WebXRFeatureName.POINTER_SELECTION
        ) as WebXRControllerPointerSelection
        if (pointerSelection) {
          pointerSelection.displayLaserPointer = true
          pointerSelection.displaySelectionMesh = true
        }
        // xr.teleportation.detach();
        xr.baseExperience.onStateChangedObservable.add((state) => {
          let states = ["ENTERING_XR", "EXITING_XR", "IN_XR", "NOT_IN_XR"]
          debugLog("[XR] STATE", states[state])
          switch (state) {
            case WebXRState.ENTERING_XR:
              // unlock audio
              Engine.audioEngine.unlock()

              // When entering webXR, set the x and z position equal to the 2d camera position
              // this is an old dead api from an old misleading example : xr.baseExperience.setPositionOfCameraUsingContainer(new Vector3(this._camera.position.x, xr.baseExperience.camera.position.y, this._camera.position.z))
              // switch to using the engine render loop for rendering
              // manual attempt to set camera xr.baseExperience.camera.position = new Vector3(this._camera.position.x, this._camera.position.y, this._camera.position.z)

              // window requestAnimationFrame stops working when XR starts, so we need to restart the gameloop with the right frame request method
              break
            case WebXRState.IN_XR:
              // debugger
              const camera = AppContainer.instance.camera
              const xrHelper = xr.baseExperience
              xrHelper.camera.maxZ = camera.maxZ
              xrHelper.camera.position.set(0, 0, 0)
              xrHelper.camera.rotationQuaternion = Quaternion.Identity()
              xrHelper.camera.rotationQuaternion.multiplyInPlace(TURN)
              // xr.baseExperience.sessionManager.resetReferenceSpace()
              this.xrCameraParent = new TransformNode("xr-camera-parent") // zero
              this.xrCameraParent.position.setAll(0)
              xrHelper.camera.parent = this.xrCameraParent // attach camera (0,1.6,0)
              this.xrCameraParent.position.y = camera.position.y // move pivot
              this.xrCameraParent.position.x = camera.position.x
              this.xrCameraParent.position.z = camera.position.z
              // xrHelper.camera.minZ = camera.minZ

              // let walkFeature = xr.baseExperience.featuresManager.enableFeature(WebXRWalkingLocomotionCustom.Name, "latest", { })

              break
            case WebXRState.EXITING_XR:
              break
            case WebXRState.NOT_IN_XR:
              break
          }
        })
        return true
      })
      .catch((error) => {
        debugLog("[XR] ERROR!!", error)
        debugLog(error)
        return false
      })
  }

  static setPointerEnabled(enabled: boolean) {
    // pointer selection
    if (this.pointerEnabled != enabled) {
      if (this.inXR) {
        const pointerSelection = this.xr.baseExperience.featuresManager.getEnabledFeature(
          WebXRFeatureName.POINTER_SELECTION
        ) as WebXRControllerPointerSelection
        if (pointerSelection) {
          pointerSelection.displayLaserPointer = enabled
          pointerSelection.displaySelectionMesh = enabled
          if (enabled) {
            pointerSelection.raySelectionPredicate = undefined
          } else {
            pointerSelection.raySelectionPredicate = () => {
              return false
            }
          }
        }
      }
      this.pointerEnabled = enabled
    }
  }
}
