import { MainMenuScene } from './../mainMenu/mainMenuLoop';
import * as GUI from '@babylonjs/gui';
import { MercScreen } from "../screen"
import { AppContainer } from '../../app.container';
import { Engine, Observer } from '@babylonjs/core';
import { MusicPlayer } from '../../utils/music/musicPlayer';
import { ControlsMenuScene } from '../controlsMenu/controlsMenuLoop';

export class SettingsMenuScreen extends MercScreen {
  fullscreen: Observer<GUI.Vector2WithInfo>
  soundSliderOnValueChangedObserver: Observer<number>

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
    super.setupMain()
    const mainPanel = new GUI.StackPanel("Settings Menu")
    mainPanel.isVertical = true
    mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    mainPanel.width = "100%"
    mainPanel.paddingBottomInPixels = 24
    mainPanel.paddingLeftInPixels = 24
    mainPanel.paddingTopInPixels = 128
    mainPanel.spacing = 24
    mainPanel.topInPixels = 164
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

    const soundLabel = this.createLabel("Sound Label", "Sound Volume")
    mainPanel.addControl(soundLabel)
    const soundSlider = new GUI.Slider("Sound")
    soundSlider.minimum = 0
    soundSlider.maximum = 100
    let volume = Engine.audioEngine.getGlobalVolume()
    if (volume == -1) {
      volume = 100
    } else {
      volume = Math.round(volume * 100)
    }
    soundSlider.widthInPixels = 240
    soundSlider.heightInPixels = 24
    soundSlider.value = volume
    let soundSliderOnValueChangedObserver = soundSlider.onValueChangedObservable.add((value, event) => {
      const newVolume = value / 100
      console.log("[Settings] new volume", newVolume)
      Engine.audioEngine.setGlobalVolume(newVolume);
    })
    this.soundSliderOnValueChangedObserver = soundSliderOnValueChangedObserver
    mainPanel.addControl(soundSlider)

    let musicStackPanel = this.createCheckBoxWithHeader("Music", MusicPlayer.instance.musicEnabled, (value) => {
      MusicPlayer.instance.musicEnabled = value
    })
    mainPanel.addControl(musicStackPanel)

    const fullscreenButton = this.createMainMenuButton("fullscreen", "Fullscreen");
    let observer = fullscreenButton.onPointerClickObservable.add(() => {
      setTimeout(() => {
        window.document.body.requestFullscreen()
      }, 333)
    })
    this.fullscreen = observer
    mainPanel.addControl(fullscreenButton)

    const backButton = this.createMainMenuButton("back", "Back");
    backButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        AppContainer.instance.gameScene.dispose()
        AppContainer.instance.gameScene = new MainMenuScene()
      }, 333)
    })
    this.fullscreen = observer
    mainPanel.addControl(backButton)
  }

  private createMainMenuButton(name: string, text: string): GUI.Button {
    let button = GUI.Button.CreateSimpleButton(name, text);
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