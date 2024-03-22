import { world, queries } from './world/world';
import { Engine, HavokPlugin, Observable, Scene, TargetCamera } from "@babylonjs/core"
import { PlayerAgent } from "./agents/playerAgent"
import { HavokPhysicsWithBindings } from "@babylonjs/havok"
import { GameScene } from "./scenes/gameScene"
import { EventPipeline } from './utils/pipeline';

export class AppContainer {
  static instance: AppContainer = new AppContainer()
  private constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    // Retrieve a specific parameter
    const parameterValue = urlParams.get('env');
    if (parameterValue) {
      switch (parameterValue) {
        case "desktop": {
          this.env = "desktop"
          break;
        }
        case "mobile": {
          this.env = "mobile"
          break;
        }
      }
    }
  }
  env: "browser" | "desktop" | "mobile" = "browser"
  player: PlayerAgent
  camera: TargetCamera
  server: boolean = false
  engine: Engine
  havokInstance: HavokPhysicsWithBindings
  gameScene: GameScene
  pipeline: EventPipeline = new EventPipeline()
  private _havokPlugin: HavokPlugin
  scene: Scene
  onHavokPlugin: Observable<HavokPlugin> = new Observable()
  world = world
  queries = queries
  get havokPlugin(): HavokPlugin {
    return this._havokPlugin
  }
  set havokPlugin(value: HavokPlugin) {
    this._havokPlugin = value
    this.onHavokPlugin.notifyObservers(value)
  }
}

