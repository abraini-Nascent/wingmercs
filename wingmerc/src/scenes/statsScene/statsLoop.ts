import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { SpaceDebrisAgent } from '../../agents/spaceDebrisAgent';
import { AsteroidScene, createEnemyShip } from '../../map/asteroidScene';
import { StatsScreen } from './statsScreen';
import { NerdStats, Score } from '../../world/world';

const divFps = document.getElementById("fps");
const radius = 5000;
export class StatsScene implements GameScene {

  screen: StatsScreen

  constructor(score: Score, stats: NerdStats) {
    const appContainer = AppContainer.instance
    this.screen = new StatsScreen(score, stats)
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