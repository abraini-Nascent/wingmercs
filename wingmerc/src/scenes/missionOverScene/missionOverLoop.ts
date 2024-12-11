import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { MissionOverScreen } from './missionOverScreen';

const divFps = document.getElementById("fps");
const radius = 5000;
export class MissionOverScene implements GameScene {

  screen: MissionOverScreen

  constructor() {
    const appContainer = AppContainer.instance
    this.screen = new MissionOverScreen()
  }

  dispose() {
    this.screen.dispose()
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.screen.updateScreen(delta)
    scene.render()
    divFps.innerHTML = engine.getFps().toFixed() + " fps";
  };
}