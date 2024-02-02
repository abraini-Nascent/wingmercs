import { TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../app.container";

export class WeaponsVDU {

  weaponsPanel: GUI.StackPanel
  title: GUI.TextBlock
  weapons: {[type: string]: TextBlock[]} = {}

  get mainComponent(): GUI.Control {
    return this.weaponsPanel
  }
  constructor() {
    this.setupComponents()
  }
  dispose() {
    Object.values(this.weapons).forEach((wp) => { wp.forEach((tb) => tb.dispose()) })
    this.weaponsPanel.dispose()
  }
  setupComponents() {
    const weaponsPanel = new GUI.StackPanel()
    weaponsPanel.isVertical = true
    weaponsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    weaponsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    weaponsPanel.width = "240px"
    this.weaponsPanel = weaponsPanel
    const title = this.WeaponText("title", "-=WEAPONS=-")
    this.title = title
  }

  update() {
    const playerEntity = AppContainer.instance.player.playerEntity
    for (const index of playerEntity.weapons.mounts.keys()) {
      const mount = playerEntity.weapons.mounts[index]
      if (this.weapons[mount.type] == undefined) {
        let typeTextBoxes: TextBlock[] = []
        this.weapons[mount.type] = typeTextBoxes
        for (let i = 0; i < mount.count; i += 1) {
          typeTextBoxes.push(this.WeaponText(mount.type, mount.type))
        }
      } else if (this.weapons[mount.type].length > mount.count) {
        for (let i = 0; i < this.weapons[mount.type].length - mount.count; i += 1) {
          let popped = this.weapons[mount.type].pop()
          this.weaponsPanel.removeControl(popped)
          popped.dispose()
        }
      }
      if (index == playerEntity.weapons.selected) {
        this.weapons[mount.type].forEach((tb) => { 
          tb.text = `[${mount.type}]`
          tb.color = "blue"
        })
      } else {
        this.weapons[mount.type].forEach((tb) => { 
          tb.text = `${mount.type}`
          tb.color = "white"
        })
      }
    }
  }

  WeaponText(name: string, value: string): GUI.TextBlock {
    const weaponTextBlock = new GUI.TextBlock(name)
    weaponTextBlock.fontFamily = "monospace"
    weaponTextBlock.text = value
    weaponTextBlock.color = "white"
    weaponTextBlock.fontSize = 24
    weaponTextBlock.height = "24px"
    weaponTextBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    weaponTextBlock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    this.weaponsPanel.addControl(weaponTextBlock)
    return weaponTextBlock
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
  
  padName(name:string) {
    return name.padEnd(10, ".")
  }
}