import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { Vector3 } from "@babylonjs/core"
import { AutoPilotCommand, Entity, EntityForId, world } from "../../../world/world"
import { VDU } from "./SpaceCombatHUD.VDU"
import { AppContainer } from "../../../app.container"

export class DestinationVDU implements VDU {
  screen: GUI.Container
  destinationPanel: GUI.StackPanel
  title: TextBlock
  destinationName: TextBlock
  destinationDistance: TextBlock
  canAuto: TextBlock

  get mainComponent(): GUI.Control {
    return this.screen
  }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.title.dispose()
    this.destinationName.dispose()
    this.destinationDistance.dispose()
    this.destinationPanel.dispose()
    this.screen.dispose()
  }

  vduButtonPressed(button: number) {
    if (button == 0 || button == 4) {
      let fireCommand = AppContainer.instance.player.playerEntity.fireCommand
      if (fireCommand) {
        fireCommand.nav = true
      } else {
        world.addComponent(AppContainer.instance.player.playerEntity, "fireCommand", {
          nav: true,
        })
      }
    }
    if (button == 9) {
      const autoPilotCommand: AutoPilotCommand = {
        autopilot: true,
        runTime: 0,
        wingmen: [],
        location: { x: 100, y: 100, z: 0 }, // TODO this should come from the current targeted nav becon
      }
      world.addComponent(AppContainer.instance.player.playerEntity, "autoPilotCommand", autoPilotCommand)
    }
  }

  setupMain() {
    const container = new GUI.Container("TargetVDU")
    container.heightInPixels = 240
    container.widthInPixels = 240
    container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    this.screen = container

    const destinationPanel = new GUI.StackPanel("TargetVDUPanel")
    this.destinationPanel = destinationPanel
    destinationPanel.isVertical = true
    destinationPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    destinationPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    destinationPanel.width = "240px"
    destinationPanel.height = "240px"
    this.screen.addControl(destinationPanel)

    const title = new GUI.TextBlock("LockType")
    this.title = title
    title.fontFamily = "monospace"
    title.text = "[Destination]"
    title.color = "white"
    title.fontSize = 24
    title.height = "24px"
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    destinationPanel.addControl(title)

    const destinationName = new GUI.TextBlock("Name")
    this.destinationName = destinationName
    destinationName.fontFamily = "monospace"
    destinationName.text = "[Desination]"
    destinationName.color = "gold"
    destinationName.fontSize = 24
    destinationName.height = "24px"
    destinationName.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    destinationName.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    destinationPanel.addControl(destinationName)

    const destinationDistance = new GUI.TextBlock("Distance")
    this.destinationDistance = destinationDistance
    destinationDistance.fontFamily = "monospace"
    destinationDistance.text = "----- k"
    destinationDistance.color = "white"
    destinationDistance.fontSize = 24
    destinationDistance.height = "24px"
    destinationDistance.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    destinationDistance.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT
    destinationPanel.addControl(destinationDistance)

    const canAuto = new GUI.TextBlock("Distance")
    this.canAuto = canAuto
    canAuto.fontFamily = "monospace"
    canAuto.text = "AUTO ->"
    canAuto.color = "white"
    canAuto.fontSize = 24
    canAuto.height = "24px"
    canAuto.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    canAuto.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT
    canAuto.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_BOTTOM
    this.screen.addControl(canAuto)
  }

  update(playerEntity: Entity, dt: number) {
    if (playerEntity.targeting?.destination == undefined || playerEntity.targeting?.destination == "") {
      this.destinationName.text = "[ no destination ]"
      this.destinationDistance.text = "----- m"
      return
    }
    let targetEntity = EntityForId(playerEntity.targeting.destination)
    if (targetEntity == undefined) {
      this.destinationName.text = "[ no destination ]"
      this.destinationDistance.text = "----- m"
      return
    }
    this.destinationName.text = `[ ${targetEntity.targetName} ]`
    const destinationPosition = new Vector3(targetEntity.position.x, targetEntity.position.y, targetEntity.position.z)
    const distance = Math.round(
      new Vector3(playerEntity.position.x, playerEntity.position.y, playerEntity.position.z)
        .subtract(destinationPosition)
        .length()
    )
    if (distance < 10000) {
      this.destinationDistance.text = `${distance.toString().padStart(5)} m`
    } else {
      this.destinationDistance.text = `${(distance / 1000).toFixed(0).toString().padStart(5)} k`
    }
    this.canAuto.isVisible = playerEntity.canAutopilot
  }
}
