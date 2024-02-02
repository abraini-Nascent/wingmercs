import { world, queries } from './world/world';
import { InputAgent } from './agents/inputAgent';
import { Engine, HavokPlugin, Observable, Scene, TargetCamera } from "@babylonjs/core"
import { PlayerAgent } from "./agents/playerAgent"
import { HavokPhysicsWithBindings } from "@babylonjs/havok"
import { GameScene } from "./scenes/gameScene"
import { EventPipeline } from './utils/pipeline';

export class AppContainer {
  static instance: AppContainer = new AppContainer()
  private constructor() {

  }
  player: PlayerAgent
  input: InputAgent
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

