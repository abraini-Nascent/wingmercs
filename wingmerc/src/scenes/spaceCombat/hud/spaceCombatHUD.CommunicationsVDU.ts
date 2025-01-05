import { AppContainer } from "./../../../app.container"
import { world } from "./../../../world/world"
import { VDU } from "./SpaceCombatHUD.VDU"
import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { Entity } from "../../../world/world"
import { DisposeBag, FluentTextBlock, FluentVerticalStackPanel, Ref } from "../../../utils/fluentGui"
import { CommunicationsOptions } from "../../../world/systems/ai/communications"
import { debugLog } from "../../../utils/debuglog"

const DelayLimit = 1500
export class CommunicationsVDU implements VDU {
  screen: GUI.Container
  disposeBag = new DisposeBag()
  commsStack = new Ref<GUI.StackPanel>()
  titleTB = new Ref<GUI.TextBlock>()
  lastComms: string = undefined
  delay: number = 0
  flip = false
  get mainComponent(): GUI.Control {
    return this.screen
  }
  constructor() {
    this.setupMain()
  }

  vduButtonPressed(button: number) {
    world.addComponent(AppContainer.instance.player.playerEntity, "commsCommand", { open: true, option: button })
  }

  dispose() {
    this.disposeBag.dispose()
  }
  setupMain() {
    const styleFont = (control: GUI.TextBlock) => {
      control.fontFamily = "monospace"
      control.color = "white"
      control.fontSize = 20
      control.resizeToFit = true
      control.height = "20px"
    }
    this.screen = FluentVerticalStackPanel(
      "stack",
      new FluentTextBlock("title", "-=[Comms]=-").storeIn(this.titleTB).resizeToFit(true).modifyControl(styleFont),
      FluentVerticalStackPanel("stack-main").storeIn(this.commsStack).width(240).horizontalAlignment("left")
    )
      .width(240)
      .height(240)
      .build()
  }

  styleObjective(tb: TextBlock) {
    tb.fontFamily = "monospace"
    tb.color = "white"
    tb.fontSize = "18px"
    tb.height = "20px"
  }
  styleStep(tb: TextBlock) {
    tb.fontFamily = "monospace"
    tb.color = "white"
    tb.fontSize = "14px"
    tb.textWrapping = true
    tb.widthInPixels = 240
    tb.heightInPixels = 30
    tb.lineSpacing = "0px"
  }

  update(playerEntity: Entity, dt: number) {
    // we only want to call this when asked to open comms
    if (playerEntity.openComms != this.lastComms) {
      // flop
      this.flip = !this.flip
      if (this.flip) {
        this.titleTB.get().text = "+=[Comms]=+"
      } else {
        this.titleTB.get().text = "-=[Comms]=-"
      }
      debugLog("[commsVDU] new open comms", playerEntity.openComms)
      this.lastComms = playerEntity.openComms
      this.commsStack.get().clearControls()
      const options = CommunicationsOptions(playerEntity)
      let optionIdx = 0
      for (const option of options) {
        optionIdx += 1
        const textblock = new FluentTextBlock(`objective-${optionIdx}`, `${optionIdx}. ${option.label}`)
          .modifyControl(this.styleObjective)
          .textHorizontalAlignment("left")
        this.commsStack.get().addControl(textblock.build())
      }
    }
    if (this.lastComms != undefined) {
      this.delay += dt
      if (this.delay > DelayLimit) {
        this.delay = 0
        this.lastComms = undefined
      }
    }
  }
}
