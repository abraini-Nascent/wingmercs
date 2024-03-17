import * as GUI from '@babylonjs/gui';
import { MercScreen } from "../screen"
import { AppContainer } from '../../app.container';
import { PlayerAgent } from '../../agents/playerAgent';
import { SpaceCombatScene } from '../spaceCombat/spaceCombatLoop';
import { ModelViewerScene } from '../modelViewer/modelViewerLoop';
import { SoundEffects } from '../../utils/sounds/soundEffects';
import { Observer } from '@babylonjs/core';

export class MainMenuScreen extends MercScreen {
  fullscreen: Observer<GUI.Vector2WithInfo>

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
    const mainPanel = new GUI.StackPanel("Main Menu")
    mainPanel.isVertical = true
    mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    mainPanel.width = "100%"
    mainPanel.paddingBottomInPixels = 24
    mainPanel.paddingLeftInPixels = 24
    mainPanel.paddingTopInPixels = 128
    mainPanel.spacing = 24
    this.gui.addControl(mainPanel)
    
    const title = new GUI.TextBlock()
    title.name = "title"
    title.fontFamily = "monospace"
    title.text = "-=Squadron: Mercenaries=-"
    title.color = "gold"
    // title.fontSize = 64
    title.fontSizeInPixels = 64
    title.heightInPixels = 128
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    title.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    title.paddingTopInPixels = 24
    this.gui.addControl(title)

    const careerButton = GUI.Button.CreateSimpleButton("career", "New Career");
    careerButton.textBlock.fontFamily = "monospace"
    careerButton.textBlock.color = "black"
    careerButton.textBlock.disabledColor = "grey"
    careerButton.disabledColor = "grey"
    careerButton.textBlock.fontSizeInPixels = 24
    careerButton.heightInPixels = 40
    careerButton.widthInPixels = 280
    careerButton.background = "grey"
    careerButton.isEnabled = false
    mainPanel.addControl(careerButton)

    const startButton = this.createMainMenuButton("start", "Training Sim");
    startButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        SoundEffects.Select()
        const appContainer = AppContainer.instance
        appContainer.server = true
        appContainer.gameScene.dispose()
        appContainer.gameScene = new SpaceCombatScene()
        this.dispose()
      }, 333)
    })
    mainPanel.addControl(startButton)

    const fullscreenButton = this.createMainMenuButton("fullscreen", "Fullscreen");
    let observer = fullscreenButton.onPointerClickObservable.add(() => {
      setTimeout(() => {
        window.document.body.requestFullscreen()
      }, 333)
    })
    this.fullscreen = observer
    mainPanel.addControl(fullscreenButton)

    const debugButton = this.createMainMenuButton("model viewer", "Model Viewer");
    debugButton.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      const appContainer = AppContainer.instance
      appContainer.server = true
      appContainer.gameScene.dispose()
      appContainer.gameScene = new ModelViewerScene()
      this.dispose()
    })
    mainPanel.addControl(debugButton)
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
}