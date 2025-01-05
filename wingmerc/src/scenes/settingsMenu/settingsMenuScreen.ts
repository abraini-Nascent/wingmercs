import { MainMenuScene } from "./../mainMenu/mainMenuLoop"
import * as GUI from "@babylonjs/gui"
import { MercScreen } from "../screen"
import { AppContainer } from "../../app.container"
import { Engine, Observer } from "@babylonjs/core"
import { MusicPlayer } from "../../utils/music/musicPlayer"
import { debugLog } from "../../utils/debuglog"
import { RetroGui } from "../../utils/retroGui"
import {
  FluentCheckbox,
  FluentContainer,
  FluentControl,
  FluentRectangle,
  FluentSimpleButton,
  FluentSlider,
  Ref,
} from "../../utils/fluentGui"
import { SoundEffects } from "../../utils/sounds/soundEffects"
import { FluentTextBlockExtra, TextBlockExtra } from "../../utils/TextBlockExtra"
import { setIdealSize } from "../../utils/guiHelpers"

export class SettingsMenuScreen extends MercScreen {
  xrIdealWidth = 1920
  xrAspectRation = 16 / 9

  observers = new Set<Observer<any>>()

  fullscreen: Observer<GUI.Vector2WithInfo>
  soundSliderOnValueChangedObserver: Observer<number>
  effectsSliderOnValueChangedObserver: Observer<number>
  musicSliderOnValueChangedObserver: Observer<number>
  voiceSliderOnValueChangedObserver: Observer<number>

  constructor() {
    super("MainMenuScreen")
    this.setupMain()
  }
  dispose() {
    super.dispose()
    if (this.fullscreen) {
      this.fullscreen.remove()
      this.fullscreen = undefined
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
  private wholePercent = (volume) => {
    return Math.round(volume * 100)
  }
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
      this.Volumes(),
      this.Toggles()
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
      new FluentTextBlockExtra("title", "-= GAME SETTINGS =-").color(RetroGui.colors.foreground).modifyControl((tb) => {
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
  private Volumes = () => {
    let row = 2
    const globalSlider = this.createSlider("Sound", "Sound", this.wholePercent(Engine.audioEngine.getGlobalVolume()))
    let soundSliderOnValueChangedObserver = globalSlider.onValueChangedObservable.add((value, event) => {
      const newVolume = value / 100
      debugLog("[Settings] new sound volume", newVolume)
      Engine.audioEngine.setGlobalVolume(newVolume)
    })
    this.soundSliderOnValueChangedObserver = soundSliderOnValueChangedObserver

    let volumes = AppContainer.instance.volumes
    const effectsSlider = this.createSlider("Effects", "Effects", this.wholePercent(volumes.sound))
    let effectsSliderOnValueChangedObserver = effectsSlider.onValueChangedObservable.add((value, event) => {
      const newVolume = value / 100
      debugLog("[Settings] new effects volume", newVolume)
      volumes.sound = newVolume
    })
    this.effectsSliderOnValueChangedObserver = effectsSliderOnValueChangedObserver

    const musicSlider = this.createSlider("Music", "Music", this.wholePercent(volumes.music))
    let musicSliderOnValueChangedObserver = musicSlider.onValueChangedObservable.add((value, event) => {
      AppContainer.instance.volumes.music
      const newVolume = value / 100
      debugLog("[Settings] new music volume", newVolume)
      volumes.music = newVolume
      MusicPlayer.instance.updateVolume(newVolume)
    })
    this.musicSliderOnValueChangedObserver = musicSliderOnValueChangedObserver

    const voiceSlider = this.createSlider("Voice", "Voice", this.wholePercent(volumes.voice))
    let voiceSliderOnValueChangedObserver = voiceSlider.onValueChangedObservable.add((value, event) => {
      AppContainer.instance.volumes.music
      const newVolume = value / 100
      debugLog("[Settings] new volume", newVolume)
      volumes.voice = value
    })
    this.voiceSliderOnValueChangedObserver = voiceSliderOnValueChangedObserver

    return [
      new FluentTextBlockExtra("Main volume", "Main Volume").modifyControl((tb) => {
        this.styleText(tb, RetroGui.colors.foreground)
        RetroGui.Grid.moveControl(tb, row, 1, 20, 1)
      }),
      new FluentSlider(globalSlider).retroGridMoveTo(row++, 30, 10, 1),

      new FluentTextBlockExtra("Music volume", "Music Volume").modifyControl((tb) => {
        this.styleText(tb, RetroGui.colors.foreground)
        RetroGui.Grid.moveControl(tb, row, 1, 20, 1)
      }),
      new FluentSlider(musicSlider).retroGridMoveTo(row++, 30, 10, 1),

      new FluentTextBlockExtra("Effects volume", "Effects Volume").modifyControl((tb) => {
        this.styleText(tb, RetroGui.colors.foreground)
        RetroGui.Grid.moveControl(tb, row, 1, 20, 1)
      }),
      new FluentSlider(effectsSlider).retroGridMoveTo(row++, 30, 10, 1),

      new FluentTextBlockExtra("Main volume", "Speech Volume").modifyControl((tb) => {
        this.styleText(tb, RetroGui.colors.foreground)
        RetroGui.Grid.moveControl(tb, row, 1, 20, 1)
      }),
      new FluentSlider(voiceSlider).retroGridMoveTo(row++, 30, 10, 1),

      new FluentRectangle("volumes").modifyControl((r) => {
        this.styleBox(r)
        RetroGui.Grid.moveControlMidCell(r, 1, 0, 0, 6)
      }),
    ]
  }
  private Toggles = () => {
    let row = 7
    const checkbox = new GUI.Checkbox()
    checkbox.width = "20px"
    checkbox.height = "20px"
    checkbox.isChecked = MusicPlayer.instance.musicEnabled
    checkbox.color = RetroGui.colors.foreground
    checkbox.background = RetroGui.colors.shadow
    this.observers.add(
      checkbox.onIsCheckedChangedObservable.add((value) => {
        MusicPlayer.instance.musicEnabled = value
      })
    )
    return [
      new FluentTextBlockExtra("Music", "Music").modifyControl((tb) => {
        this.styleText(tb, RetroGui.colors.foreground)
        RetroGui.Grid.moveControl(tb, row, 1, 20, 1)
      }),
      new FluentCheckbox(checkbox).retroGridMoveTo(row++, 31, 1, 1),
    ]
  }

  private createSlider(name: string, text: string, value: number): GUI.Slider {
    const slider = new GUI.Slider(`${name}-Slider`)
    slider.minimum = 0
    slider.maximum = 100
    slider.widthInPixels = 240
    slider.heightInPixels = 24
    slider.value = value
    slider.thumbColor = RetroGui.colors.foreground
    slider.color = RetroGui.colors.regular
    slider.background = RetroGui.colors.shadow
    slider.shadowColor = RetroGui.colors.shadow
    return slider
  }
}
