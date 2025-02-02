import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../../app.container"
import { Gun } from "../../../data/guns/gun"
import * as Guns from "../../../data/guns"
import { VDU } from "./SpaceCombatHUD.VDU"

export class GunsVDU implements VDU {
  private gunsPanel: GUI.StackPanel
  private title: GUI.TextBlock
  private guns: { [mount: number]: TextBlock } = {}
  private selected = new Set<number>()

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

  vduButtonPressed(button: number) {
    if (button == 0) {
      const player = AppContainer.instance.player.playerEntity
      player.vduState.left = "guns"
      player.guns.selected += 1
      let gunGroupCount = player.guns.groups.length
      if (player.guns.selected >= gunGroupCount) {
        player.guns.selected = 0
      }
    }
    if (button == 4) {
      const player = AppContainer.instance.player.playerEntity
      player.vduState.left = "guns"
      player.guns.selected -= 1
      if (player.guns.selected < 0) {
        player.guns.selected = player.guns.groups.length - 1
      }
    }
  }

  update() {
    const playerEntity = AppContainer.instance.player.playerEntity
    this.selected.clear()
    playerEntity.guns.groups[playerEntity.guns.selected].forEach((gunIndex) => this.selected.add(gunIndex))

    for (const [index, mount] of Object.entries(playerEntity.guns.mounts)) {
      const gun = Guns[mount.class] as Gun
      const gunStats = mount.stats
      if (this.guns[index] == undefined) {
        const gunText = this.GunText(gun.name, gun.name)
        this.guns[index] = gunText
        this.gunsPanel.addControl(gunText)
      }
      let selected = this.selected.has(parseInt(index))
      let name = selected ? `[${gun.name}]` : gun.name
      let ammo: number = undefined
      if (mount.ammo != undefined) {
        const gunAmmo = playerEntity.gunAmmo
        ammo = gunAmmo[mount.ammo]?.current ?? 0
      }
      this.setState(this.guns[index], name, selected, mount.currentHealth, gunStats.health, ammo)
    }
  }

  private setupComponents() {
    const gunsPanel = new GUI.StackPanel("Guns Panel")
    gunsPanel.isVertical = true
    gunsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    gunsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    gunsPanel.width = "240px"
    gunsPanel.height = "240px"
    this.gunsPanel = gunsPanel
    const title = this.GunText("title", "-=GUNS=-", true)
    this.title = title
    this.title.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    this.gunsPanel.addControl(title)
  }

  private GunText(name: string, value: string, title: boolean = false): GUI.TextBlock {
    const gunTextBlock = new GUI.TextBlock(name)
    gunTextBlock.fontFamily = "monospace"
    gunTextBlock.text = value
    gunTextBlock.color = "white"
    if (title) {
      gunTextBlock.fontSize = 24
      gunTextBlock.height = "24px"
    } else {
      gunTextBlock.fontSize = 12
      gunTextBlock.height = "14px"
    }
    gunTextBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    gunTextBlock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    this.gunsPanel.addControl(gunTextBlock)
    return gunTextBlock
  }

  private setState(
    content: GUI.TextBlock,
    name: string,
    selected: boolean,
    value: number,
    base: number,
    ammo: number | undefined
  ) {
    const percent = Math.round((value / base) * 100)
    content.text = `${name}`
    if (ammo != undefined) {
      content.text += ` rnds: ${Math.max(0, ammo)}`
    }
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

  private padName(name: string) {
    return name.padEnd(10, ".")
  }
}
