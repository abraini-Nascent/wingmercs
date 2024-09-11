import { TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../../app.container";

/* 20w x 9h
         __
        /  \
       |    |
    ___|    |___
   /   |_  _|   \
 /                \
|___  \______/  ___|
    |    __    |
     \__/  \__/
*/

const SHIP_ART = [
  `         __`,
  `        /  \\`,
  `       |    |`,
  `    ___|    |___`,
  `   /   |_  _|   \\`,
  ` /                \\`,
  `|___  \\______/  ___|`,
  `    |    __    |`,
  `     \\__/  \\__/`,
  ]

const SHIP_ART3 = [
`.........__`,
`......../  \\`,
`.......|    |`,
`....___|    |___`,
`.../   |_  _|   \\`,
`./                \\`,
`|___  \\______/  ___|`,
`....|    __    |`,
`.....\\__/  \\__/`,
]
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
    const weaponsPanel = new GUI.StackPanel("Weapons Panel")
    weaponsPanel.isVertical = true
    weaponsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    weaponsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    weaponsPanel.width = "240px"
    weaponsPanel.height = "240px"
    this.weaponsPanel = weaponsPanel
    const title = this.WeaponText("title", "-=WEAPONS=-")
    this.title = title
    this.title.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    // this.ShipArt()
  }

  update() {
    const playerEntity = AppContainer.instance.player.playerEntity

    const text = true
    if (text)
    for (const index of playerEntity.weapons.mounts.keys()) {
      const mount = playerEntity.weapons.mounts[index]
      if (this.weapons[mount.type] == undefined) {
        let typeTextBoxes: TextBlock[] = []
        this.weapons[mount.type] = typeTextBoxes
      }
      if (this.weapons[mount.type].length < mount.count) {
        let typeTextBoxes: TextBlock[] = this.weapons[mount.type]
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

  ShipArt(): GUI.TextBlock {
    const shipTextBlock = new GUI.TextBlock("Ship Art")
    shipTextBlock.fontFamily = "monospace"
    shipTextBlock.textWrapping = GUI.TextWrapping.WordWrap
    shipTextBlock.text = SHIP_ART.join("\n")
    shipTextBlock.color = "green"
    shipTextBlock.fontSize = 15
    // shipTextBlock.height = "24px"
    shipTextBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    shipTextBlock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    this.weaponsPanel.addControl(shipTextBlock)
    return shipTextBlock
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