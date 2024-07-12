import { IDisposable } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { MultiplayerMenuScreen } from "./multiplayerMenuScreen";
import { Entity, world } from "../../world/world";

export class MultiplayerMenuScene implements IDisposable {
  screen: MultiplayerMenuScreen
  screenEntities = new Set<Entity>()

  constructor() {
    this.screen = new MultiplayerMenuScreen()

    world.onEntityAdded.subscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.subscribe(this.onScreenEntityRemoved)
  }

  dispose(): void {
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
    this.screen.updateScreen(delta);

    scene.render()
    return;
  }
}

