import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import {
  FluentBehaviourState,
  FluentContainer,
  FluentImage,
  FluentRectangle,
  FluentSimpleButton,
  Ref,
} from "../../utils/fluentGui"
import { Mission } from "../../data/missions/missionData"
import { generateMissionScreen } from "../../world/missionFactory.screen"
import { Mesh, Observer } from "@babylonjs/core"
import { MercScreen } from "../screen"
import { RetroGui } from "../../utils/retroGui"
import { FluentTextBlockExtra, TextBlockExtra } from "../../utils/TextBlockExtra"
import { CRTScreenGfx } from "../CRTScreenGfx"
import { AppContainer } from "../../app.container"
import { MainMenuScene } from "../mainMenu/mainMenuLoop"

class MissionSelectViewModel {
  missionList: FluentBehaviourState<Mission[]>
  activeMission: FluentBehaviourState<Mission>

  constructor(missions: Mission[]) {
    this.missionList = new FluentBehaviourState(missions)
    this.activeMission = new FluentBehaviourState(missions[0])
  }
  titles(): [string, Mission][] {
    return this.missionList.getValue().map((mission) => {
      return [mission.title, mission]
    })
  }
  setMission(mission: Mission) {
    this.activeMission.setValue(mission)
  }
}

export class MissionSelectRetroScreen {
  gui: AdvancedDynamicTexture
  screen: GUI.Container
  xrMode: boolean = false
  xrPlane: Mesh
  xrIdealWidth = 1920
  xrAspectRation = 16 / 10
  useMemory: boolean = null

  vm: MissionSelectViewModel

  observers = new Set<Observer<any>>()

  crt: CRTScreenGfx

  onDone: (mission: Mission) => void = null
  onBack: () => void = null

  constructor(private missions: Mission[]) {
    this.vm = new MissionSelectViewModel(missions)
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("Mission Select")
    this.gui = advancedTexture
    // this.gui.dispose()
    // this.crt = new CRTScreenGfx()
    // this.gui = this.crt.gui
    MercScreen.xrPanel(this)
    this.setupMain()
  }
  dispose() {
    // this.gui.removeControl(this.screen)
    // this.screen.dispose()
    this.gui.dispose()
    if (this.crt) {
      this.crt.dispose()
    }
    this.observers.forEach((obs) => obs.remove())
    this.observers.clear()
  }

  cellHeight: number
  cellWidth: number
  fontSize: number
  fontWidth: number
  widthRatio: number

  private styleText = (tb: GUI.TextBlock, color: string) => {
    tb.fontFamily = "KongfaceRegular"
    tb.fontSize = `${this.fontSize}px`
    tb.color = color
    const tbe = TextBlockExtra.isExtra(tb)
    if (tbe) {
      tbe.letterWidthInPixels = this.cellWidth
    }
    tb.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    tb.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    tb.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
    tb.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
  }

