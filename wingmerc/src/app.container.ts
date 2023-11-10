import { Engine, HavokPlugin, Observable, Scene, TargetCamera } from "@babylonjs/core"
import { PlayerAgent } from "./agents/playerAgent"
import { HavokPhysicsWithBindings } from "@babylonjs/havok"

export class AppContainer {
  static instance: AppContainer = new AppContainer()
  private constructor() {

  }
  player: PlayerAgent
  camera: TargetCamera
  server: boolean = false
  engine: Engine
  havokInstance: HavokPhysicsWithBindings
  private _havokPlugin: HavokPlugin
  scene: Scene
  onHavokPlugin: Observable<HavokPlugin> = new Observable()
  get havokPlugin(): HavokPlugin {
    return this._havokPlugin
  }
  set havokPlugin(value: HavokPlugin) {
    this._havokPlugin = value
    this.onHavokPlugin.notifyObservers(value)
  }
}