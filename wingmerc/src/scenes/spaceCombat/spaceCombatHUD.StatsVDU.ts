import { TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../app.container";
import { barPercent } from './spaceCombatHUD.helpers';

export class StatsVDU {

  statsPanel: GUI.StackPanel
  shieldsFore: TextBlock
  shieldsAft: TextBlock
  armorFront: TextBlock
  armorBack: TextBlock
  armorRight: TextBlock
  armorLeft: TextBlock

  get mainComponent(): GUI.Control {
    return this.statsPanel
  }
  constructor() {
    this.setupComponents()
  }
  dispose() {
    this.shieldsFore.dispose()
    this.shieldsAft.dispose()
    this.armorFront.dispose()
    this.armorBack.dispose()
    this.armorRight.dispose()
    this.armorLeft.dispose()
  }
  setupComponents() {

    const statsPanel = new GUI.StackPanel("StatsVDU")
    statsPanel.isVertical = true
    statsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    statsPanel.width = "240px"
    this.statsPanel = statsPanel

    const shieldsFore = new GUI.TextBlock("ShieldsFore")
    this.shieldsFore = shieldsFore
    shieldsFore.fontFamily = "monospace"
    shieldsFore.text = "↑)▉▉▉"
    shieldsFore.color = "white"
    shieldsFore.fontSize = 24
    shieldsFore.height = "24px"
    shieldsFore.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    shieldsFore.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(shieldsFore)

    const shieldsAft = new GUI.TextBlock("ShieldsAft")
    this.shieldsAft = shieldsAft
    shieldsAft.fontFamily = "monospace"
    shieldsAft.text = "↓)▉▉▉"
    shieldsAft.color = "white"
    shieldsAft.fontSize = 24
    shieldsAft.height = "24px"
    shieldsAft.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    shieldsAft.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(shieldsAft)

    const armorFront = new GUI.TextBlock("ArmorFront")
    this.armorFront = armorFront
    armorFront.fontFamily = "monospace"
    armorFront.text = "↓║▉▉▉"
    armorFront.color = "white"
    armorFront.fontSize = 24
    armorFront.height = "24px"
    armorFront.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorFront.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorFront)

    const armorBack = new GUI.TextBlock("ArmorBack")
    this.armorBack = armorBack
    armorBack.fontFamily = "monospace"
    armorBack.text = "↑║▉▉▉"
    armorBack.color = "white"
    armorBack.fontSize = 24
    armorBack.height = "24px"
    armorBack.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorBack.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorBack)

    const armorLeft = new GUI.TextBlock("ArmorLeft")
    this.armorLeft = armorLeft
    armorLeft.fontFamily = "monospace"
    armorLeft.text = "←║▉▉▉"
    armorLeft.color = "white"
    armorLeft.fontSize = 24
    armorLeft.height = "24px"
    armorLeft.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorLeft.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorLeft)

    const armorRight = new GUI.TextBlock("ArmorRight")
    this.armorRight = armorLeft
    armorRight.fontFamily = "monospace"
    armorRight.text = "→║▉▉▉"
    armorRight.color = "white"
    armorRight.fontSize = 24
    armorRight.height = "24px"
    armorRight.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorRight.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorRight)
  }

  update() {
    this.shieldsFore.text = `↑)${this.foreShieldBar()}`
    this.shieldsAft.text = `↓)${this.aftShieldBar()}`
    this.armorFront.text = `↑║${this.frontArmorBar()}`
    this.armorBack.text = `↓║${this.backArmorBar()}`
    this.armorLeft.text = `←║${this.leftArmorBar()}`
    this.armorRight.text = `→║${this.rightArmorBar()}`
  }

  foreShieldBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.shields.currentFore / playerEntity.shields.maxFore
    f = Math.round(f * 100)
    return barPercent(f)
  }
  aftShieldBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.shields.currentAft / playerEntity.shields.maxAft
    f = Math.round(f * 100)
    return barPercent(f)
  }
  frontArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.front / playerEntity.armor.front
    f = Math.round(f * 100)
    return barPercent(f)
  }
  backArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.back / playerEntity.armor.back
    f = Math.round(f * 100)
    return barPercent(f)
  }
  leftArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.left / playerEntity.armor.left
    f = Math.round(f * 100)
    return barPercent(f)
  }
  rightArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.right / playerEntity.armor.right
    f = Math.round(f * 100)
    return barPercent(f)
  }
}