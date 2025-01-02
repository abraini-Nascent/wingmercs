import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../app.container"
import { NerdStats, Score } from "../../world/world"
import { MainMenuScene } from "../mainMenu/mainMenuLoop"
import { ArcRotateCamera, Camera, Layer, Mesh, PostProcess, RenderTargetTexture, Scene, Vector3 } from "@babylonjs/core"
import { MercScreen } from "../screen"
import {
  FluentContainer,
  FluentHorizontalStackPanel,
  FluentRectangle,
  FluentScrollViewer,
  FluentSimpleButton,
  FluentTextBlock,
  FluentVerticalStackPanel,
} from "../../utils/fluentGui"
import { FluentTextBlockExtra, TextBlockExtra } from "../../utils/TextBlockExtra"
import { RetroGui } from "../../utils/retroGui"

/**
+-----------------------------------------------+
|                   -=FINAL SCORE=-             |
|                                               |
|               Total Score: XXXXX              |
|               Time Left:   XX:XX              |
|               Total Kills: XXX                |
|                                               |
|   Total Shots:         XXXX       Shot Accuracy:  XX%   |
|   Missiles Fired:      XXXX       Missile Accuracy: XX%  |
|   Missiles Eaten:      XXXX                       |
|                                               |
|   Afterburner Time:    XX:XX       Drift Time:     XX:XX |
|                                               |
|   Shield Damage Taken: XXXX       Shield Damage Given: XXXX |
|   Armor Damage Taken:  XXXX       Armor Damage Given:  XXXX |
|                                               |
|                   [   DONE   ]                |
+-----------------------------------------------+
 */

export class CRTScreenGfx {
  uiScene: Scene
  uiLayer: Layer
  uiRenderTarget: RenderTargetTexture
  uiCamera: Camera
  crtEffect: PostProcess

  public gui: AdvancedDynamicTexture

  constructor() {
    // Create the UI scene
    const uiScene = new Scene(AppContainer.instance.engine)
    this.uiScene = uiScene

    // UI camera (orthographic camera for 2D)
    const uiCamera = new ArcRotateCamera("UICamera", Math.PI / 2, Math.PI / 4, 3, Vector3.Zero(), uiScene)
    uiCamera.mode = Camera.ORTHOGRAPHIC_CAMERA
    uiCamera.orthoLeft = -1
    uiCamera.orthoRight = 1
    uiCamera.orthoTop = 1
    uiCamera.orthoBottom = -1
    this.uiCamera = uiCamera
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI("Stats", true, uiScene)
    const uiRenderTarget = new RenderTargetTexture(
      "UIRenderTarget",
      { width: 1024, height: 1024 },
      AppContainer.instance.scene,
      false
    )
    uiRenderTarget.renderList = uiScene.meshes // Add only the UI elements to the render list
    this.uiRenderTarget = uiRenderTarget

    let time = 0.0 // For animation
    let alpha = 0 // For the v-sync line
    const scanlineDark = 0.4 // Darkness of scanlines
    const scanlineThick = 5.0 // Thickness of scanlines
    const curveAmount = 0.01 // Curve distortion amount
    const noiseIntensity = 0.125 // the amount of noise
    const jitterAmount = 0.001 // Controls the blur strength

    // Apply the CRT shader as a PostProcess
    const crtEffect = new PostProcess(
      "CRT",
      "/assets/shaders/crt-jitter",
      [
        "time",
        "jitterAmount",
        "noiseIntensity",
        "vSyncAlpha",
        "scanlineDark",
        "scanlineThick",
        "curveDistortion",
        "screenHeight",
      ], // Custom uniforms
      null, // No custom samplers
      1.0, // Full resolution
      uiCamera
    )
    this.crtEffect = crtEffect

    // Update uniforms in each frame

    crtEffect.onApply = (effect) => {
      time += AppContainer.instance.engine.getDeltaTime() * 0.001 // Increment time
      effect.setFloat("time", time)
      alpha += AppContainer.instance.engine.getDeltaTime() * 0.00025 // Increment time
      if (alpha > 1) {
        alpha = 0
      }
      console.log({ alpha })
      effect.setFloat("time", time)
      effect.setFloat("jitterAmount", jitterAmount)
      effect.setFloat("noiseIntensity", noiseIntensity)
      effect.setFloat("vSyncAlpha", alpha)
      effect.setFloat("scanlineDark", scanlineDark)
      effect.setFloat("scanlineThick", scanlineThick)
      effect.setFloat("curveDistortion", curveAmount)
      effect.setFloat("screenHeight", AppContainer.instance.engine.getRenderHeight())
    }

    // Layer for compositing UI over the main scene
    const uiLayer = new Layer("UILayer", null, AppContainer.instance.scene)
    uiLayer.texture = uiRenderTarget
    this.uiLayer = uiLayer
  }
}
export class StatsScreen {
  uiScene: Scene
  uiLayer: Layer
  uiRenderTarget: RenderTargetTexture
  uiCamera: Camera
  crtEffect: PostProcess

