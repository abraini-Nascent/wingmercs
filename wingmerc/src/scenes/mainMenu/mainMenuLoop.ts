import { AppContainer } from "../../app.container";
import { MenuGui } from "../../gui/menuGui";
import { MainMenuScreen } from "./mainMenuScreen";

export class MainMenuScene {
  gui: MenuGui
  screen: MainMenuScreen
  constructor() {
    this.screen = new MainMenuScreen()
  }

  runLoop = (delta: number) => {
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    // don't start the game while menu is open
    this.screen.updateScreen(delta);
    scene.render()
    return;
  }
}