import { TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../app.container";
import { Gun } from "../../data/guns/gun";
import * as Guns from "../../data/guns"

export class GunsVDU {

  gunsPanel: GUI.StackPanel
  title: GUI.TextBlock
  guns: {[mount: number]: TextBlock} = {}
  selected = new Set<number>()

  get mainComponent(): GUI.Control {
    return this.gunsPanel
  }
  constructor() {
    this.setupComponents()
  }
  dispose() {
    Object.values(this.guns).forEach((tb) => tb.dispose())
    this.gunsPanel.dispose()
  }
  setupComponents() {
    const gunsPanel = new GUI.StackPanel("Guns Panel")
    gunsPanel.isVertical = true
    gunsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    gunsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    gunsPanel.width = "240px"
    gunsPanel.height = "240px"
    this.gunsPanel = gunsPanel
    const title = this.GunText("title", "-=GUNS=-")
    this.title = title
    this.title.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    this.gunsPanel.addControl(title)
  }

  update() {
    const playerEntity = AppContainer.instance.player.playerEntity
    this.selected.clear()
    playerEntity.guns.groups[playerEntity.guns.selected].forEach(gunIndex => this.selected.add(gunIndex))

    for (const [index, mount] of Object.entries(playerEntity.guns.mounts)) {
      const gun = Guns[mount.class] as Gun
      if (this.guns[index] == undefined) {
        const gunText = this.GunText(gun.name, gun.name)
        this.guns[index] = gunText
        this.gunsPanel.addControl(gunText)
      }
      let selected = this.selected.has(parseInt(index))
      let name = selected ? `[${gun.name}]` : gun.name
      this.setState(this.guns[index], name, selected, mount.currentHealth, gun.health)
    }
  }

  GunText(name: string, value: string): GUI.TextBlock {
    const gunTextBlock = new GUI.TextBlock(name)
    gunTextBlock.fontFamily = "monospace"
    gunTextBlock.text = value
    gunTextBlock.color = "white"
    gunTextBlock.fontSize = 24
    gunTextBlock.height = "24px"
    gunTextBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    gunTextBlock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    this.gunsPanel.addControl(gunTextBlock)
    return gunTextBlock
  }

  setState(content: GUI.TextBlock, name: string, selected: boolean, value: number, base: number) {
    const percent = Math.round((value / base) * 100)
    content.text = `${name}`
    if (percent < 15) {
      content.color = "red"
    } else if (percent < 50) {
      content.color = "orange"
    } else if (percent < 75) {
      content.color = "yellow"
    } else {
      if (selected) {
        content.color = "blue"
      } else {
        content.color = "white"
      }
    }
  }
  
  padName(name:string) {
    return name.padEnd(10, ".")
  }
}