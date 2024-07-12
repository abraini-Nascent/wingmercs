import { DebounceTimedMulti } from '../../../utils/debounce';
import { GameScene } from '../../gameScene';
import { AppContainer } from "../../../app.container";
import { ShipSelectionScreen } from './shipSelectionScreen';
import { IDisposable} from '@babylonjs/core';
import { MeshedSystem } from '../../../world/systems/renderSystems/meshedSystem';
import { CreateEntity, Entity, world } from '../../../world/world';
import * as Ships from "../../../data/ships";
import { ShipDetails } from '../../../data/ships/shipTemplate';

export class ShipSelectionScene implements GameScene, IDisposable {

  screen: ShipSelectionScreen
  screenEntities = new Set<Entity>()

  meshedSystem: MeshedSystem
  shipModels: {[name: string]:Entity} = {}

  debouncer = new DebounceTimedMulti()

  constructor() {
    const appContainer = AppContainer.instance
    this.screen = new ShipSelectionScreen()
    this.meshedSystem = new MeshedSystem()

    world.onEntityAdded.subscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.subscribe(this.onScreenEntityRemoved)

    queueMicrotask(() => {
      this.setup()
    })
  }

  dispose() {
    world.onEntityAdded.unsubscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onScreenEntityRemoved)

    this.screenEntities.forEach((entity) => {
      world.remove(entity)
    })
    this.screen.dispose()
    this.screen = undefined
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
    const ships = ["Dirk", "Epee", "Rapier", "Saber", "Broadsword", "EnemyLight01", "EnemyMedium01", "EnemyMedium02", "EnemyHeavy01"]
    for (const ship of ships) {
      const shipData = Ships[ship] as ShipDetails
      this.shipModels[ship] = CreateEntity({
        meshName: shipData.modelDetails.base
      })
    }
    queueMicrotask(() => {
      this.screen.setModels(this.shipModels)
    })
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.screen.updateScreen(delta)
    scene.render()
  };
}
