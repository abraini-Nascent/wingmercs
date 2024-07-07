import { DebounceTimedMulti } from '../../utils/debounce';
import { GameScene } from '../gameScene';
import { AppContainer } from "../../app.container";
import { ShipCustomizerScreen } from './shipCustomizerScreen';
import { IDisposable} from '@babylonjs/core';
import { ShipTemplate } from '../../data/ships/shipTemplate';
import { Entity, world } from '../../world/world';
import { MeshedSystem } from '../../world/systems/renderSystems/meshedSystem';

export class ShipCustomizerScene implements GameScene, IDisposable {

  screen: ShipCustomizerScreen
  debouncer = new DebounceTimedMulti()
  ship: ShipTemplate
  screenEntities = new Set<Entity>()
  meshedSystem: MeshedSystem

  constructor(ship: ShipTemplate) {
    const appContainer = AppContainer.instance
    this.meshedSystem = new MeshedSystem()

    world.onEntityAdded.subscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.subscribe(this.onScreenEntityRemoved)

    this.ship = ship
    this.screen = new ShipCustomizerScreen(ship)
    this.setup()
  }

  dispose() {
    world.onEntityAdded.unsubscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onScreenEntityRemoved)

    this.screen.dispose()
    this.screen = undefined

    this.screenEntities.forEach((entity) => {
      world.remove(entity)
    })
    this.meshedSystem.dispose()
  }

  onScreenEntityAdded = (entity: Entity) => {
    this.screenEntities.add(entity)
    console.log("[task] ship entity added")
  }

  onScreenEntityRemoved = (entity: Entity) => {
    this.screenEntities.delete(entity)
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
