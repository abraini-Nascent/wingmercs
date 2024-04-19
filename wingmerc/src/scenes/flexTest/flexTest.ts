import { DebounceTimedMulti } from '../../utils/debounce';
import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { FlexTestScreen } from './flexTestScreen';
import { IDisposable} from '@babylonjs/core';

export class FlexTestScene implements GameScene, IDisposable {

  screen: FlexTestScreen

  debouncer = new DebounceTimedMulti()

  constructor() {
    const appContainer = AppContainer.instance
    this.screen = new FlexTestScreen()
    this.setup()
  }

  dispose() {
    this.screen.dispose()
    this.screen = undefined
  }

  setup() {
  }

  checkInput(dt: number) {
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.screen.updateScreen(delta)
    scene.render()
  };
}
