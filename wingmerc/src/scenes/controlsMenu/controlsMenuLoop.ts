import { IDisposable } from "@babylonjs/core"
import { AppContainer } from "../../app.container"
import { ControlsMenuScreen } from "./controlsMenuScreen"
import { Entity, world } from "../../world/world"
import { debugLog } from "../../utils/debuglog"

export class ControlsMenuScene implements IDisposable {
  screen: ControlsMenuScreen
  screenEntities = new Set<Entity>()

  constructor() {
    this.screen = new ControlsMenuScreen()

    world.onEntityAdded.subscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.subscribe(this.onScreenEntityRemoved)
  }

  dispose(): void {
    world.onEntityAdded.unsubscribe(this.onScreenEntityAdded)
    world.onEntityRemoved.unsubscribe(this.onScreenEntityRemoved)

    this.screen.dispose()
    this.screen = undefined
    for (const entity of this.screenEntities) {
      debugLog("[ControlsMenu] removing entity", entity)
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

    scene.render()
    return
  }
}
