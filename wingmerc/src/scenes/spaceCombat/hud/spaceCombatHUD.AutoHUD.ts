import { TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../../app.container"
import {
  FluentBehaviourState,
  FluentContainer,
  FluentTextBlock,
  FluentVerticalStackPanel,
} from "../../../utils/fluentGui"

export class AutoHUD {
  hud: GUI.Container
  autoState = new FluentBehaviourState(false)
  auto: boolean = false

  get mainComponent(): GUI.Control {
    return this.hud
  }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.hud.dispose()
  }
  setupMain() {
    this.hud = new FluentContainer(
      "AutoHUD",
      FluentVerticalStackPanel(
        "auto panel",
        new FluentTextBlock("auto")
          .modifyControl((auto) => {
            auto.fontFamily = "monospace"
            auto.text = "AUTO"
            auto.color = "brown"
            auto.fontSize = 24
            auto.height = "24px"
            auto.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
            auto.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
          })
          .bindState(this.autoState, (tb, canAuto: boolean) => {
            if (canAuto) {
              tb.color("gold")
            } else {
              tb.color("brown")
            }
          })
      )
        .horizontalAlignment("right")
        .verticalAlignment("top")
        .width("240px")
        .padding(24, 0, 0, 24)
    ).build()
  }
  update(dt: number) {
    const playerEntity = AppContainer.instance.player?.playerEntity
    if (playerEntity) {
      if (playerEntity.canAutopilot && this.auto == false) {
        this.auto = true
        this.autoState.setValue(this.auto)
      } else if (playerEntity.canAutopilot == false && this.auto == true) {
        this.auto = false
        this.autoState.setValue(this.auto)
      }
    }
  }
}
