import { IDisposable } from "@babylonjs/core"
import { VRSystem } from "../../renderSystems/vrSystem"

export class XRControllerInput implements IDisposable {
  inXR = false
  dispose() {}
  update() {
    this.checkXR()
  }
  checkXR() {
    if (VRSystem.inXR) {
      if (this.inXR == false) {
        console.log("[xr input] entering xr")
        this.inXR = true
      }
      // handle xr input
      this.handleXrInput()
    } else if (VRSystem.inXR == false && this.inXR) {
      console.log("[xr input] leaving xr")
      this.inXR = false
    }
  }
  handleXrInput() {
    const input = VRSystem.xr.input
    console.log("[xr input] XR Input ", input)
    for (const controller of input.controllers) {
      const motion = controller.motionController
      if (motion == undefined) {
        continue
      }
      motion
    }
  }
}
