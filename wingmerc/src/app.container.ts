import { world, queries } from './world/world';
import { Engine, HavokPlugin, Observable, Scene, TargetCamera } from "@babylonjs/core"
import { PlayerAgent } from "./agents/playerAgent"
import { HavokPhysicsWithBindings } from "@babylonjs/havok"
import { GameScene } from "./scenes/gameScene"
import { EventPipeline } from './utils/pipeline';
import { DebugConsole } from './app.debugConsole';
import { net } from './world/systems/netSystems/net';

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
    const debugValue = urlParams.get('debug');
    if (debugValue) {
      this.debug = true
    }
    const peerId = urlParams.get('peerId');
    if (peerId) {
      this.peerId = peerId
      net.updatePeerId(this.peerId, PlayerAgent.playerName)
      this.server = true
    }
    const connectId = urlParams.get('roomId');
    if (connectId) {
      this.connectId = connectId
      this.server = false
    }
  }
  peerId: string
  connectId: string
  multiplayer: boolean = false
  server: boolean = false
  env: "browser" | "desktop" | "mobile" = "browser"
  player: PlayerAgent
  camera: TargetCamera
  engine: Engine
  havokInstance: HavokPhysicsWithBindings
  gameScene: GameScene
  pipeline: EventPipeline = new EventPipeline()
  private _havokPlugin: HavokPlugin
  scene: Scene
  onHavokPlugin: Observable<HavokPlugin> = new Observable()
  world = world
  queries = queries
  debug: boolean = false
  debugConsole = new DebugConsole()
  volumes = {
    global: 0.80,
    sound: 0.80,
    music: 0.80,
    voice: 0.80,
  }
  get havokPlugin(): HavokPlugin {
    return this._havokPlugin
  }
  set havokPlugin(value: HavokPlugin) {
    this._havokPlugin = value
    this.onHavokPlugin.notifyObservers(value)
  }
}

