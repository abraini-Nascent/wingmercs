import { GenericButtonNames, KeyboardKeys } from './../../world/systems/input/combatInput/combatInputConfiguration';
import { MainMenuScene } from '../mainMenu/mainMenuLoop';
import * as GUI from '@babylonjs/gui';
import { MercScreen } from "../screen"
import { AppContainer } from '../../app.container';
import { Engine, Observer } from '@babylonjs/core';
import { SettingsMenuScene } from '../settingsMenu/settingsMenuLoop';
import { InputNames, inputConfiguration } from '../../world/systems/input/combatInput/combatInputConfiguration';

export class ControlsMenuScreen extends MercScreen {
  fullscreen: Observer<GUI.Vector2WithInfo>
  soundSliderOnValueChangedObserver: Observer<number>

  constructor() {
    super("controlsMenuScreen")
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
    const headers = this.createLabel("headers",
      "ACTION",
      "GAMEPAD",
      "KEYBOARD")
      mainPanel.addControl(headers)
    for (const [key, name] of Object.entries(InputNames)) {
      const label = this.createLabel(key,
        name,
        GenericButtonNames[inputConfig[key] as string ?? ""] ?? "",
        KeyboardKeys[key] ?? "")
      mainPanel.addControl(label)
    }

    const backButton = this.createMainMenuButton("back", "Back");
    backButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        AppContainer.instance.gameScene.dispose()
        AppContainer.instance.gameScene = new MainMenuScene()
      }, 333)
    })
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