  gui: AdvancedDynamicTexture
  screen: GUI.Container
  title: TextBlock
  scorePanel: GUI.StackPanel
  oldHighScore: number
  useMemory: boolean = null
  onDone: () => void = null

  xrPlane: Mesh
  xrMode = false
  xrIdealWidth = 1024
  xrAspectRation = 16 / 9

  constructor(private score: Score, private stats: NerdStats) {
    // Create the UI scene
    const uiScene = new Scene(AppContainer.instance.engine)
    this.uiScene = uiScene

    // UI camera (orthographic camera for 2D)
    const uiCamera = new ArcRotateCamera("UICamera", Math.PI / 2, Math.PI / 4, 3, Vector3.Zero(), uiScene)
    uiCamera.mode = Camera.ORTHOGRAPHIC_CAMERA
    uiCamera.orthoLeft = -1
    uiCamera.orthoRight = 1
    uiCamera.orthoTop = 1
    uiCamera.orthoBottom = -1
    this.uiCamera = uiCamera

    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("Stats", true, uiScene)
    AppContainer.instance.scene.addTexture
    const uiRenderTarget = new RenderTargetTexture(
      "UIRenderTarget",
      { width: 1024, height: 1024 },
      AppContainer.instance.scene,
      false
    )
    uiRenderTarget.renderList = uiScene.meshes // Add only the UI elements to the render list
    this.uiRenderTarget = uiRenderTarget

    let time = 0.0 // For animation
    let alpha = 0 // For the v-sync line
    const scanlineDark = 0.4 // Darkness of scanlines
    const scanlineThick = 5.0 // Thickness of scanlines
    const curveAmount = 0.01 // Curve distortion amount
    const noiseIntensity = 0.125 // the amount of noise
    const jitterAmount = 0.001 // Controls the blur strength

    // Apply the CRT shader as a PostProcess
    // const crtEffect = new PostProcess(
    //   "CRT",
    //   "/assets/shaders/crt-jitter",
    //   [
    //     "time",
    //     "jitterAmount",
    //     "noiseIntensity",
    //     "vSyncAlpha",
    //     "scanlineDark",
    //     "scanlineThick",
    //     "curveDistortion",
    //     "screenHeight",
    //   ], // Custom uniforms
    //   null, // No custom samplers
    //   1.0, // Full resolution
    //   uiCamera
    // )
    // this.crtEffect = crtEffect

    // // Update uniforms in each frame

    // crtEffect.onApply = (effect) => {
    //   time += AppContainer.instance.engine.getDeltaTime() * 0.001 // Increment time
    //   effect.setFloat("time", time)
    //   alpha += AppContainer.instance.engine.getDeltaTime() * 0.00025 // Increment time
    //   if (alpha > 1) {
    //     alpha = 0
    //   }
    //   console.log({ alpha })
    //   effect.setFloat("time", time)
    //   effect.setFloat("jitterAmount", jitterAmount)
    //   effect.setFloat("noiseIntensity", noiseIntensity)
    //   effect.setFloat("vSyncAlpha", alpha)
    //   effect.setFloat("scanlineDark", scanlineDark)
    //   effect.setFloat("scanlineThick", scanlineThick)
    //   effect.setFloat("curveDistortion", curveAmount)
    //   effect.setFloat("screenHeight", AppContainer.instance.engine.getRenderHeight())
    // }

    // Layer for compositing UI over the main scene
    const uiLayer = new Layer("UILayer", null, AppContainer.instance.scene)
    uiLayer.texture = uiRenderTarget
    this.uiLayer = uiLayer

    this.gui = advancedTexture

    if (this.isLocalStorageAvailable()) {
      let storedScore = window.localStorage.getItem("wing_merc_highScore")
      if (storedScore != undefined) {
        try {
          this.oldHighScore = parseInt(storedScore)
        } catch (e) {
          this.oldHighScore = 0
        }
      }
      if (this.oldHighScore < Math.round(this.score.total)) {
        window.localStorage.setItem("wing_merc_highScore", `${Math.round(this.score.total)}`)
      }
    }
    this.setupMainGrid()
  }