  private styleLabel = (tb: GUI.TextBlock) => {
    this.styleText(tb, RetroGui.colors.foreground)
  }
  private styleValue = (tb: GUI.TextBlock) => {
    this.styleText(tb, RetroGui.colors.regular)
  }
  private styleBox = (r: GUI.Rectangle) => {
    r.color = RetroGui.colors.foreground
    r.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    r.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    r.isHitTestVisible = false
  }
  private Label = (row: number, col: number, label: string) => {
    const text = `${label}`
    return new FluentTextBlockExtra(label, text)
      .modifyControl(this.styleLabel)
      .retroGridMoveTo(row, col, text.length, 1)
  }
  private Value = (row: number, col: number, label: string) => {
    const text = `${label}`
    return new FluentTextBlockExtra(label, text)
      .modifyControl(this.styleValue)
      .retroGridMoveTo(row, col, text.length, 1)
  }
  private wordWrap(text: string, width: number): string[] {
    const words = text.split(/\s+/) // Split the text into words based on whitespace
    const lines: string[] = []
    let currentLine = ""

    for (const word of words) {
      if ((currentLine + word).length > width) {
        if (currentLine) {
          lines.push(currentLine.trim()) // Add the current line to the array
        }
        currentLine = word // Start a new line with the current word
      } else {
        currentLine += (currentLine ? " " : "") + word // Append the word to the current line
      }
    }

    if (currentLine) {
      lines.push(currentLine.trim()) // Push the last line
    }

    return lines
  }
  private Inverted = (
    color: string,
    row: number,
    col: number,
    label: string,
    width?: number,
    multiLine?: (height: number) => void
  ) => {
    const text = `  ${label}`
    const tb = new Ref<GUI.TextBlock>()
    let rows = [text]
    if (width && multiLine) {
      rows = this.wordWrap(text, width)
      multiLine(rows.length)
    }
    return new FluentContainer(
      "inverted " + label,
      (() => {
        const controls = []
        const rows = this.wordWrap(text, width)
        rows.forEach((row, idx) => {
          controls.push(
            new FluentTextBlockExtra(label, row)
              .modifyControl((tbe: TextBlockExtra) => {
                this.styleText(tbe, RetroGui.colors.background)
              })
              .retroGridMoveTo(idx, 0, width, 1)
          )
        })
        return controls
      })()
    ).modifyControl((c) => {
      c.background = color //RetroGui.colors.foreground
      RetroGui.Grid.moveControl(c, row, col, width ? width : text.length, rows.length)
    })
  }
  private LabelValue = (row: number, col: number, label: string, value: string) => {
    const text = `${label}: ${value}`
    return new FluentTextBlockExtra(label, text).modifyControl((tbe: TextBlockExtra) => {
      this.styleText(tbe, RetroGui.colors.foreground)
      RetroGui.Grid.moveControl(tbe, row, col, text.length, 1)
      tbe.setAttribute(text.indexOf(value), value.length, RetroGui.colors.regular)
    })
  }
  private Button = (text: string, action: () => void) => {
    return new FluentSimpleButton(`${text} button`, `${text}`)
      .textBlock((tb) => {
        tb.modifyControl(this.styleLabel)
      })
      .onPointerClick(() => {
        action()
      })
      .modifyControl((b: any) => {
        RetroGui.Components.configureButton(b)
      })
  }
  private ButtonNaked = (text: string, action: () => void) => {
    return new FluentSimpleButton(`${text} button`, `${text}`)
      .textBlock((tb) => {
        tb.modifyControl(this.styleLabel)
      })
      .onPointerClick(() => {
        action()
      })
      .modifyControl((b: any) => {
        RetroGui.Components.configureNakedButton(b)
      })
  }

  setupMain() {
    RetroGui.Grid.reset()
    RetroGui.Grid.initialize(25, 53, 1920, 1080)
    this.gui.idealWidth = 1920

    this.widthRatio = this.gui.idealWidth / AppContainer.instance.engine.getRenderWidth()
    this.observers.add(
      AppContainer.instance.engine.onResizeObservable.add(() => {
        this.widthRatio = this.gui.idealWidth / AppContainer.instance.engine.getRenderWidth()
      })
    )
    this.cellHeight = RetroGui.Grid.getGridCellHeight()
    this.cellWidth = RetroGui.Grid.getGridCellWidth()
    this.fontSize = Math.floor(this.cellHeight / 5) * 5
    this.fontWidth = RetroGui.Grid.getTextWidth("A", `${this.fontSize}px monospace`)

    this.screen = new FluentContainer(
      "Mission Select Main Screen",
      this.Header(),
      this.MissionTitles(),
      this.MissionDetails(),
      this.MissionMap()
    )
      // .background("gray")
      .background(RetroGui.colors.background)
      .isPointerBlocker(true)
      .build()
    this.screen.isPointerBlocker = true
    this.screen.isHitTestVisible = false
    this.gui.addControl(this.screen)
  }

