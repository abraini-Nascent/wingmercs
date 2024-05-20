import { DebounceTimedMulti } from '../../utils/debounce';
import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { ShipCustomizerScreen } from './shipCustomizerScreen';
import { IDisposable} from '@babylonjs/core';
import { ShipTemplate } from '../../data/ships/shipTemplate';

export class ShipCustomizerScene implements GameScene, IDisposable {

  screen: ShipCustomizerScreen
  debouncer = new DebounceTimedMulti()
  ship: ShipTemplate

  constructor(ship: ShipTemplate) {
    const appContainer = AppContainer.instance
    this.ship = ship
    this.screen = new ShipCustomizerScreen(ship)
    this.setup()
  }

  dispose() {
    this.screen.dispose()
    this.screen = undefined
  }

  setup() {
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.screen.updateScreen(delta)
    scene.render()
  };
}
