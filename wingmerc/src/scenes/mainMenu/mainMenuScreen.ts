import * as GUI from '@babylonjs/gui';
import { MercScreen } from "../screen"
import { AppContainer } from '../../app.container';
import { PlayerAgent } from '../../agents/playerAgent';
import { TrainSimScene } from '../spaceCombat/trainSim/trainSimLoop.singlePlayer';
import { DebugTestLoop } from '../debugTest/debugTestLoop';
import { SoundEffects } from '../../utils/sounds/soundEffects';
import { Observer } from '@babylonjs/core';
import { SettingsMenuScene } from '../settingsMenu/settingsMenuLoop';
import { ControlsMenuScene } from '../controlsMenu/controlsMenuLoop';
import { ShipSelectionScene } from '../shipCustomizer/shipSelection/shipSelectionLoop';
import { MultiplayerMenuScene } from '../multiplayerMenu/multiplayerMenuLoop';
import { InstantActionScene } from '../spaceCombat/instantAction/instantAction.singlePlayer';
import { ModelTestLoop } from '../modelTest/modelTestLoop';

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
    const urlParams = new URLSearchParams(window.location.search);
    // Retrieve a specific parameter
    const debug = urlParams.get('debug');

    const mainPanel = new GUI.StackPanel("Main Menu")
    mainPanel.isVertical = true
    mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    mainPanel.widthInPixels = 300
    mainPanel.paddingBottomInPixels = 24
    mainPanel.paddingLeftInPixels = 24
    mainPanel.paddingTopInPixels = 128
    mainPanel.spacing = 24
    this.gui.addControl(mainPanel)
    
    const title = new GUI.TextBlock()
    title.name = "title"
    title.fontFamily = "Regular5"
    title.text = "-=Squadron: Mercenaries=-"
    title.color = "gold"
    // title.fontSize = 64
    title.fontSizeInPixels = 45
    title.heightInPixels = 128
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    title.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    title.paddingTopInPixels = 24
    this.gui.addControl(title)

    const careerButton = GUI.Button.CreateSimpleButton("career", "New Career");
    careerButton.textBlock.fontFamily = "Regular5"
    careerButton.textBlock.color = "black"
    careerButton.textBlock.disabledColor = "grey"
    careerButton.disabledColor = "grey"
    careerButton.textBlock.fontSizeInPixels = 20
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
        appContainer.gameScene = new TrainSimScene()
        this.dispose()
      }, 333)
    })
    mainPanel.addControl(startButton)

    const instantActionButton = this.createMainMenuButton("start", "Instant Action");
    instantActionButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        SoundEffects.Select()
        const appContainer = AppContainer.instance
        appContainer.gameScene.dispose()
        appContainer.gameScene = new InstantActionScene()
        this.dispose()
      }, 333)
    })
    mainPanel.addControl(instantActionButton)

    const multiplayerButton = this.createMainMenuButton("start", "Multiplayer");
    multiplayerButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        SoundEffects.Select()
        const appContainer = AppContainer.instance
        // appContainer.server = true
        appContainer.gameScene.dispose()
        appContainer.gameScene = new MultiplayerMenuScene()
        this.dispose()
      }, 333)
    })
    mainPanel.addControl(multiplayerButton)

    const shipSelection = this.createMainMenuButton("model viewer", "Ship Selection");
    shipSelection.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      const appContainer = AppContainer.instance
      appContainer.server = true
      appContainer.gameScene.dispose()
      appContainer.gameScene = new ShipSelectionScene()
      this.dispose()
    })
    mainPanel.addControl(shipSelection)

    const settingsButton = this.createMainMenuButton("settings", "Settings");
    settingsButton.onPointerClickObservable.addOnce(() => {
      const appContainer = AppContainer.instance
      appContainer.gameScene.dispose()
      appContainer.gameScene = new SettingsMenuScene()
      this.dispose()
    })
    mainPanel.addControl(settingsButton)

    if (AppContainer.instance.env == "browser") {
      const fullscreenButton = this.createMainMenuButton("fullscreen", "Fullscreen");
      let observer = fullscreenButton.onPointerClickObservable.add(() => {
        setTimeout(() => {
          window.document.body.requestFullscreen()
        }, 333)
      })
      this.fullscreen = observer
      mainPanel.addControl(fullscreenButton)
    }

    const controlsButton = this.createMainMenuButton("controls", "Controls");
    controlsButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        AppContainer.instance.gameScene.dispose()
        AppContainer.instance.gameScene = new ControlsMenuScene()
      }, 333)
    })
    mainPanel.addControl(controlsButton)

    if (debug != undefined) {
      const debugButton = this.createMainMenuButton("model viewer", "Model Viewer");
      debugButton.onPointerClickObservable.addOnce(() => {
        SoundEffects.Select()
        const appContainer = AppContainer.instance
        appContainer.server = true
        appContainer.gameScene.dispose()
        appContainer.gameScene = new DebugTestLoop()
        this.dispose()
      })
      mainPanel.addControl(debugButton)
    }
    if ((window as any).electron != undefined) {
      const exitButton = this.createMainMenuButton("exit", "Exit");
      exitButton.onPointerClickObservable.addOnce(() => {
        SoundEffects.Select();
        (window as any).electron.closeWindow()
      })
      mainPanel.addControl(exitButton)
    }

    // debug auto nav
    if (debug) {
      const urlParams = new URLSearchParams(window.location.search);
      // Retrieve a specific parameter
      const parameterValue = urlParams.get('scene');
      if (parameterValue) {
        switch (parameterValue) {
          case "test": {
            queueMicrotask(() => {
              const appContainer = AppContainer.instance
              appContainer.server = true
              appContainer.gameScene.dispose()
              appContainer.gameScene = new DebugTestLoop()
              this.dispose()
            })
            break;
          }
          case "models": {
            queueMicrotask(() => {
              const appContainer = AppContainer.instance
              appContainer.server = true
              appContainer.gameScene.dispose()
              appContainer.gameScene = new ModelTestLoop()
              this.dispose()
            })
            break;
          }
        }
      }
    }
  }

  private createMainMenuButton(name: string, text: string): GUI.Button {
    let button = GUI.Button.CreateSimpleButton(name, text);
    button.textBlock.fontFamily = "Regular5"
    button.textBlock.color = "gold"
    button.textBlock.fontSizeInPixels = 15
    button.heightInPixels = 40
    button.widthInPixels = 280
    button.background = "dark blue"
    return button
  }
}