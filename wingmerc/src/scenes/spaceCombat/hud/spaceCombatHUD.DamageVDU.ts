import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../../app.container"
import { IDisposable } from "@babylonjs/core"
import { VDU } from "./SpaceCombatHUD.VDU"

export class DamageVDU implements VDU {
  systemsPanel: GUI.StackPanel
  title: TextBlock
  afterburners: TextBlock
  battery: TextBlock
  engines: TextBlock
  power: TextBlock
  radar: TextBlock
  shield: TextBlock
  targeting: TextBlock
  thrusters: TextBlock

  get mainComponent(): GUI.Control {
    return this.systemsPanel
  }

  constructor() {
    this.setupComponents()
  }

  vduButtonPressed(_button: number) {}

  dispose() {
    this.title.dispose()
    this.afterburners.dispose()
    this.battery.dispose()
    this.engines.dispose()
    this.power.dispose()
    this.radar.dispose()
    this.shield.dispose()
    this.targeting.dispose()
    this.thrusters.dispose()
  }
  setupComponents() {
    function systemText(name: string, value: string) {
      const systemTextBlock = new GUI.TextBlock(name)
      systemTextBlock.fontFamily = "monospace"
      systemTextBlock.text = value
      systemTextBlock.color = "white"
      systemTextBlock.fontSize = 24
      systemTextBlock.height = "24px"
      systemTextBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
      systemTextBlock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
      return systemTextBlock
    }
    const systemsPanel = new GUI.StackPanel()
    systemsPanel.isVertical = true
    systemsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    systemsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    systemsPanel.width = "240px"
    systemsPanel.height = "240px"
    this.systemsPanel = systemsPanel

    this.title = systemText("title", "-=DAMAGE=-")
    this.title.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    this.systemsPanel.addControl(this.title)
    this.afterburners = systemText("afterburners", this.padName("Afterburners"))
    this.systemsPanel.addControl(this.afterburners)
    this.battery = systemText("battery", this.padName("Battery"))
    this.systemsPanel.addControl(this.battery)
    this.engines = systemText("engines", this.padName("Engines"))
    this.systemsPanel.addControl(this.engines)
    this.power = systemText("power", this.padName("Power"))
    this.systemsPanel.addControl(this.power)
    this.radar = systemText("radar", this.padName("Radar"))
    this.systemsPanel.addControl(this.radar)
    this.shield = systemText("shield", this.padName("Shield"))
    this.systemsPanel.addControl(this.shield)
    this.targeting = systemText("targeting", this.padName("Targeting"))
    this.systemsPanel.addControl(this.targeting)
    this.thrusters = systemText("thrusters", this.padName("Thrusters"))
    this.systemsPanel.addControl(this.thrusters)
  }

  update() {
    const playerEntity = AppContainer.instance.player.playerEntity
    const currentState = playerEntity.systems.state
    const baseState = playerEntity.systems.base

    this.setState(this.afterburners, "Aftburners", currentState.afterburners, baseState.afterburners)
    this.setState(this.battery, "Battery", currentState.battery, baseState.battery)
    this.setState(this.engines, "Engines", currentState.engines, baseState.engines)
    this.setState(this.power, "Power", currentState.power, baseState.power)
    this.setState(this.radar, "Radar", currentState.radar, baseState.radar)
    this.setState(this.shield, "Shield", currentState.shield, baseState.shield)
    this.setState(this.targeting, "Targeting", currentState.targeting, baseState.targeting)
    this.setState(this.thrusters, "Thrusters", currentState.thrusters, baseState.thrusters)
  }

  setState(content: GUI.TextBlock, name: string, value: number, base: number) {
    const percent = Math.round((value / base) * 100)
    content.text = `${this.padName(name)}${percent}%`
    if (percent < 15) {
      content.color = "red"
    } else if (percent < 50) {
      content.color = "orange"
    } else if (percent < 75) {
      content.color = "yellow"
    } else {
      content.color = "white"
    }
  }

  padName(name: string) {
    return name.padEnd(10, ".")
  }
}
