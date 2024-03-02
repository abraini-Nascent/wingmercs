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
    this.gui.addControl(mainPanel)
    
    const title = new GUI.TextBlock()
    title.name = "title"
    title.fontFamily = "monospace"
    title.text = "-=Wing Mercs=-"
    title.color = "gold"
    // title.fontSize = 64
    title.fontSizeInPixels = 64
    title.heightInPixels = 128
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    title.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    title.paddingTopInPixels = 24
    this.gui.addControl(title)

    const startButton = GUI.Button.CreateSimpleButton("start", "[Start]");
    startButton.textBlock.fontFamily = "monospace"
    startButton.textBlock.color = "gold"
    startButton.textBlock.fontSizeInPixels = 24
    startButton.heightInPixels = 28
    startButton.widthInPixels = 280
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

    const fullscreenButton = GUI.Button.CreateSimpleButton("fullscreen", "[Fullscreen]");
    fullscreenButton.textBlock.fontFamily = "monospace"
    fullscreenButton.textBlock.color = "gold"
    fullscreenButton.textBlock.fontSizeInPixels = 24
    fullscreenButton.heightInPixels = 28
    fullscreenButton.widthInPixels = 280
    let observer = fullscreenButton.onPointerClickObservable.add(() => {
      setTimeout(() => {
        window.document.body.requestFullscreen()
      }, 333)
    })
    this.fullscreen = observer
    mainPanel.addControl(fullscreenButton)

    const debugButton = GUI.Button.CreateSimpleButton("model viewer", "[Model Viewer]");
    debugButton.textBlock.fontFamily = "monospace"
    debugButton.textBlock.color = "gold"
    debugButton.textBlock.fontSizeInPixels = 24
    debugButton.heightInPixels = 28
    debugButton.widthInPixels = 280
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
}