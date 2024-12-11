import { IDisposable } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { MultiplayerMenuScreen } from "./multiplayerMenuScreen";
import { Entity, world } from "../../world/world";
import { SkyboxSystems } from "../../world/systems/visualsSystems/skyboxSystems";

export class MultiplayerMenuScene implements IDisposable {
  screen: MultiplayerMenuScreen
  screenEntities = new Set<Entity>()
  skyboxSystems: SkyboxSystems

  constructor() {
    this.screen = new MultiplayerMenuScreen()

    this.skyboxSystems = new SkyboxSystems(AppContainer.instance.scene)

    world.onEntityAdded.subscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.subscribe(this.onScreenEntityRemoved)
  }

  dispose(): void {
    this.skyboxSystems.dispose()

    world.onEntityAdded.unsubscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onScreenEntityRemoved)

    this.screen.dispose()
    this.screen = undefined
    for (const entity of this.screenEntities) {
      console.log("[MultiplayerMenu] removing entity", entity)
      world.remove(entity)
    }
    this.screenEntities.clear()
  }

  onScreenEntityAdded = (entity: Entity) => {
    this.screenEntities.add(entity)
  }

  onScreenEntityRemoved = (entity: Entity) => {
    this.screenEntities.delete(entity)
  }

  runLoop = (delta: number) => {
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    // don't start the game while menu is open
    this.screen.updateScreen(delta)
    this.skyboxSystems.update(delta)

    scene.render()
    return;
  }
}

