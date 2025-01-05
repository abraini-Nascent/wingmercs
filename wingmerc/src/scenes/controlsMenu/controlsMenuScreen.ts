import { GenericAxisNames, GenericButtonNames } from "./../../world/systems/input/combatInput/combatInputConfiguration"
import { MainMenuScene } from "../mainMenu/mainMenuLoop"
import * as GUI from "@babylonjs/gui"
import { MercScreen } from "../screen"
import { AppContainer } from "../../app.container"
import { Observer } from "@babylonjs/core"
import { InputNames, inputConfiguration } from "../../world/systems/input/combatInput/combatInputConfiguration"
import { SoundEffects } from "../../utils/sounds/soundEffects"
import { RetroGui } from "../../utils/retroGui"
import { FluentContainer, FluentRectangle, FluentScrollViewer, FluentSimpleButton, Ref } from "../../utils/fluentGui"
import { FluentTextBlockExtra, TextBlockExtra } from "../../utils/TextBlockExtra"
import { setIdealSize } from "../../utils/guiHelpers"
import { Keycodes } from "../../utils/keycodes"

export class ControlsMenuScreen extends MercScreen {
  xrIdealWidth = 1920
  xrAspectRation = 16 / 9

  observers = new Set<Observer<any>>()
  fullscreen: Observer<GUI.Vector2WithInfo>
  soundSliderOnValueChangedObserver: Observer<number>