  dispose() {
    this.gui.removeControl(this.screen)
    this.screen.dispose()
    this.uiRenderTarget.dispose()
    this.uiLayer.dispose()
    this.uiCamera.dispose()
    this.uiScene.dispose()
    this.crtEffect.dispose()
    this.gui.dispose()
  }

  setupMainGrid() {
    const stats = this.stats
    const score = this.score
    let shotsAccuracy = 0
    if (stats.roundsMissed > 0) {
      shotsAccuracy = Math.round((stats.roundsHit / (stats.roundsHit + stats.roundsMissed)) * 100)
    }
    let missileAccuracy = 0
    if (stats.missilesLaunched > 0) {
      missileAccuracy = Math.round((stats.missilesHit / stats.missilesLaunched) * 100)
    }
    RetroGui.Grid.reset()
    RetroGui.Grid.initialize(25, 40, 1920, 1080)
    this.gui.idealWidth = 1920
    const cellHeight = RetroGui.Grid.getGridCellHeight()
    const cellWidth = RetroGui.Grid.getGridCellWidth()
    const fontSize = Math.floor(cellHeight / 5) * 5
    const fontWidth = RetroGui.Grid.getTextWidth("A", `${fontSize}px monospace`)
    const diff = cellWidth - fontWidth
    console.log({ cellHeight, cellWidth, fontSize, fontWidth, diff: diff })
    const styleText = (tb: TextBlock, color: string) => {
      tb.fontFamily = "KongfaceRegular"
      tb.fontSize = `${fontSize}px`
      tb.color = color
      const tbe = TextBlockExtra.isExtra(tb)
      if (tbe) {
        tbe.letterWidthInPixels = cellWidth
      }
      tb.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
      tb.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
      tb.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
      tb.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    }
    const styleLabel = (tb: TextBlock) => {
      styleText(tb, RetroGui.colors.foreground)
    }
    const styleValue = (tb: TextBlock) => {
      styleText(tb, RetroGui.colors.regular)
    }
    const styleBox = (r: GUI.Rectangle) => {
      r.color = RetroGui.colors.foreground
      r.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
      r.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    }

    const rowCouple = function rowCouple(
      row: number,
      leftLabel: string,
      leftValue: string,
      rightLabel: string,
      rightValue: string
    ) {
      return [
        new FluentTextBlockExtra(`leftLabel-${leftLabel}`, leftLabel).modifyControl((tb) => {
          styleLabel(tb)
          RetroGui.Grid.moveControl(tb, row, 1, 15, 1)
        }),
        new FluentTextBlockExtra(`leftValue-${leftValue}`, leftValue)
          .modifyControl((tb) => {
            styleValue(tb)
            RetroGui.Grid.moveControl(tb, row, 15, 4, 1)
          })
          .textHorizontalAlignment("right"),
        new FluentTextBlockExtra(`rightLabel-${rightLabel}`, rightLabel).modifyControl((tb) => {
          styleLabel(tb)
          RetroGui.Grid.moveControl(tb, row, 21, 15, 1)
        }),
        new FluentTextBlockExtra(`rightValue-${rightValue}`, rightValue)
          .modifyControl((tb) => {
            styleValue(tb)
            RetroGui.Grid.moveControl(tb, row, 35, 4, 1)
          })
          .textHorizontalAlignment("right"),
      ]
    }
    this.screen = new FluentContainer(
      "screen",
      // new FluentRectangle("bg").background("pink").modifyControl((r) => {
      //   RetroGui.Grid.moveControl(r, 1, 1, 38, 1)
      // }),
      new FluentTextBlockExtra("title", "-=FINAL  SCORE=-")
        .color(RetroGui.colors.foreground)
        .modifyControl((tb) => {
          styleText(tb, RetroGui.colors.foreground)
          RetroGui.Grid.moveControl(tb, 1, 0, 40, 1)
        })
        .textHorizontalAlignment("center"),
      new FluentRectangle("top background").thickness(cellWidth / 4).modifyControl((r) => {
        styleBox(r)
      }),
      new FluentRectangle("top background").thickness(cellWidth / 4).modifyControl((r) => {
        styleBox(r)
        RetroGui.Grid.moveControl(r, 0, 0, 0, 3)
      }),
      new FluentTextBlockExtra("total score", `Total:`).modifyControl((tb) => {
        styleLabel(tb)
        RetroGui.Grid.moveControl(tb, 3, 7, 20, 1)
      }),
      new FluentTextBlockExtra("time left", `Time Left:`).modifyControl((tb) => {
        styleLabel(tb)
        RetroGui.Grid.moveControl(tb, 4, 7, 20, 1)
      }),
      new FluentTextBlockExtra("total kills", `Total Kills:`).modifyControl((tb) => {
        styleLabel(tb)
        RetroGui.Grid.moveControl(tb, 5, 7, 20, 1)
      }),
      new FluentTextBlockExtra("total score", `${Math.round(score.total)}`).modifyControl((tb) => {
        styleValue(tb)
        RetroGui.Grid.moveControl(tb, 3, 20, 20, 1)
      }),
      new FluentTextBlockExtra("time left", `${Math.round(score.timeLeft)}`).modifyControl((tb) => {
        styleValue(tb)
        RetroGui.Grid.moveControl(tb, 4, 20, 20, 1)
      }),
      new FluentTextBlockExtra("total kills", `${stats.totalKills}`).modifyControl((tb) => {
        styleValue(tb)
        RetroGui.Grid.moveControl(tb, 5, 20, 20, 1)
      }),
      rowCouple(7, "Total Shots:", `${stats.roundsHit + stats.roundsMissed}`, "Shot Accuracy:", `${shotsAccuracy}%`),
      rowCouple(8, "Missiles Fired:", `${Math.round(stats.missilesLaunched)}`, "Missile ", ``),
      new FluentTextBlockExtra("Accuracy", ` Accuracy:`).modifyControl((tb) => {
        styleLabel(tb)
        RetroGui.Grid.moveControl(tb, 9, 21, 15, 1)
        // tb.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_RIGHT
      }),
      new FluentTextBlockExtra(`accuracy value`, `${missileAccuracy}%`)
        .modifyControl((tb) => {
          styleValue(tb)
          RetroGui.Grid.moveControl(tb, 9, 35, 4, 1)
        })
        .textHorizontalAlignment("right"),
      rowCouple(9, `Missiles Eaten:`, `${stats.missilesEaten}`, "", ""),
      rowCouple(12, "Afterburner", "", "Drift", ""),
      rowCouple(13, " Time:", `${Math.round(stats.afterburnerFuelSpent)}`, " Time:", `${Math.round(stats.driftTime)}`),
      rowCouple(16, "Shield Damage", "", "Shield Damage", ""),
      rowCouple(
        17,
        " Given:",
        `${Math.round(stats.shieldDamageGiven)}`,
        " Taken:",
        `${Math.round(stats.shieldDamageTaken)}`
      ),
      rowCouple(18, "Armor Damage", "", "Armor Damage", ""),
      rowCouple(
        19,
        " Given:",
        `${Math.round(stats.armorDamageGiven)}`,
        " Taken:",
        `${Math.round(stats.armorDamageTaken)}`
      ),
      new FluentSimpleButton("done button", "DONE")
        .textBlock((tb) => {
          console.log(tb)
          tb.modifyControl(styleLabel)
        })
        .onPointerClick(() => {
          if (this.onDone) {
            this.onDone()
          } else {
            this.dispose()
            AppContainer.instance.gameScene = new MainMenuScene()
          }
        })
        .modifyControl((b: any) => {
          RetroGui.Grid.moveControl(b, 21, 1, 39, 1)
          RetroGui.Components.configureButton(b)
        })
        .horizontalAlignment("center")
    )
      .modifyControl((screen) => {
        screen.background = RetroGui.colors.background
      })
      .build()
    this.gui.addControl(this.screen)
  }

