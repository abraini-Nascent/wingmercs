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
  fuel: TextBlock
  flash: boolean = false
  flashAcc: number = 0
  flashLimit: number = 333

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
    this.fuel.dispose()
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
    shieldsFore.color = "blue"
    shieldsFore.fontSize = 24
    shieldsFore.height = "24px"
    shieldsFore.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    shieldsFore.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(shieldsFore)

    const shieldsAft = new GUI.TextBlock("ShieldsAft")
    this.shieldsAft = shieldsAft
    shieldsAft.fontFamily = "monospace"
    shieldsAft.text = "↓)▉▉▉"
    shieldsAft.color = "blue"
    shieldsAft.fontSize = 24
    shieldsAft.height = "24px"
    shieldsAft.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    shieldsAft.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(shieldsAft)

    const armorFront = new GUI.TextBlock("ArmorFront")
    this.armorFront = armorFront
    armorFront.fontFamily = "monospace"
    armorFront.text = "↓║▉▉▉"
    armorFront.color = "orange"
    armorFront.fontSize = 24
    armorFront.height = "24px"
    armorFront.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorFront.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorFront)

    const armorBack = new GUI.TextBlock("ArmorBack")
    this.armorBack = armorBack
    armorBack.fontFamily = "monospace"
    armorBack.text = "↑║▉▉▉"
    armorBack.color = "orange"
    armorBack.fontSize = 24
    armorBack.height = "24px"
    armorBack.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorBack.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorBack)

    const armorLeft = new GUI.TextBlock("ArmorLeft")
    this.armorLeft = armorLeft
    armorLeft.fontFamily = "monospace"
    armorLeft.text = "←║▉▉▉"
    armorLeft.color = "orange"
    armorLeft.fontSize = 24
    armorLeft.height = "24px"
    armorLeft.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorLeft.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorLeft)

    const armorRight = new GUI.TextBlock("ArmorRight")
    this.armorRight = armorLeft
    armorRight.fontFamily = "monospace"
    armorRight.text = "→║▉▉▉"
    armorRight.color = "orange"
    armorRight.fontSize = 24
    armorRight.height = "24px"
    armorRight.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorRight.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorRight)

    const fuel = new GUI.TextBlock("Fuel")
    this.fuel = fuel
    fuel.fontFamily = "monospace"
    fuel.text = "→║▉▉▉"
    fuel.color = "orange"
    fuel.fontSize = 24
    fuel.height = "24px"
    fuel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    fuel.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(fuel)
  }

  update(dt: number) {
    this.flashAcc += dt
    if (this.flashAcc > this.flashLimit) {
      this.flash = !this.flash
      this.flashAcc = this.flashAcc % this.flashLimit
    }
    this.foreShieldBar()
    this.aftShieldBar()
    this.frontArmorBar()
    this.backArmorBar()
    this.leftArmorBar()
    this.rightArmorBar()
    this.fuelBar()
  }

  foreShieldBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.shields.currentFore / playerEntity.shields.maxFore
    f = Math.round(f * 100)
    barPercent(f)
    this.shieldsFore.text = `↑)${barPercent(f)}`
    if (f == 0) {
      this.shieldsFore.isVisible = !this.flash
    } else {
      this.shieldsFore.isVisible = true
    }
  }
  aftShieldBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.shields.currentAft / playerEntity.shields.maxAft
    f = Math.round(f * 100)
    this.shieldsAft.text = `↓)${barPercent(f)}`
    if (f == 0) {
      this.shieldsAft.isVisible = !this.flash
    } else {
      this.shieldsAft.isVisible = true
    }
  }
  frontArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.front / playerEntity.armor.front
    f = Math.round(f * 100)
    this.armorFront.text = `↑║${barPercent(f)}`
    if (f == 0) {
      this.armorFront.isVisible = !this.flash
    }
  }
  backArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.back / playerEntity.armor.back
    f = Math.round(f * 100)
    this.armorBack.text = `↓║${barPercent(f)}`
    if (f == 0) {
      this.armorBack.isVisible = !this.flash
    } else {
      this.armorBack.isVisible = true
    }
  }
  leftArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.left / playerEntity.armor.left
    f = Math.round(f * 100)
    this.armorLeft.text = `←║${barPercent(f)}`
    if (f == 0) {
      this.armorLeft.isVisible = !this.flash
    } else {
      this.armorLeft.isVisible = true
    }
  }
  rightArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.right / playerEntity.armor.right
    f = Math.round(f * 100)
    this.armorRight.text = `→║${barPercent(f)}`
    if (f == 0) {
      this.armorRight.isVisible = !this.flash
    } else {
      this.armorRight.isVisible = true
    }
  }

  fuelBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.fuel.currentCapacity / playerEntity.fuel.maxCapacity
    f = Math.round(f * 100)
    this.fuel.text = `F ${barPercent(f)}`
    if (f == 0) {
      this.fuel.isVisible = !this.flash
    } else {
      this.fuel.isVisible = true
    }
  }
}