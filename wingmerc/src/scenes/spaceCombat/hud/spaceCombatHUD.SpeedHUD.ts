import { TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../../app.container";

export class SpeedHUD {
  hud: GUI.Container
  setSpeed: TextBlock
  speed: TextBlock
  speedPanel: GUI.StackPanel

  get mainComponent(): GUI.Control { return this.hud }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.setSpeed.dispose()
    this.speed.dispose()
    this.hud.dispose()
  }
  setupMain() {
    this.hud = new GUI.Container("SpeedHUD")

    const speedPanel = new GUI.StackPanel()
    speedPanel.isVertical = true
    speedPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    speedPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    speedPanel.width = "240px"
    speedPanel.paddingLeftInPixels = 24
    speedPanel.paddingTopInPixels = 24

    const setSpeed = new GUI.TextBlock()
    this.setSpeed = setSpeed
    setSpeed.fontFamily = "monospace"
    setSpeed.text = "[000 kps]"
    setSpeed.color = "white"
    setSpeed.fontSize = 24
    setSpeed.height = "24px"
    setSpeed.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    setSpeed.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    speedPanel.addControl(setSpeed)

    const speed = new GUI.TextBlock()
    this.speed = speed
    speed.fontFamily = "monospace"
    speed.text = "000 kps"
    speed.color = "white"
    speed.fontSize = 24
    speed.height = "24px"
    speed.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    speed.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    speedPanel.addControl(speed)
    this.speedPanel = speedPanel

    this.hud.addControl(speedPanel)
  }
  update(dt: number) {
    const playerEntity = AppContainer.instance.player.playerEntity
    this.setSpeed.text = `SET[${playerEntity.setSpeed.toString().padStart(4)} mps]`
    this.speed.text = `ACT[${Math.round(playerEntity.currentSpeed).toString().padStart(4)} mps]`
  }
}