  private Header = () => {
    return [
      new FluentTextBlockExtra("title", "-= MISSION SELECT =-")
        .color(RetroGui.colors.foreground)
        .modifyControl((tb) => {
          this.styleText(tb, RetroGui.colors.foreground)
          RetroGui.Grid.moveControl(tb, 0, 0, 20, 1)
        }),
      new FluentSimpleButton("done button", "BACK")
        .textBlock((tb) => {
          tb.modifyControl(this.styleLabel)
        })
        .onPointerClick(() => {
          this.dispose()
          if (this.onBack) {
            this.onBack()
          } else {
            AppContainer.instance.gameScene = new MainMenuScene()
          }
        })
        .modifyControl((b: GUI.Button) => {
          RetroGui.Grid.moveControl(b, 0, 30, 8, 1)
          RetroGui.Components.configureButton(b)
          b.isHitTestVisible = true
        }),
      // .zIndex(15),
      new FluentSimpleButton("continue button", "CONTINUE")
        .textBlock((tb) => {
          tb.modifyControl(this.styleLabel)
        })
        .onPointerClick(() => {
          if (this.onDone) {
            this.onDone(this.vm.activeMission.getValue())
          }
        })
        .modifyControl((b: any) => {
          RetroGui.Grid.moveControl(b, 0, 39, 15, 1)
          RetroGui.Components.configureButton(b)
        }),
      // .zIndex(6),
      new FluentRectangle("screen").thickness(this.cellWidth / 8).modifyControl((r) => {
        this.styleBox(r)
        RetroGui.Grid.moveControlMidCell(r, 1, 0, 0, 24)
      }),
    ]
  }
  private MissionTitles() {
    return new FluentContainer("Mission Titles")
      .bindState(this.vm.missionList, (container, missions) => {
        container.clear()
        container.addControl(
          this.Label(0, 0, "+Mission List+"),
          this.vm
            .titles()
            .map(([title, mission], index) => {
              return [
                this.Label(index + 1, 0, "").bindState(this.vm.activeMission, (label, activeMission) => {
                  if (activeMission == mission) {
                    label.setText(">")
                  } else {
                    label.setText("")
                  }
                }),
                this.Button(title, () => {
                  this.vm.setMission(mission)
                }).retroGridMoveTo(index + 1, 1, 51, 1),
              ]
            })
            .flat()
        )
      })
      .retroGridMoveTo(2, 1, 51, 7)
  }
  private MissionDetails() {
    return new FluentContainer("Mission Details")
      .bindState(this.vm.activeMission, (container, mission) => {
        let row = 1
        container.clear()
        container.addControl(
          mission.briefing
            .split("\r\n")
            .map((objective, index) => {
              if (index == 0) {
                return this.Label(row++, 0, objective)
              }
              return this.wordWrap(objective, 25).map((line, index) => {
                if (index == 0) {
                  return this.Label(row++, 0, "-" + line)
                }
                return this.Label(row++, 0, " " + line)
              })
            })
            .flat()
        )
      })
      .retroGridMoveTo(7, 1, 27, 15)
  }
  private MissionMap() {
    return new FluentRectangle(
      "container",
      new FluentContainer("map")
        .bindState(this.vm.activeMission, (container, mission: Mission) => {
          if (mission == undefined) {
            return
          }
          const missionImage = generateMissionScreen(mission)
          const dataUrl = missionImage.toDataURL()
          // console.log(dataUrl)
          container.clear()
          container.addControl(new FluentImage("mission image", dataUrl).size(750, 750))
        })
        .adaptHeightToChildren()
    )
      .retroGridBorder(6, 29)
      .width(760)
      .height(760)
      .thickness(5)
      .color(RetroGui.colors.foreground)
  }

  updateScreen(dt: number) {
    if (this.crt) {
      this.crt.update(dt)
    }
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