  setupMainFluent() {
    const stats = this.stats
    const score = this.score
    let shotsAccuracy = 0
    if (stats.roundsMissed > 0) {
      shotsAccuracy = Math.round((stats.roundsHit / (stats.roundsHit + stats.roundsMissed)) * 100)
    }
    let missileAccuracy = 0
    if (stats.missilesLaunched > 0) {
      missileAccuracy = Math.round((stats.missilesHit / stats.missilesLaunched) * 100)
    }
    const styleText = (tb: TextBlock) => {
      tb.fontFamily = "monospace"
      tb.color = "gold"
      tb.fontSize = "25px"
      tb.height = "25px"
      tb.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
      tb.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
      tb.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    }
    const createStatsRow = (label: string, value: string) => {
      return FluentHorizontalStackPanel(
        `${label}-${value}-row`,
        new FluentTextBlock(label, label).width(300).modifyControl(styleText).textHorizontalAlignment("left"),
        new FluentTextBlock(value, value).resizeToFit().modifyControl(styleText)
      )
        .width("80%")
        .height(25)
    }

    this.screen = new FluentContainer(
      "screen",
      new FluentScrollViewer(
        "screen scrollview",
        FluentVerticalStackPanel(
          "screen panel",
          new FluentTextBlock("title", "-=FINAL SCORE=-")
            .color("gold")
            .fontSize(65)
            .height(65)
            .horizontalAlignment("center")
            .verticalAlignment("center")
            .textHorizontalAlignment("center"),
          new FluentTextBlock("total score", `Total: ${Math.round(score.total)}`).modifyControl(styleText),
          new FluentTextBlock("time left", `Time Left: ${Math.round(score.timeLeft)}`).modifyControl(styleText),
          new FluentTextBlock("total kills", `Total Kills: ${stats.totalKills}`).modifyControl(styleText),
          new FluentRectangle("spacer").thickness(0).height(25).width("100%"),
          createStatsRow("Total Shots:", `${stats.roundsHit + stats.roundsMissed}`),
          createStatsRow("Shot Accuracy:", `${shotsAccuracy}%`),
          createStatsRow("Missiles Fired:", `${Math.round(stats.missilesLaunched)}`),
          createStatsRow("Missiles Accuracy:", `${missileAccuracy}%`),
          createStatsRow("Missiles Eaten:", `${stats.missilesEaten}`),
          createStatsRow("Afterburner time:", `${Math.round(stats.afterburnerFuelSpent)}`),
          createStatsRow("Drift time:", `${Math.round(stats.driftTime)}`),
          createStatsRow("-= Damage Taken =-", ``),
          createStatsRow("Shield Damage:", `${Math.round(stats.shieldDamageTaken)}`),
          createStatsRow("Armor Damage:", `${Math.round(stats.armorDamageTaken)}`),
          createStatsRow("-= Damage Given =-", ``),
          createStatsRow("Shield Damage:", `${Math.round(stats.shieldDamageGiven)}`),
          createStatsRow("Armor Damage:", `${Math.round(stats.armorDamageGiven)}`),
          new FluentRectangle("spacer").thickness(0).height(25).width("100%"),
          new FluentSimpleButton("done button", "[DONE]")
            .textBlock((tb) => {
              tb.modifyControl(styleText)
            })
            .onPointerClick(() => {
              if (this.onDone) {
                this.onDone()
              } else {
                this.dispose()
                AppContainer.instance.gameScene = new MainMenuScene()
              }
            })
            .adaptWidthToChildren(true)
            .height(30)
        )
          .verticalAlignment("top")
          .horizontalAlignment("center")
          .padding(24, 0, 0, 0)
      )
    ).build()
    this.gui.addControl(this.screen)
  }

