import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../app.container"
import { MainMenuScene } from "../mainMenu/mainMenuLoop"
import {
  FluentContainer,
  FluentGrid,
  FluentHorizontalStackPanel,
  FluentScrollViewer,
  FluentSimpleButton,
  FluentTextBlock,
  FluentVerticalStackPanel,
} from "../../utils/fluentGui"
import { FlexContainer } from "../../utils/guiHelpers"

export class MissionOverScreen {
  gui: AdvancedDynamicTexture
  screen: GUI.Container
  title: TextBlock
  scorePanel: GUI.StackPanel
  oldHighScore: number
  useMemory: boolean = null
  onDone: () => void = null

  constructor() {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("Mission Over")
    this.gui = advancedTexture
    this.setupMain()
  }
  dispose() {
    this.gui.removeControl(this.screen)
    this.screen.dispose()
    this.gui.dispose()
  }

  setupMain() {
    const styleFont = (tb: TextBlock) => {
      tb.fontFamily = "monospace"
      tb.color = "gold"
      return tb
    }
    const styleTitle = (tb: TextBlock) => {
      styleFont(tb)
      tb.fontSizeInPixels = 64
      tb.heightInPixels = 64
      tb.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
      tb.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
      tb.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
      return tb
    }

    // console.log("+= mission salvage =+")
    // console.dir(AppContainer.instance.player.playerEntity.salvageClaims)
    // console.log("-= mission salvage =-")

    this.screen = new FluentContainer(
      "Main Screen",
      new FluentGrid("MainGrid")
        .addRow(1, false)
        .addColumn(0.5, false)
        .addControl(
          FluentVerticalStackPanel(
            "Parts Panel",
            new FluentTextBlock("salvage title", "SALVAGE").modifyControl(styleTitle).resizeToFit(),
            new FluentTextBlock("salvage desc", "Claim your salvage").modifyControl(styleFont).resizeToFit(),
            new FluentContainer(
              "shares remaining container",
              new FluentTextBlock("remaining title", "Remaining Claims")
                .modifyControl(styleFont)
                .resizeToFit()
                .horizontalAlignment("left"),
              new FluentTextBlock("claim count", `10 / 10`)
                .modifyControl(styleFont)
                .resizeToFit()
                .horizontalAlignment("right")
            )
              .adaptHeightToChildren()
              .width("100%")
          ).verticalAlignment("top")
        )
        .addColumn(0.5, false)
        .addControl(
          new FluentContainer(
            "Payment Panel",
            new FluentTextBlock("payment title", "Payout")
              .modifyControl(styleTitle)
              .resizeToFit()
              .verticalAlignment("top"),
            new FluentContainer(
              "total payout",
              new FluentTextBlock("total payout title", "TOTAL PAYOUT")
                .modifyControl(styleFont)
                .resizeToFit()
                .horizontalAlignment("left"),
              new FluentTextBlock("total payout value", "$10 000")
                .modifyControl(styleFont)
                .resizeToFit()
                .horizontalAlignment("right")
            )
              .adaptHeightToChildren()
              .width("100%")
              .verticalAlignment("bottom")
          )
            .adaptWidthToChildren()
            .verticalAlignment("bottom")
        )
        .verticalAlignment("center")
        .width("90%")
        .height("80%"),
      new FluentContainer(
        "bottom",
        new FluentSimpleButton("done", "DONE")
          .onPointerClick(() => {
            if (this.onDone) {
              this.onDone()
            }
          })
          .modifyControl((btn) => {
            styleFont(btn.textBlock)
          })
          .horizontalAlignment("right")
          // .verticalAlignment("bottom")
          .height(40)
          .width("20%")
      )
        .verticalAlignment("bottom")
        .width("90%")
        .height("10%")
    )
      .background("gray")
      .build()
    this.gui.addControl(this.screen)
  }

  updateScreen(dt: number) {}

  createLabel(text: string): GUI.TextBlock {
    const textblock = new GUI.TextBlock()
    textblock.name = "time"
    textblock.fontFamily = "monospace"
    textblock.text = text
    textblock.color = "gold"
    textblock.fontSize = 24
    textblock.height = "28px"
    textblock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    textblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    textblock.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP

    return textblock
  }

  private isLocalStorageAvailable() {
    if (this.useMemory !== null) {
      return !this.useMemory
    }
    try {
      window.localStorage.setItem("check", "true")
      window.localStorage.removeItem("check")
      // console.log("LocalStorage Available")
      this.useMemory = false
      return true
    } catch (error) {
      // console.log("LocalStorage NOT Available")
      this.useMemory = true
      return false
    }
  }
}
