import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import {
  FluentBehaviourState,
  FluentContainer,
  FluentGrid,
  FluentImage,
  FluentRectangle,
  FluentSimpleButton,
  FluentTextBlock,
  FluentVerticalStackPanel,
  Ref,
} from "../../utils/fluentGui"
import { Mission } from "../../data/missions/missionData"
import { generateMissionScreen } from "../../world/missionFactory.screen"
import { Color3, Mesh } from "@babylonjs/core"
import { MercScreen } from "../screen"

export class MissionSelectScreen {
  gui: AdvancedDynamicTexture
  screen: GUI.Container
  xrMode: boolean = false
  xrPlane: Mesh
  xrIdealWidth = 1920
  xrAspectRation = 16 / 9
  useMemory: boolean = null

  activeMission: FluentBehaviourState<Mission>
  onDone: () => void = null

  constructor(private missions: Mission[]) {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("Mission Select")
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
    const styleSubtitle = (tb: TextBlock) => {
      styleFont(tb)
      tb.fontSizeInPixels = 24
      tb.heightInPixels = 24
      tb.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
      tb.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
      tb.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
      return tb
    }
    const missionToRef = new Map<Mission, Ref<GUI.Container>>()
    this.activeMission = new FluentBehaviourState(undefined)

    this.screen = new FluentContainer(
      "Main Screen",
      new FluentGrid("MainGrid")
        .addRow(1, false)
        .addColumn(0.5, false)
        .addControl(
          FluentVerticalStackPanel(
            "Missions Panel",
            new FluentTextBlock("salvage title", "MISSIONS").modifyControl(styleTitle).resizeToFit(),
            new FluentTextBlock("salvage desc", "Select your mission").modifyControl(styleFont).resizeToFit(),
            this.missions.map((mission, index) =>
              new FluentContainer(
                `mission-${index}`,
                FluentVerticalStackPanel(
                  "mission",
                  new FluentTextBlock("briefing", mission.title)
                    .modifyControl(styleSubtitle)
                    .resizeToFit()
                    .textHorizontalAlignment("left")
                    .horizontalAlignment("center"),
                  new FluentTextBlock("briefing", mission.briefing)
                    .modifyControl(styleFont)
                    .resizeToFit()
                    .textHorizontalAlignment("left")
                    .horizontalAlignment("left")
                )
              )
                .storeIn(() => {
                  const ref = new Ref<GUI.Container>()
                  missionToRef.set(mission, ref)
                  return ref
                })
                .adaptHeightToChildren()
                .width("100%")
                .onPointerClick(() => {
                  // clear current selected
                  missionToRef.forEach((ref) => (ref.get().background = undefined))
                  this.activeMission.setValue(mission)
                  const ref = missionToRef.get(mission)
                  ref.get().background = "blue"
                })
            )
          )
            .verticalAlignment("top")
            .width("80%")
        )
        .addColumn(0.5, false)
        .addControl(
          new FluentContainer(
            "Details Panel",
            new FluentTextBlock("detail title", "MISSION DETAILS")
              .modifyControl(styleTitle)
              .resizeToFit()
              .verticalAlignment("top"),
            FluentVerticalStackPanel(
              "details",
              new FluentTextBlock("details", "BRIEFING")
                .modifyControl(styleFont)
                .resizeToFit()
                .horizontalAlignment("left"),
              new FluentRectangle(
                "container",
                new FluentContainer("map")
                  .bindState(this.activeMission, (container, mission: Mission) => {
                    if (mission == undefined) {
                      return
                    }
                    const missionImage = generateMissionScreen(mission)
                    const dataUrl = missionImage.toDataURL()
                    // console.log(dataUrl)
                    container.clear()
                    container.addControl(new FluentImage("mission image", dataUrl).size(500, 500))
                  })
                  .adaptHeightToChildren()
              )
                .width(510)
                .height(510)
                .thickness(5)
                .color(Color3.Blue().toHexString())
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
        new FluentSimpleButton("select", "SELECT")
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
      // .background("gray")
      .build()
    this.gui.addControl(this.screen)
  }

  updateScreen(dt: number) {
    MercScreen.xrPanel(this)
  }

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
