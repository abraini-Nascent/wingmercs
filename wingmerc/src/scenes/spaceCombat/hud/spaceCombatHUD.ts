import { DestinationVDU } from './spaceCombatHUD.DestinationVDU';
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../../app.container";
import { Display, EntityUUID } from "../../../world/world";
import { InterceptorSubscription, interceptEvent } from "../../../app.pipeline";
import { StatsVDU } from './spaceCombatHUD.StatsVDU';
import { TargetVDU } from './spaceCombatHUD.TargetVDU';
import { TextSizeAnimationComponent } from '../../../utils/guiHelpers';
import { barPercentCustom } from './spaceCombatHUD.helpers';
import { RadarDisplay } from './spaceCombatHUD.Radar';
import { TargetingHUD } from './spaceCombatHUD.TargetingHUD';
import { SpeedHUD } from './spaceCombatHUD.SpeedHUD';
import { DamageVDU } from './spaceCombatHUD.DamageVDU';
import { WeaponsVDU } from './spaceCombatHUD.WeaponsVDU';
import { SoundEffects } from '../../../utils/sounds/soundEffects';
import { GunsVDU } from './spaceCombatHUD.GunsVDU';

export class CombatHud {
  gui: AdvancedDynamicTexture
  hud: GUI.Container
  gameoverScreen: GUI.Container
  power: TextBlock
  
  targetingHUD: TargetingHUD
  speedHUD: SpeedHUD
  /** Left */
  vdu1Container: GUI.Container
  /** Right */
  vdu2Container: GUI.Container
  /** Screens */
  statsContainer: GUI.Container
  weapons: WeaponsVDU
  guns: GunsVDU
  damageDisplay: DamageVDU
  enemyTarget: TargetVDU
  radarDisplay: RadarDisplay
  destinationVDU: DestinationVDU

  score: TextBlock
  timeLeft: TextBlock
  gameOverText: TextSizeAnimationComponent
  getReadyText: TextSizeAnimationComponent

  leftVDU: Display = "weapons"
  rightVDU: Display = "target"
  statsVDU: StatsVDU
  registerHitInterceptor: InterceptorSubscription
  hitPlayer: Set<EntityUUID> = new Set()
  flashTimer = 0
  gameover: boolean = false
  _getReady: boolean = false
  spectator: boolean = false

  constructor() {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("HUD");
    this.gui = advancedTexture
    this.registerHitInterceptor = interceptEvent("registerHit", (input: { victim: EntityUUID, shooter: EntityUUID }) => {
      if (input.victim == AppContainer.instance.player.playerEntity.id) {
        this.hitPlayer.add(input.shooter)
      }
      return input
    })
    this.setupMain()
  }

  /**
   * call to clean up
   */
  dispose() {
    if (this.registerHitInterceptor) {
      this.registerHitInterceptor.unsubscribe()
    }
    this.statsVDU.dispose()
    this.statsContainer.dispose()
    this.targetingHUD.dispose()
    this.speedHUD.dispose()
    this.damageDisplay.dispose()
    this.destinationVDU.dispose()
    this.weapons.dispose()
    this.guns.dispose()
    this.gui.removeControl(this.hud)
    this.power.dispose()
    
    this.score.dispose()
    this.timeLeft.dispose()
    this.hud.dispose()
    if (this.gameoverScreen != undefined) {
      console.log("[spaceCombatHud] removing gameover textblock")
      this.gameoverScreen.removeControl(this.gameOverText.textblock)
      this.gui.removeControl(this.gameoverScreen)
      this.gameOverText.dispose()
      this.gameoverScreen.dispose()
    }
    if (this.getReadyText != undefined) {
      this.gui.removeControl(this.getReadyText.textblock)
      this.getReadyText.dispose()
    }
    AppContainer.instance.scene.removeTexture(this.gui)
    this.gui.dispose()
  }