  constructor() {
    super("Controls Screen")
    this.setupMain()
  }
  dispose() {
    super.dispose()
    if (this.fullscreen) {
      this.fullscreen.remove()
      this.fullscreen = undefined
    }
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
    r.thickness = this.cellWidth / 8
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
        SoundEffects.Select()
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
  split = Math.ceil(53 / 2) - 5
  setupMain(): void {
    RetroGui.Grid.reset()
    let width = 1920
    let height = 1080
    RetroGui.Grid.initialize(25, 53, width, height)
    setIdealSize(AppContainer.instance.engine, this.gui, width, height)
    this.gui.renderAtIdealSize = true
    this.widthRatio = this.gui.idealRatio
    this.observers.add(
      AppContainer.instance.engine.onResizeObservable.add(() => {
        this.widthRatio = this.gui.idealRatio
        setIdealSize(AppContainer.instance.engine, this.gui, width, height)
      })
    )
    this.cellHeight = RetroGui.Grid.getGridCellHeight()
    this.cellWidth = RetroGui.Grid.getGridCellWidth()
    this.fontSize = Math.floor(this.cellHeight / 5) * 5
    this.fontWidth = RetroGui.Grid.getTextWidth("A", `${this.fontSize}px monospace`)

    const panel = new FluentContainer(
      "panel",
      this.Header(),
      this.ButtonsHeader(),
      this.ActionsPanel()
      // this.MissionTitles(),
      // this.MissionDetails(),
      // this.MissionMap()
    )
      .background(RetroGui.colors.background)
      .width(`${width}px`)
      .height(`${height}px`)
    new FluentContainer(this.screen).addControl(panel).background(RetroGui.colors.background)

    this.screen.isPointerBlocker = true
    this.screen.isHitTestVisible = false
  }

  private Header = () => {
    return [
      new FluentTextBlockExtra("title", "-= CONTROLS SETTINGS =-")
        .color(RetroGui.colors.foreground)
        .modifyControl((tb) => {
          this.styleText(tb, RetroGui.colors.foreground)
          RetroGui.Grid.moveControl(tb, 0, 1, 24, 1)
        }),
      new FluentSimpleButton("done button", "BACK")
        .textBlock((tb) => {
          tb.modifyControl(this.styleLabel)
        })
        .onPointerClick(() => {
          SoundEffects.Select()
          this.dispose()
          AppContainer.instance.gameScene = new MainMenuScene()
        })
        .modifyControl((b: GUI.Button) => {
          RetroGui.Grid.moveControl(b, 0, 53 - 8, 8, 1)
          RetroGui.Components.configureButton(b)
          b.isHitTestVisible = true
        }),
      new FluentRectangle("screen").modifyControl((r) => {
        this.styleBox(r)
        RetroGui.Grid.moveControlMidCell(r, 1, 0, 0, 24)
      }),
    ]
  }

  private ButtonsHeader = () => {
    return [
      new FluentTextBlockExtra("title", "/ACTIONS/").color(RetroGui.colors.foreground).modifyControl((tb) => {
        this.styleText(tb, RetroGui.colors.foreground)
        RetroGui.Grid.moveControl(tb, 2, 1, 24, 1)
      }),
      new FluentTextBlockExtra("title", "/KEYBOARD - GAMEPAD/")
        .color(RetroGui.colors.foreground)
        .modifyControl((tb) => {
          this.styleText(tb, RetroGui.colors.foreground)
          RetroGui.Grid.moveControl(tb, 2, this.split, 22, 1)
        }),
      new FluentRectangle("buttons header").modifyControl((r) => this.styleBox(r)).retroGridBorder(1, 0, undefined, 3),
    ]
  }

  private ButtonRow = (row: number, name: string, action: string, keyboard: any, gamepad: any) => {
    // const label = `${keyboard} - ${gamepad}`
    let keyboardLabel = ""
    if (typeof keyboard == "number") {
      keyboardLabel = Keycodes[keyboard]
    } else if (Array.isArray(keyboard)) {
      keyboardLabel = keyboard.map((k) => Keycodes[k]).join(" / ")
    } else if (keyboard.mod != undefined) {
      keyboardLabel = `${Keycodes[keyboard.mod]}+${Keycodes[keyboard.key]}`
    }
    let gamepadLabel = "!"
    if (typeof gamepad == "number") {
      gamepadLabel = GenericButtonNames[gamepad]
    } else if (gamepad.axis != undefined) {
      gamepadLabel = GenericAxisNames[`${gamepad.axis}`][`${gamepad.direction}`]
    } else if (gamepad.mod != undefined) {
      gamepadLabel = `${GenericButtonNames[gamepad.mod]}+${GenericButtonNames[gamepad.button]}`
    } else if (gamepad.held != undefined) {
      gamepadLabel = `⬇${GenericButtonNames[gamepad.button]}`
    }
    const label = `${keyboardLabel} - ${gamepadLabel}`
    return [
      new FluentTextBlockExtra(`${name}-${action}`, action).color(RetroGui.colors.foreground).modifyControl((tb) => {
        this.styleText(tb, RetroGui.colors.foreground)
        RetroGui.Grid.moveControl(tb, row, 1, action.length, 1)
      }),
      new FluentTextBlockExtra(`${name}-${action}`, label).color(RetroGui.colors.foreground).modifyControl((tb) => {
        this.styleText(tb, RetroGui.colors.foreground)
        RetroGui.Grid.moveControl(tb, row, this.split, undefined, 1)
      }),
    ]
  }

  private ActionsPanel = () => {
    const scroll = new FluentScrollViewer("actions scroll")
      .modifyControl((sp) => (sp.thickness = 0))
      .retroGridMoveTo(4, 1, 51, 20)
      .setBarBackground(RetroGui.colors.shadow)
      .setBarColor(RetroGui.colors.foreground)
      .setBarSize(RetroGui.Grid.getGridCellWidth())
      .setWheelPrecision(0.01)

    const panel = new FluentContainer(
      "actions panel",
      Object.entries(InputNames)
        .map((entry, index) => {
          const [key, name] = entry
          return this.ButtonRow(
            index,
            key,
            name,
            inputConfiguration.keyboardConfig[key] ?? "",
            inputConfiguration.gamepadConfig[key] ?? ""
          )
        })
        .flat()
    ).growHeight()
    scroll.addControl(panel)
    return scroll
  }

  setupMainOld(): void {
    const title = new GUI.TextBlock()
    title.name = "title"
    title.fontFamily = "monospace"
    title.text = "-=Controls=-"
    title.color = "gold"
    // title.fontSize = 64
    title.fontSizeInPixels = 64
    title.heightInPixels = 128
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    title.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    title.paddingTopInPixels = 24
    this.gui.addControl(title)

    let scrollview = new GUI.ScrollViewer("Controller Inputs Scroll View")
    scrollview.width = "80%"
    scrollview.height = "80%"
    scrollview.background = "grey"
    scrollview.paddingTopInPixels = 10
    this.gui.addControl(scrollview)

    const mainPanel = new GUI.StackPanel("Controls Menu")
    mainPanel.isVertical = true
    mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    mainPanel.width = "100%"
    mainPanel.paddingBottomInPixels = 24
    mainPanel.paddingLeftInPixels = 24
    mainPanel.spacing = 24
    scrollview.addControl(mainPanel)
    const inputConfig = inputConfiguration
    const headers = this.createLabel("headers", "ACTION", "GAMEPAD", "KEYBOARD")
    mainPanel.addControl(headers)
    for (const [key, name] of Object.entries(InputNames)) {
      const label = this.createLabel(key, name, GenericButtonNames[(inputConfig[key] as string) ?? ""] ?? "", "")
      mainPanel.addControl(label)
    }

    const backButton = this.createMainMenuButton("back", "Back")
    backButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        AppContainer.instance.gameScene.dispose()
        AppContainer.instance.gameScene = new MainMenuScene()
      }, 333)
    })
    mainPanel.addControl(backButton)
  }

  private createMainMenuButton(name: string, text: string): GUI.Button {
    let button = GUI.Button.CreateSimpleButton(name, text)
    button.textBlock.fontFamily = "monospace"
    button.textBlock.color = "gold"
    button.textBlock.fontSizeInPixels = 28
    button.heightInPixels = 40
    button.widthInPixels = 280
    button.background = "dark blue"
    return button
  }

  private createLabel(name: string, label: string, controller: string, keyboard: string): GUI.StackPanel {
    const stackPanel = new GUI.StackPanel(name)
    stackPanel.isVertical = false
    stackPanel.height = "48px"

    const labelTextblock = new GUI.TextBlock()
    labelTextblock.name = label
    labelTextblock.fontFamily = "monospace"
    labelTextblock.text = label
    labelTextblock.color = "gold"
    // title.fontSize = 64
    labelTextblock.fontSizeInPixels = 24
    labelTextblock.heightInPixels = 48
    labelTextblock.widthInPixels = 240
    labelTextblock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    labelTextblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    labelTextblock.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    stackPanel.addControl(labelTextblock)

    const controllerTextblock = new GUI.TextBlock()
    controllerTextblock.name = controller
    controllerTextblock.fontFamily = "monospace"
    controllerTextblock.text = controller
    controllerTextblock.color = "gold"
    // title.fontSize = 64
    controllerTextblock.fontSizeInPixels = 24
    controllerTextblock.heightInPixels = 48
    controllerTextblock.widthInPixels = 120
    controllerTextblock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    controllerTextblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    controllerTextblock.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    stackPanel.addControl(controllerTextblock)

    const keyboardTextblock = new GUI.TextBlock()
    keyboardTextblock.name = keyboard
    keyboardTextblock.fontFamily = "monospace"
    keyboardTextblock.text = keyboard
    keyboardTextblock.color = "gold"
    // title.fontSize = 64
    keyboardTextblock.fontSizeInPixels = 24
    keyboardTextblock.heightInPixels = 48
    keyboardTextblock.widthInPixels = 120
    keyboardTextblock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    keyboardTextblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    keyboardTextblock.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    stackPanel.addControl(keyboardTextblock)

    return stackPanel
  }
}

/**

+-----------------------------------------------------+
| -=BUTTON MAPPING=-                                  |
|-----------------------------------------------------|
| [Actions]                  [Assigned Keys/Buttons]  |
|-----------------------------------------------------|
|   Move Forward             W / Left Stick Up        |
| > Move Backward            S / Left Stick Down      |
|   Turn Left                A / Left Stick Left      |
|   Turn Right               D / Left Stick Right     |
|   Fire Primary Weapon      Space / RT               |
|-----------------------------------------------------|
| [Press a Key or Button to Assign]                   |
| (Press Esc to cancel)                               |
+-----------------------------------------------------+

 */
