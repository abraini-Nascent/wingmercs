import { MainMenuScene } from "./../mainMenu/mainMenuLoop"
import * as GUI from "@babylonjs/gui"
import { MercScreen } from "../screen"
import { AppContainer } from "../../app.container"
import { Engine, Observer } from "@babylonjs/core"
import { MusicPlayer } from "../../utils/music/musicPlayer"
import { ControlsMenuScene } from "../controlsMenu/controlsMenuLoop"
import { debugLog } from "../../utils/debuglog"

export class SettingsMenuScreen extends MercScreen {
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
  }
  setupMain(): void {
    const mainPanel = new GUI.StackPanel("Settings Menu")
    mainPanel.isVertical = true
    mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    mainPanel.width = "100%"
    mainPanel.paddingBottomInPixels = 24
    mainPanel.paddingLeftInPixels = 24
    mainPanel.paddingTopInPixels = 128
    mainPanel.spacing = 24
    mainPanel.topInPixels = 124
    this.gui.addControl(mainPanel)

    const title = new GUI.TextBlock()
    title.name = "title"
    title.fontFamily = "monospace"
    title.text = "-=Settings=-"
    title.color = "gold"
    // title.fontSize = 64
    title.fontSizeInPixels = 64
    title.heightInPixels = 128
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    title.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    title.paddingTopInPixels = 24
    this.gui.addControl(title)

    const soundLabel = this.createLabel("Sound Label", "Global Sound Volume")
    mainPanel.addControl(soundLabel)
    //
    let wholePercent = (volume) => {
      return Math.round(volume * 100)
    }
    const globalSlider = this.createSlider("Sound", "Sound", wholePercent(Engine.audioEngine.getGlobalVolume()))
    let soundSliderOnValueChangedObserver = globalSlider.onValueChangedObservable.add((value, event) => {
      const newVolume = value / 100
      debugLog("[Settings] new sound volume", newVolume)
      Engine.audioEngine.setGlobalVolume(newVolume)
    })
    this.soundSliderOnValueChangedObserver = soundSliderOnValueChangedObserver
    mainPanel.addControl(globalSlider)

    let volumes = AppContainer.instance.volumes
    const effectsLabel = this.createLabel("Effects Label", "Effects Volume")
    mainPanel.addControl(effectsLabel)
    const effectsSlider = this.createSlider("Effects", "Effects", wholePercent(volumes.sound))
    let effectsSliderOnValueChangedObserver = effectsSlider.onValueChangedObservable.add((value, event) => {
      const newVolume = value / 100
      debugLog("[Settings] new effects volume", newVolume)
      volumes.sound = newVolume
    })
    this.effectsSliderOnValueChangedObserver = effectsSliderOnValueChangedObserver
    mainPanel.addControl(effectsSlider)

    const musicLabel = this.createLabel("Music Label", "Music Volume")
    mainPanel.addControl(musicLabel)
    const musicSlider = this.createSlider("Music", "Music", wholePercent(volumes.music))
    let musicSliderOnValueChangedObserver = musicSlider.onValueChangedObservable.add((value, event) => {
      AppContainer.instance.volumes.music
      const newVolume = value / 100
      debugLog("[Settings] new music volume", newVolume)
      volumes.music = newVolume
      MusicPlayer.instance.updateVolume(newVolume)
    })
    this.musicSliderOnValueChangedObserver = musicSliderOnValueChangedObserver
    mainPanel.addControl(musicSlider)

    const voiceLabel = this.createLabel("Voice Label", "Voice Volume")
    mainPanel.addControl(voiceLabel)
    const voiceSlider = this.createSlider("Voice", "Voice", wholePercent(volumes.voice))
    let voiceSliderOnValueChangedObserver = voiceSlider.onValueChangedObservable.add((value, event) => {
      AppContainer.instance.volumes.music
      const newVolume = value / 100
      debugLog("[Settings] new volume", newVolume)
      volumes.voice = value
    })
    this.voiceSliderOnValueChangedObserver = voiceSliderOnValueChangedObserver
    mainPanel.addControl(voiceSlider)

    let musicStackPanel = this.createCheckBoxWithHeader("Music", MusicPlayer.instance.musicEnabled, (value) => {
      MusicPlayer.instance.musicEnabled = value
    })
    mainPanel.addControl(musicStackPanel)

    const fullscreenButton = this.createMainMenuButton("fullscreen", "Fullscreen")
    let observer = fullscreenButton.onPointerClickObservable.add(() => {
      setTimeout(() => {
        window.document.body.requestFullscreen()
      }, 333)
    })
    this.fullscreen = observer
    mainPanel.addControl(fullscreenButton)

    const backButton = this.createMainMenuButton("back", "Back")
    backButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        AppContainer.instance.gameScene.dispose()
        AppContainer.instance.gameScene = new MainMenuScene()
      }, 333)
    })
    this.fullscreen = observer
    mainPanel.addControl(backButton)
  }

  private createSlider(name: string, text: string, value: number): GUI.Slider {
    const slider = new GUI.Slider(`${name}-Slider`)
    slider.minimum = 0
    slider.maximum = 100
    slider.widthInPixels = 240
    slider.heightInPixels = 24
    slider.value = value
    return slider
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

  private createLabel(name: string, text: string): GUI.TextBlock {
    const textblock = new GUI.TextBlock()
    textblock.name = name
    textblock.fontFamily = "monospace"
    textblock.text = text
    textblock.color = "gold"
    // title.fontSize = 64
    textblock.fontSizeInPixels = 24
    textblock.heightInPixels = 40
    // textblock.widthInPixels = 120
    textblock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    textblock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    textblock.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    return textblock
  }

  private createCheckBoxWithHeader(title: string, checked: boolean, onValueChanged) {
    const panel = new GUI.StackPanel()
    panel.isVertical = false
    panel.height = "30px"
    const checkbox = new GUI.Checkbox()
    checkbox.width = "20px"
    checkbox.height = "20px"
    checkbox.isChecked = checked
    checkbox.color = "green"
    checkbox.onIsCheckedChangedObservable.add(onValueChanged)
    panel.addControl(checkbox)
    const header = this.createLabel(title, title)
    header.widthInPixels = 120
    panel.addControl(header)
    return panel
  }
}