  deinit() {
    console.log("[SpaceCombatHud] deinit")
  }
  setupMain() {
    
    this.hud = new GUI.Container("hud")
    this.hud.paddingBottomInPixels = 24
    this.hud.paddingTopInPixels = 24
    this.hud.paddingLeftInPixels = 24
    this.hud.paddingRightInPixels = 24
    this.gameoverScreen = new GUI.Container("gameoverScreen")
    this.gui.addControl(this.hud)

    this.targetingHUD = new TargetingHUD()
    this.hud.addControl(this.targetingHUD.mainComponent)

    this.speedHUD = new SpeedHUD()
    this.hud.addControl(this.speedHUD.mainComponent)

    this.enemyTarget = new TargetVDU()
    this.damageDisplay = new DamageVDU()
    this.destinationVDU = new DestinationVDU()
    this.weapons = new WeaponsVDU()
    this.guns = new GunsVDU()
    this.radarDisplay = new RadarDisplay()
    this.statsVDU = new StatsVDU()

    const VDU1Container = new GUI.Container("VDU1")
    VDU1Container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    VDU1Container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    VDU1Container.width = "240px"
    VDU1Container.height = "240px"
    VDU1Container.background = "rgba(150,150,150,0.2)"
    this.vdu1Container = VDU1Container
    this.vdu1Container.addControl(this.weapons.mainComponent)

    const VDU2Container = new GUI.Container("VDU2")
    VDU2Container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    VDU2Container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    VDU2Container.width = "240px"
    VDU2Container.height = "240px"
    VDU2Container.background = "rgba(150,150,150,0.2)"
    this.vdu2Container = VDU2Container
    this.vdu2Container.addControl(this.enemyTarget.mainComponent)

    const statsContainer = new GUI.Container("Stats")
    statsContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    statsContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    statsContainer.width = "240px"
    statsContainer.height = "240px"
    statsContainer.left = 264
    this.statsContainer = statsContainer
    this.statsContainer.addControl(this.statsVDU.mainComponent)

    const scorePanel = new GUI.StackPanel()
    scorePanel.isVertical = true
    scorePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    scorePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    scorePanel.width = "360px"

    const score = new GUI.TextBlock()
    this.score = score
    score.fontFamily = "monospace"
    score.text = "-=Score: 0000000=-"
    score.color = "gold"
    score.fontSize = 24
    score.height = "24px"
    score.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    score.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    scorePanel.addControl(score)

    const timeLeft = new GUI.TextBlock()
    this.timeLeft = timeLeft
    timeLeft.fontFamily = "monospace"
    timeLeft.text = "-=Time Left: 0000000=-"
    timeLeft.color = "gold"
    timeLeft.fontSize = 24
    timeLeft.height = "24px"
    timeLeft.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    timeLeft.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    scorePanel.addControl(timeLeft)

    const centerBottomPanel = new GUI.StackPanel()
    centerBottomPanel.isVertical = true
    centerBottomPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    centerBottomPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    centerBottomPanel.width = "240px"
    
    centerBottomPanel.addControl(this.radarDisplay.mainComponent)

    const power = new GUI.TextBlock()
    this.power = power
    power.name = "power"
    power.fontFamily = "monospace"
    power.text = "⚡|▉▉▉"
    power.color = "blue"
    power.fontSize = 24
    power.height = "24px"
    power.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    power.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    centerBottomPanel.addControl(power)

    this.hud.addControl(VDU1Container)
    this.hud.addControl(VDU2Container)
    this.hud.addControl(statsContainer)
    this.hud.addControl(centerBottomPanel)
    this.hud.addControl(scorePanel)
  }

  get getReady() {
    return this._getReady
  }
  set getReady(value: boolean) {
    this._getReady = value
    if (value && this.getReadyText == undefined) {
      this.getReadyText = new TextSizeAnimationComponent("GET READY!", "gold", 256, 128, 300)
      this.gui.addControl(this.getReadyText.textblock)
    }
    if (value == false && this.getReadyText != undefined) {
      this.gui.removeControl(this.getReadyText.textblock)
      this.getReadyText.textblock.dispose()
      this.getReadyText = undefined
    }
  }

  updateScreen(dt: number) {
    if (this.gameover) {
      if (this.hud.isVisible == false) {
        this.hud.isVisible = true
      }
      this.hideAll()
      if (this.gameOverText == undefined) {
        this.gameOverText = new TextSizeAnimationComponent("GAME OVER", "gold", 24, 128, 300, () => {
          // navigate to score board
        })
        this.gameoverScreen.addControl(this.gameOverText.textblock)
        this.gui.addControl(this.gameoverScreen)
        return
      }
      this.gameOverText.update(dt)
      return
    }
    if (this.getReady && this.getReadyText != undefined) {
      this.hud.isVisible = false
      this.getReadyText.update(dt)
      return
    }
    if (this.spectator) {
      // this.hideAll()
      this.hud.isVisible = false
      return
    }
    if (this.hud.isVisible == false) {
      this.hud.isVisible = true
    }
    this.flashTimer += dt
    const playerEntity = AppContainer.instance.player.playerEntity
    
    if (playerEntity.vduState.left != this.leftVDU) {
      SoundEffects.Select().play()
      this.leftVDU = this.switchDisplay(this.vdu1Container, playerEntity.vduState.left)
    }
    if (playerEntity.vduState.right != this.rightVDU) {
      SoundEffects.Select().play()
      this.rightVDU = this.switchDisplay(this.vdu2Container, playerEntity.vduState.right)
    }
    this.power.text = `⚡${this.powerBar()} `
    this.score.text = `-=Score: ${Math.round(playerEntity.score.total).toString().padStart(8, "0")}=-`
    this.timeLeft.text = `-=Time Left: ${Math.round(playerEntity.score.timeLeft).toString().padStart(8, "0")}=-`

    this.statsVDU.update(dt)
    this.speedHUD.update(dt)
    this.damageDisplay.update()
    this.destinationVDU.update(playerEntity, dt)
    this.weapons.update()
    this.guns.update()
    this.enemyTarget.update(playerEntity, dt)
    this.radarDisplay.update(playerEntity, this.hitPlayer, dt)
    this.targetingHUD.update(playerEntity, dt)
  }

  powerBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.powerPlant.currentCapacity / playerEntity.powerPlant.maxCapacity
    f = Math.round(f * 100)
    return barPercentCustom(f, 10)
  }

  hideAll() {
    if (this.gui.getControlByName(this.hud.name) != null) {
      this.gui.removeControl(this.hud)
    }
  }
  switchDisplay(vdu: GUI.Container, display: Display): Display {
    let oldVDU = vdu.children[0]
    if (oldVDU != undefined) {
      vdu.removeControl(oldVDU)
    }
    switch (display) {
      case "damage": 
        vdu.addControl(this.damageDisplay.mainComponent)
        break;
      case "target":
        vdu.addControl(this.enemyTarget.mainComponent)
        break
      case "guns":
        vdu.addControl(this.guns.mainComponent)
        break;
      case "weapons":
        vdu.addControl(this.weapons.mainComponent)
        break
      case "destination":
        vdu.addControl(this.destinationVDU.mainComponent)
        break
    }
    return display
  }
}
