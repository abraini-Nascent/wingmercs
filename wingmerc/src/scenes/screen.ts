import { AdvancedDynamicTexture } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"


export class MercScreen {
  gui: AdvancedDynamicTexture
  screen: GUI.Container

  constructor(name: string) {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI(name);
    this.gui = advancedTexture
    this.setupMain()
  }
  dispose() {
    this.gui.removeControl(this.screen)
    this.screen.dispose()
    this.gui.dispose()
  }

  setupMain() {
    
    this.screen = new GUI.Container("screen")
    this.gui.addControl(this.screen)
  }

  updateScreen(dt: number) {
  }
}