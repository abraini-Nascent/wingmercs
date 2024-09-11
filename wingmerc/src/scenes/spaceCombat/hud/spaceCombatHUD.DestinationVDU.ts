import { TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { Vector3 } from "@babylonjs/core";
import { Entity, EntityForId } from "../../../world/world";

export class DestinationVDU {

  screen: GUI.Container
  destinationPanel: GUI.StackPanel
  title: TextBlock
  destinationName: TextBlock
  destinationDistance: TextBlock

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
    destinationName.text = "[krant]"
    destinationName.color = "red"
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
    const distance = Math.round(new Vector3(playerEntity.position.x, playerEntity.position.y, playerEntity.position.z)
      .subtract(destinationPosition).length())
    this.destinationDistance.text = `${distance.toString().padStart(5)} m`
  }
}