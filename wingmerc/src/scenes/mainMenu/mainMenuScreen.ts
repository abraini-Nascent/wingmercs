import * as GUI from "@babylonjs/gui"
import { MercScreen } from "../screen"
import { AppContainer } from "../../app.container"
import { TrainSimScene } from "../spaceCombat/trainSim/trainSimLoop.singlePlayer"
import { DebugTestLoop } from "../debugTest/debugTestLoop"
import { SoundEffects } from "../../utils/sounds/soundEffects"
import { Mesh, Observer } from "@babylonjs/core"
import { ControlsMenuScene } from "../controlsMenu/controlsMenuLoop"
import { ShipSelectionScene } from "../shipCustomizer/shipSelection/shipSelectionLoop"
import { MultiplayerMenuScene } from "../multiplayerMenu/multiplayerMenuLoop"
import { ModelTestLoop } from "../modelTest/modelTestLoop"
import { InstantActionSetupScene } from "../spaceCombat/instantAction/instanceAction.setup"
import { MainMenuScene } from "./mainMenuLoop"
import { StatsScene } from "../statsScene/statsLoop"
import { FluentGrid, FluentTextBlock } from "../../utils/fluentGui"
import { RetroGui } from "../../utils/retroGui"

export class MainMenuScreen extends MercScreen {
  fullscreen: Observer<GUI.Vector2WithInfo>
  mainPanel: GUI.StackPanel
  xrPlane: Mesh
  xrMode = false
  xrIdealWidth = 1024
  xrAspectRation = 16 / 9
  constructor() {
    super("MainMenuScreen")
    this.main()
  }
  dispose() {
    super.dispose()
    if (this.fullscreen) {
      this.fullscreen.remove()
      this.fullscreen = undefined
    }
  }
  main(): void {
    // this.gui.idealWidth = 1920
    // this.gui.idealHeight = 1080
    const urlParams = new URLSearchParams(window.location.search)
    // Retrieve a specific parameter
    const debug = urlParams.get("debug")

    const mainPanel = new GUI.StackPanel("Main Menu")
    mainPanel.isVertical = true
    mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    mainPanel.widthInPixels = 300
    mainPanel.paddingBottomInPixels = 24
    mainPanel.paddingLeftInPixels = 24
    mainPanel.paddingTopInPixels = 128
    mainPanel.spacing = 24
    this.mainPanel = mainPanel
    this.gui.addControl(mainPanel)

    const title = new GUI.TextBlock()
    // title.fixedRatio = 1.6
    title.name = "title"
    title.fontFamily = "Regular5"
    title.text = "-=Squadron: Mercenaries=-"
    title.color = "gold"
    // title.fontSize = 64
    title.fontSize = 30
    // title.fontSizeInPixels = 45
    // title.width = "75%"
    title.heightInPixels = 128
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    title.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    title.paddingTopInPixels = 24
    this.gui.addControl(title)

    this.mainMenu()

    // debug auto nav
    if (debug) {
      const urlParams = new URLSearchParams(window.location.search)
      // Retrieve a specific parameter
      const parameterValue = urlParams.get("scene")
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
            break
          }
          case "models": {
            queueMicrotask(() => {
              const appContainer = AppContainer.instance
              appContainer.server = true
              appContainer.gameScene.dispose()
              appContainer.gameScene = new ModelTestLoop()
              this.dispose()
            })
            break
          }
        }
      }
    }
  }

  mainGrid(): void {
    // this.gui.idealWidth = 1920
    // this.gui.idealHeight = 1080
    // this.gui.useSmallestIdeal = true
    const renderWidth = AppContainer.instance.engine.getRenderWidth()
    const renderHeight = AppContainer.instance.engine.getRenderHeight()
    RetroGui.Grid.initialize(25, 40, renderWidth, renderHeight)
    const title = new FluentTextBlock("title")
      .setText("-=Squadron: Mercenaries=-")
      .fontFamily("KongfaceRegular")
      .fontSize("25px")
      .color("#FFC107")
      .modifyControl((tb) => {
        RetroGui.Grid.moveControl(tb, 1, 0, 40, 2)
      })
      .textHorizontalAlignment("center")

    this.gui.addControl(title.build())

    const newGameButton = this.createMainMenuButton("new game", "New Game")
    newGameButton.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      this.newGameMenu()
    })
    RetroGui.Grid.moveControl(newGameButton, 19, 1)
    this.gui.addControl(newGameButton)
  }

  clearMainPanel(): void {
    this.mainPanel.clearControls()
  }

  mainMenu(): void {
    this.clearMainPanel()

    const mainPanel = this.mainPanel

    const newGameButton = this.createMainMenuButton("new game", "New Game")
    newGameButton.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      this.newGameMenu()
    })
    mainPanel.addControl(newGameButton)

    const settingsButton = this.createMainMenuButton("settings", "Settings")
    settingsButton.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      this.settingsMenu()
    })
    mainPanel.addControl(settingsButton)

    if ((window as any).electron != undefined) {
      const exitButton = this.createMainMenuButton("exit", "Exit")
      exitButton.onPointerClickObservable.addOnce(() => {
        SoundEffects.Select()
        ;(window as any).electron.closeWindow()
      })
      mainPanel.addControl(exitButton)
    }
  }

  newGameMenu(): void {
    this.clearMainPanel()

    const mainPanel = this.mainPanel

    const startButton = this.createMainMenuButton("single player", "Single Player")
    startButton.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      this.singlePlayerMenu()
    })
    mainPanel.addControl(startButton)

    const multiplayerButton = this.createMainMenuButton("start", "Multiplayer")
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

    const backButton = this.createMainMenuButton("back", "Back")
    backButton.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      this.mainMenu()
    })
    mainPanel.addControl(backButton)
  }

  singlePlayerMenu(): void {
    this.clearMainPanel()

    const mainPanel = this.mainPanel

    const careerButton = GUI.Button.CreateSimpleButton("career", "New Career")
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

    const startButton = this.createMainMenuButton("start", "Training Sim")
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

    const instantActionButton = this.createMainMenuButton("start", "Instant Action")
    instantActionButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        SoundEffects.Select()
        const appContainer = AppContainer.instance
        const scene = appContainer.gameScene as MainMenuScene
        scene.keepSkybox = true
        this.dispose()
        scene.dispose()
        appContainer.gameScene = new InstantActionSetupScene(scene.skyboxSystems) // InstantActionScene()
      }, 333)
    })
    mainPanel.addControl(instantActionButton)

    const shipSelection = this.createMainMenuButton("model viewer", "Ship Selection")
    shipSelection.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      const appContainer = AppContainer.instance
      appContainer.server = true
      appContainer.gameScene.dispose()
      appContainer.gameScene = new ShipSelectionScene()
      this.dispose()
    })
    mainPanel.addControl(shipSelection)

    const backButton = this.createMainMenuButton("back", "Back")
    backButton.onPointerClickObservable.addOnce(() => {
      SoundEffects.Select()
      this.newGameMenu()
    })
    mainPanel.addControl(backButton)
  }

  settingsMenu(): void {
    const urlParams = new URLSearchParams(window.location.search)
    const debug = urlParams.get("debug")
    this.clearMainPanel()

    const mainPanel = this.mainPanel

    if (AppContainer.instance.env == "browser") {
      const fullscreenButton = this.createMainMenuButton("fullscreen", "Fullscreen")
      let observer = fullscreenButton.onPointerClickObservable.add(() => {
        setTimeout(() => {
          window.document.body.requestFullscreen()
        }, 333)
      })
      this.fullscreen = observer
      mainPanel.addControl(fullscreenButton)
    }

    const controlsButton = this.createMainMenuButton("controls", "Controls")
    controlsButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        AppContainer.instance.gameScene.dispose()
        AppContainer.instance.gameScene = new ControlsMenuScene()
      }, 333)
    })
    mainPanel.addControl(controlsButton)

    if (debug != undefined) {
      const debugButton = this.createMainMenuButton("model viewer", "Debug Test Sandbox")
      debugButton.onPointerClickObservable.addOnce(() => {
        SoundEffects.Select()
        const appContainer = AppContainer.instance
        appContainer.server = true
        appContainer.gameScene.dispose()
        appContainer.gameScene = new DebugTestLoop()
        this.dispose()
      })
      mainPanel.addControl(debugButton)

      const screenTestButton = this.createMainMenuButton("screen test", "Screen Test")
      screenTestButton.onPointerClickObservable.addOnce(() => {
        SoundEffects.Select()
        queueMicrotask(() => {
          const appContainer = AppContainer.instance
          appContainer.server = true
          appContainer.gameScene.dispose()
          appContainer.gameScene = new StatsScene(
            {
              livesLeft: 0,
              timeLeft: 0,
              total: 90000,
            },
            {
              afterburnerFuelSpent: 100,
              armorDamageGiven: 100,
              armorDamageTaken: 50,
              driftTime: 1000,
              missilesEaten: 1,
              missilesDodged: 1,
              missilesHit: 1,
              missilesLaunched: 1,
              roundsHit: 50,
              roundsMissed: 25,
              shieldDamageGiven: 500,
              shieldDamageTaken: 250,
              totalKills: 5,
            }
          )
          this.dispose()
        })
      })
      mainPanel.addControl(screenTestButton)

      const debugModelsButton = this.createMainMenuButton("model viewer", "Model Viewer")
      debugModelsButton.onPointerClickObservable.addOnce(() => {
        SoundEffects.Select()
        queueMicrotask(() => {
          const appContainer = AppContainer.instance
          appContainer.server = true
          appContainer.gameScene.dispose()
          appContainer.gameScene = new ModelTestLoop()
          this.dispose()
        })
      })
      mainPanel.addControl(debugModelsButton)
    }
    if ((window as any).electron != undefined) {
      const exitButton = this.createMainMenuButton("exit", "Exit")
      exitButton.onPointerClickObservable.addOnce(() => {
        SoundEffects.Select()
        ;(window as any).electron.closeWindow()
      })
      mainPanel.addControl(exitButton)
    }

    const backButton = this.createMainMenuButton("back", "Back")
    backButton.onPointerClickObservable.addOnce(() => {
      this.mainMenu()
    })
    mainPanel.addControl(backButton)
  }

  private createMainMenuButton(name: string, text: string): GUI.Button {
    let button = GUI.Button.CreateSimpleButton(name, text)
    button.textBlock.fontFamily = "Regular5"
    button.textBlock.color = "gold"
    button.textBlock.fontSizeInPixels = 15
    button.heightInPixels = 40
    button.widthInPixels = 280
    button.background = "dark blue"
    return button
  }

  update() {
    MercScreen.xrPanel(this)
  }
}
