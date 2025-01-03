import { AdvancedDynamicTexture } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { VRSystem } from "../world/systems/renderSystems/vrSystem"
import { Axis, Color3, Mesh, MeshBuilder, Space, StandardMaterial } from "@babylonjs/core"
import { debugLog } from "../utils/debuglog"

const DISTANCE_TO_HEADSET = 2
export class MercScreen {
  gui: AdvancedDynamicTexture
  screen: GUI.Container

  constructor(name: string) {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(name)
    // advancedTexture.idealWidth = 1920
    this.gui = advancedTexture
    this.screen = new GUI.Container("screen")
    this.gui.addControl(this.screen)
  }
  dispose() {
    this.gui.removeControl(this.screen)
    this.screen.dispose()
    this.gui.dispose()
  }

  updateScreen(_dt: number) {}

  static xrPanel(screen: {
    xrMode: boolean
    xrPlane: Mesh
    gui: AdvancedDynamicTexture
    xrIdealWidth?: number
    xrAspectRation?: number
  }) {
    if (VRSystem.inXR && screen.xrMode == false) {
      VRSystem.xrCameraParent.position.setAll(0)
      debugLog("[Merc Screen] entering XR mode width:", screen.xrIdealWidth)
      screen.gui.layer.isEnabled = false
      if (screen.xrIdealWidth != undefined) {
        screen.gui.idealWidth = screen.xrIdealWidth
      }
      const height = 1
      let width = 1
      if (screen.xrAspectRation) {
        width = width * screen.xrAspectRation
      }
      screen.xrPlane = MeshBuilder.CreatePlane("menu-plane", { height, width, sideOrientation: Mesh.DOUBLESIDE })
      screen.xrPlane.isPickable = true
      screen.xrPlane.isNearGrabbable = false
      screen.xrPlane.isNearPickable = false
      screen.gui.attachToMesh(screen.xrPlane, true)
      let mat = new StandardMaterial("menu-plane-mat")
      mat.diffuseTexture = screen.gui
      mat.emissiveTexture = screen.gui
      mat.specularColor = Color3.Black()
      screen.xrPlane.material = mat
      screen.xrPlane.position.set(0, VRSystem.xr.baseExperience.camera.position.y, -DISTANCE_TO_HEADSET)
      // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
      screen.xrPlane.lookAt(VRSystem.xr.baseExperience.camera.position)
      // Rotate the plane 180 degrees around the Y-axis to flip it
      screen.xrPlane.rotate(Axis.Y, Math.PI, Space.LOCAL)
      // const testbox = MeshBuilder.CreateBox("test", { width: 0.25, height: 0.5 })
      // testbox.position.copyFrom(screen.xrPlane.position)
      screen.xrMode = true
    } else if (!VRSystem.inXR && screen.xrMode == true) {
      debugLog("[Merc Screen] exiting XR mode")
      screen.gui.layer.isEnabled = true
      screen.gui.idealWidth = undefined
      if (screen.xrPlane) {
        screen.xrPlane.dispose(false, true)
        screen.xrPlane = undefined
      }
      screen.xrMode = false
    }
  }
}
