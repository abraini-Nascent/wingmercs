import { InputAgent } from "../../agents/inputAgent";
import { PlayerAgent } from "../../agents/playerAgent";
import { SpaceDebrisAgent } from "../../agents/spaceDebrisAgent";
import { AppContainer } from "../../app.container";
import { MenuGui } from "../../gui/menuGui";
import { AsteroidScene } from "../../map/asteroidScene";
import { net } from "../../net";
import { ArenaRadius } from "../../world/systems/moveSystem";
import { SpaceCombatScene } from "../spaceCombat/spaceCombatLoop";
import { MainMenuScreen } from "./mainMenuScreen";

export class MainMenuScene {
  gui: MenuGui
  screen: MainMenuScreen
  constructor() {
    // this.gui = new MenuGui()
    // this.gui.setPeerId(net.id)
    this.screen = new MainMenuScreen()

    // const begin = () => {
    //   const appContainer = AppContainer.instance
    //   appContainer.player = new PlayerAgent(appContainer.engine)
    //   appContainer.input = new InputAgent()
    //   appContainer.gameScene = new SpaceCombatScene()
    // }
    // this.gui.onStart = () => {
    //   console.log("[App] gui said start")
    //   const appContainer = AppContainer.instance
    //   appContainer.server = true
    //   this.gui.close()
    //   this.gui = undefined
    //   begin()
    // }
    // this.gui.onConnected = (peerId) => {
    //   console.log("[App] gui said connected to peer", peerId)
    //   net.conn.once("data", () => {
    //     // as soon as we get data, close the gui
    //     this.gui.close()
    //     this.gui = undefined
    //     begin()
    //   })
    // } 
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