  setupMainOld() {
    const stats = this.stats
    const score = this.score

    this.screen = new GUI.Container("screen")
    // this.screen.background = Color3.Gray().toHexString()
    this.gui.addControl(this.screen)

    const scorePanel = new GUI.StackPanel("score panel")
    scorePanel.isVertical = true
    scorePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    scorePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    scorePanel.width = "100%"
    scorePanel.paddingBottomInPixels = 24
    scorePanel.paddingLeftInPixels = 24
    scorePanel.paddingTopInPixels = 128
    this.screen.addControl(scorePanel)

    const title = new GUI.TextBlock()
    this.title = title
    title.name = "title"
    title.fontFamily = "monospace"
    title.text = "-=FINAL SCORE=-"
    title.color = "gold"
    title.fontSize = 64
    title.height = "64px"
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    title.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    title.paddingTopInPixels = 16
    this.screen.addControl(title)

    const highScoreText =
      this.oldHighScore > Math.round(score.total)
        ? `High Score: ${Math.round(this.oldHighScore)}`
        : `!! New High Score !!`
    const highScore = new GUI.TextBlock()
    highScore.name = "score"
    highScore.fontFamily = "monospace"
    highScore.text = highScoreText
    highScore.color = "gold"
    highScore.fontSize = 24
    highScore.height = "24px"
    highScore.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    highScore.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    highScore.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    scorePanel.addControl(highScore)

    const totalScore = new GUI.TextBlock()
    totalScore.name = "score"
    totalScore.fontFamily = "monospace"
    totalScore.text = `Total: ${Math.round(score.total)}`
    totalScore.color = "gold"
    totalScore.fontSize = 24
    totalScore.height = "24px"
    totalScore.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    totalScore.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    totalScore.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    scorePanel.addControl(totalScore)

    const time = new GUI.TextBlock()
    time.name = "time"
    time.fontFamily = "monospace"
    time.text = `Time Left: ${Math.round(score.timeLeft)}`
    time.color = "gold"
    time.fontSize = 24
    time.height = "24px"
    time.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    time.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    time.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    scorePanel.addControl(time)

    const kills = new GUI.TextBlock()
    kills.name = "kills"
    kills.fontFamily = "monospace"
    kills.text = `Total Kills: ${stats.totalKills}`
    kills.color = "gold"
    kills.fontSize = 24
    kills.height = "24px"
    kills.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    kills.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    kills.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    scorePanel.addControl(kills)

    const nerdStats = new GUI.StackPanel("nerdStats")
    nerdStats.isVertical = false
    nerdStats.heightInPixels = 500
    scorePanel.addControl(nerdStats)

    const doneButton = GUI.Button.CreateSimpleButton("done", "[Done]")
    doneButton.textBlock.fontFamily = "monospace"
    doneButton.textBlock.color = "gold"
    doneButton.textBlock.fontSize = 24
    doneButton.textBlock.height = "28px"
    doneButton.heightInPixels = 28
    doneButton.onPointerClickObservable.addOnce(() => {
      if (this.onDone) {
        this.onDone()
      } else {
        this.dispose()
        AppContainer.instance.gameScene = new MainMenuScene()
      }
    })
    scorePanel.addControl(doneButton)

    const nerdStatsLabel = new GUI.StackPanel("nerdStatsLabels")
    nerdStatsLabel.widthInPixels = 500
    nerdStats.addControl(nerdStatsLabel)
    const nerdStatsValue = new GUI.StackPanel("nerdStatsValues")
    nerdStatsValue.widthInPixels = 500
    nerdStats.addControl(nerdStatsValue)

    const createStatsRow = (label: string, value: string) => {
      nerdStatsLabel.addControl(this.createLabel(label))
      nerdStatsValue.addControl(this.createLabel(value))
    }
    let shotsAccuracy = 0
    if (stats.roundsMissed > 0) {
      shotsAccuracy = Math.round((stats.roundsHit / (stats.roundsHit + stats.roundsMissed)) * 100)
    }
    let missileAccuracy = 0
    if (stats.missilesLaunched > 0) {
      missileAccuracy = Math.round((stats.missilesHit / stats.missilesLaunched) * 100)
    }
    createStatsRow("Total Shots:", `${stats.roundsHit + stats.roundsMissed}`)
    createStatsRow("Shot Accuracy:", `${shotsAccuracy}%`)
    createStatsRow("Missiles Fired:", `${Math.round(stats.missilesLaunched)}`)
    createStatsRow("Missiles Accuracy:", `${missileAccuracy}%`)
    // createStatsRow("Missiles Dodged:", `${stats.missilesDodged}`)
    createStatsRow("Missiles Eaten:", `${stats.missilesEaten}`)
    createStatsRow("Afterburner time:", `${Math.round(stats.afterburnerFuelSpent)}`)
    createStatsRow("Drift time:", `${Math.round(stats.driftTime)}`)
    createStatsRow("-= Damage Taken =-", ``)
    createStatsRow("Shield Damage:", `${Math.round(stats.shieldDamageTaken)}`)
    createStatsRow("Armor Damage:", `${Math.round(stats.armorDamageTaken)}`)
    createStatsRow("-= Damage Given =-", ``)
    createStatsRow("Shield Damage:", `${Math.round(stats.shieldDamageGiven)}`)
    createStatsRow("Armor Damage:", `${Math.round(stats.armorDamageGiven)}`)
  }

  updateScreen(dt: number) {
    this.uiScene.render()
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
