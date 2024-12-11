import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../app.container";
import { NerdStats, Score } from "../../world/world";
import { MainMenuScene } from "../mainMenu/mainMenuLoop";
import { FluentScrollViewer, FluentTextBlock, FluentVerticalStackPanel } from "../../utils/fluentGui";
import { Color3 } from "@babylonjs/core";


export class StatsScreen {
  gui: AdvancedDynamicTexture
  screen: GUI.Container
  title: TextBlock
  scorePanel: GUI.StackPanel
  oldHighScore: number
  useMemory: boolean = null
  onDone: () => void = null

  constructor(private score: Score, private stats: NerdStats) {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("Stats");
    this.gui = advancedTexture
    if (this.isLocalStorageAvailable()) {
      let storedScore = window.localStorage.getItem("wing_merc_highScore")
      if (storedScore != undefined) {
        try {
          this.oldHighScore = parseInt(storedScore)
        } catch(e) {
          this.oldHighScore = 0
        }
      }
      if (this.oldHighScore < Math.round(this.score.total)) {
        window.localStorage.setItem("wing_merc_highScore", `${Math.round(this.score.total)}`)
      }
    }
    this.setupMain()
  }
  dispose() {
    this.gui.removeControl(this.screen)
    this.screen.dispose()
    this.gui.dispose()
  }

  setupMain() {
    const stats = this.stats
    const score = this.score
    // const stats = AppContainer.instance.player.playerEntity.nerdStats
    // const score = AppContainer.instance.player.playerEntity.score
    
    this.screen = new GUI.Container("screen")
    this.screen.background = Color3.Gray().toHexString()
    this.screen.alpha = 0.33
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

    const highScoreText = this.oldHighScore > Math.round(score.total) ?
      `High Score: ${Math.round(this.oldHighScore)}` :
      `!! New High Score !!`
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
    
    const doneButton = GUI.Button.CreateSimpleButton("done", "[Done]");
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
      shotsAccuracy = Math.round(stats.roundsHit / (stats.roundsHit + stats.roundsMissed) * 100)
    }
    let missileAccuracy = 0
    if (stats.missilesLaunched > 0) {
      missileAccuracy = Math.round(stats.missilesHit / (stats.missilesLaunched) * 100)
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
      window.localStorage.setItem("check", "true");
      window.localStorage.removeItem("check");
      // console.log("LocalStorage Available")
      this.useMemory = false
      return true;
    } catch(error) {
      // console.log("LocalStorage NOT Available")
      this.useMemory = true
      return false;
    }
  }
}