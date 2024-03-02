import { AdvancedDynamicTexture, Button, InputText, TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { DynamicTexture } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { Entity, NerdStats, Score, queries, world } from "../../world/world";
import * as Ships from "../../data/ships";
import { MainMenuScene } from "../mainMenu/mainMenuLoop";


export class StatsScreen {
  gui: AdvancedDynamicTexture
  screen: GUI.Container
  title: TextBlock
  scorePanel: GUI.StackPanel

  constructor(private score: Score, private stats: NerdStats) {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("Stats");
    this.gui = advancedTexture
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
      this.dispose()
      AppContainer.instance.gameScene = new MainMenuScene()
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
}