import { AdvancedDynamicTexture, Button, InputText, TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { Frustum, Matrix, Observer, Vector2, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { Entity, world } from "../../world/world";
import * as Ships from "../../data/ships";
const BlackCharacters = ["▏","▎","▍","▌","▋","▊","▉"];
export class CombatHud {
  gui: AdvancedDynamicTexture
  power: TextBlock
  setSpeed: TextBlock
  speed: TextBlock
  shieldsFore: TextBlock
  shieldsAft: TextBlock
  armorFront: TextBlock
  armorBack: TextBlock
  armorRight: TextBlock
  armorLeft: TextBlock
  enemyTarget: EnemyTarget
  lockName: TextBlock
  lockDistance: TextBlock
  lockPanel: GUI.StackPanel
  lockBox: GUI.Image
  leadTarget: GUI.Image

  constructor() {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("HUD");
    this.gui = advancedTexture
    this.setupMain()
  }
  setupMain() {
    const crosshair = new GUI.Image("but", "assets/crosshairs/crosshairs_29.png")
    crosshair.height = "64px"
    crosshair.width = "64px"
    crosshair.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    crosshair.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    this.gui.addControl(crosshair)

    const lockBox = new GUI.Image("but", "assets/crosshairs/crosshairs_24.png")
    lockBox.height = "64px"
    lockBox.width = "64px"
    lockBox.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    lockBox.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    lockBox.paddingLeft = "-64px"
    lockBox.paddingTop = "-64px"
    lockBox.isVisible = false
    lockBox.alpha = 0.85
    this.gui.addControl(lockBox)
    this.lockBox = lockBox

    const leadtarget = new GUI.Image("but", "assets/crosshairs/crosshairs_03.png")
    leadtarget.height = "64px"
    leadtarget.width = "64px"
    leadtarget.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    leadtarget.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    leadtarget.paddingLeft = "-64px"
    leadtarget.paddingTop = "-64px"
    leadtarget.isVisible = false
    leadtarget.alpha = 0.2
    this.gui.addControl(leadtarget)
    this.leadTarget = leadtarget

    const statsPanel = new GUI.StackPanel()
    statsPanel.isVertical = true
    statsPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    statsPanel.width = "240px"
    statsPanel.paddingBottomInPixels = 24
    statsPanel.paddingLeftInPixels = 24

    const speedPanel = new GUI.StackPanel()
    speedPanel.isVertical = true
    speedPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    speedPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    speedPanel.width = "240px"
    speedPanel.paddingBottomInPixels = 24

    const powerPanel = new GUI.StackPanel()
    powerPanel.isVertical = true
    powerPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    powerPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    powerPanel.width = "240px"
    powerPanel.paddingTopInPixels = 24
    powerPanel.paddingBottomInPixels = 24

    const power = new GUI.TextBlock()
    this.power = power
    power.fontFamily = "monospace"
    power.text = "⚡|▉▉▉"
    power.color = "blue"
    power.fontSize = 24
    power.height = "24px"
    power.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    power.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    powerPanel.addControl(power)
    
    const setSpeed = new GUI.TextBlock()
    this.setSpeed = setSpeed
    setSpeed.fontFamily = "monospace"
    setSpeed.text = "[000 kps]"
    setSpeed.color = "white"
    setSpeed.fontSize = 24
    setSpeed.height = "24px"
    setSpeed.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    setSpeed.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    speedPanel.addControl(setSpeed)

    const speed = new GUI.TextBlock()
    this.speed = speed
    speed.fontFamily = "monospace"
    speed.text = "000 kps"
    speed.color = "white"
    speed.fontSize = 24
    speed.height = "24px"
    speed.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    speed.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    speedPanel.addControl(speed)

    const shieldsFore = new GUI.TextBlock()
    this.shieldsFore = shieldsFore
    shieldsFore.fontFamily = "monospace"
    shieldsFore.text = "↑)▉▉▉"
    shieldsFore.color = "white"
    shieldsFore.fontSize = 24
    shieldsFore.height = "24px"
    shieldsFore.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    shieldsFore.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(shieldsFore)

    const shieldsAft = new GUI.TextBlock()
    this.shieldsAft = shieldsAft
    shieldsAft.fontFamily = "monospace"
    shieldsAft.text = "↓)▉▉▉"
    shieldsAft.color = "white"
    shieldsAft.fontSize = 24
    shieldsAft.height = "24px"
    shieldsAft.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    shieldsAft.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(shieldsAft)

    const armorFront = new GUI.TextBlock()
    this.armorFront = armorFront
    armorFront.fontFamily = "monospace"
    armorFront.text = "↓║▉▉▉"
    armorFront.color = "white"
    armorFront.fontSize = 24
    armorFront.height = "24px"
    armorFront.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorFront.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorFront)

    const armorBack = new GUI.TextBlock()
    this.armorBack = armorBack
    armorBack.fontFamily = "monospace"
    armorBack.text = "↑║▉▉▉"
    armorBack.color = "white"
    armorBack.fontSize = 24
    armorBack.height = "24px"
    armorBack.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorBack.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorBack)

    const armorLeft = new GUI.TextBlock()
    this.armorLeft = armorLeft
    armorLeft.fontFamily = "monospace"
    armorLeft.text = "←║▉▉▉"
    armorLeft.color = "white"
    armorLeft.fontSize = 24
    armorLeft.height = "24px"
    armorLeft.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorLeft.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorLeft)

    const armorRight = new GUI.TextBlock()
    this.armorRight = armorLeft
    armorRight.fontFamily = "monospace"
    armorRight.text = "→║▉▉▉"
    armorRight.color = "white"
    armorRight.fontSize = 24
    armorRight.height = "24px"
    armorRight.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    armorRight.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    statsPanel.addControl(armorRight)
    
    const lockPanel = new GUI.StackPanel()
    this.lockPanel = lockPanel
    lockPanel.isVertical = true
    lockPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    lockPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    lockPanel.width = "240px"
    lockPanel.paddingRightInPixels = 24
    lockPanel.paddingBottomInPixels = 24

    const lockName = new GUI.TextBlock()
    this.lockName = lockName
    lockName.fontFamily = "monospace"
    lockName.text = "[krant]"
    lockName.color = "red"
    lockName.fontSize = 24
    lockName.height = "24px"
    lockName.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    lockName.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    lockPanel.addControl(lockName)

    const lockDistance = new GUI.TextBlock()
    this.lockDistance = lockDistance
    lockDistance.fontFamily = "monospace"
    lockDistance.text = "----- k"
    lockDistance.color = "white"
    lockDistance.fontSize = 24
    lockDistance.height = "24px"
    lockDistance.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    lockDistance.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT
    lockPanel.addControl(lockDistance)

    this.enemyTarget = new EnemyTarget()
    lockPanel.addControl(this.enemyTarget.mainPanel)
    // this.gui.addControl(this.enemyTarget.mainPanel)

    this.gui.addControl(statsPanel)
    this.gui.addControl(speedPanel)
    this.gui.addControl(powerPanel)
    this.gui.addControl(lockPanel)
  }

  updateScreen(dt: number) {
    const playerEntity = AppContainer.instance.player.playerEntity
    this.setSpeed.text = `SET[${playerEntity.setSpeed.toString().padStart(4)} kps]`
    this.speed.text = `ACT[${Math.round(playerEntity.currentSpeed).toString().padStart(4)} kps]`
    this.shieldsFore.text = `↑)${this.foreShieldBar()}`
    this.shieldsAft.text = `↓)${this.aftShieldBar()}`
    this.armorFront.text = `↑║${this.frontArmorBar()}`
    this.armorBack.text = `↓║${this.backArmorBar()}`
    this.armorLeft.text = `←║${this.leftArmorBar()}`
    this.armorRight.text = `→║${this.rightArmorBar()}`
    this.power.text = `⚡${this.powerBar()}`
    this.updateTargeting(playerEntity)
  }

  updateTargeting(playerEntity: Entity) {
    if (playerEntity.targeting?.targetLocked == undefined || playerEntity.targeting?.targetLocked == -1) {
      this.lockBox.isVisible = false
      this.lockName.text = "[ no target ]"
      this.lockDistance.text = "----- k"
      if (this.lockPanel.containsControl(this.enemyTarget.mainPanel) == true) {
        this.lockPanel.removeControl(this.enemyTarget.mainPanel)
      }
      return 
    }
    let targetEntity = world.entity(playerEntity.targeting.targetLocked)
    if (targetEntity == undefined) {
      this.lockBox.isVisible = false
      this.lockName.text = "[ no target ]"
      this.lockDistance.text = "----- k"
      if (this.lockPanel.containsControl(this.enemyTarget.mainPanel) == true) {
        this.lockPanel.removeControl(this.enemyTarget.mainPanel)
      }
    }
    const planeClass = Ships[targetEntity.planeTemplate]
    this.lockName.text = `[ ${planeClass.name} ]`
    const enemyPosition = new Vector3(targetEntity.position.x, targetEntity.position.y, targetEntity.position.z)
    const distance = Math.round(new Vector3(playerEntity.position.x, playerEntity.position.y, playerEntity.position.z)
      .subtract(enemyPosition).length())
    this.lockDistance.text = `${distance.toString().padStart(5)} k`
    
    const lockPosition = projectToScreen(enemyPosition)
    if (lockPosition) {
      this.lockBox.topInPixels = lockPosition.y
      this.lockBox.leftInPixels = lockPosition.x
      this.lockBox.isVisible = true
    } else {
      this.lockBox.isVisible = false
    }

    if (playerEntity.targeting.gunInterceptPosition) {
      const enemyPosition = new Vector3(playerEntity.targeting.gunInterceptPosition.x, 
        playerEntity.targeting.gunInterceptPosition.y, 
        playerEntity.targeting.gunInterceptPosition.z)
        const leadPosition = projectToScreen(enemyPosition)
        if (leadPosition) {
          this.leadTarget.topInPixels = leadPosition.y
          this.leadTarget.leftInPixels = leadPosition.x
          this.leadTarget.isVisible = true
        } else {
          this.leadTarget.isVisible = false
        }
    }

    if (this.lockPanel.containsControl(this.enemyTarget.mainPanel) == false) {
      this.lockPanel.addControl(this.enemyTarget.mainPanel)
    }
    this.enemyTarget.update(targetEntity, planeClass)
  }

  foreShieldBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.shields.currentFore / playerEntity.shields.maxFore
    f = Math.round(f * 100)
    return this.barPercent(f)
  }
  aftShieldBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.shields.currentAft / playerEntity.shields.maxAft
    f = Math.round(f * 100)
    return this.barPercent(f)
  }
  frontArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.front / playerEntity.armor.front
    f = Math.round(f * 100)
    return this.barPercent(f)
  }
  backArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.back / playerEntity.armor.back
    f = Math.round(f * 100)
    return this.barPercent(f)
  }
  leftArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.left / playerEntity.armor.left
    f = Math.round(f * 100)
    return this.barPercent(f)
  }
  rightArmorBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.armor.right / playerEntity.armor.right
    f = Math.round(f * 100)
    return this.barPercent(f)
  }
  powerBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.engine.currentCapacity / playerEntity.engine.maxCapacity
    f = Math.round(f * 100)
    return this.barPercentCustom(f, 10)
  }

  barPercentCustom(percent: number, chunks: number): string {

    const chunkValue = 100 / chunks;
    const result: number[] = [];

    for (let i = 0; i < chunks; i++) {
        const chunkPercentage = Math.min(chunkValue, percent)
        result.push(Math.round((chunkPercentage/chunkValue) * 100))
        percent -= chunkPercentage
    }
    return result.map(p => this.blockPercent(p)).join("")
  }


  barPercent(f: number): string {
    let shield: string[] = []
    if (f > 66) {
      shield.push("▉")
      shield.push("▉")
      shield.push(`\u202E${this.blockPercent(Math.round((f-67)/33*100))}\u202D`)
    } else if (f > 33) {
      shield.push("▉")
      shield.push(`\u202E${this.blockPercent(Math.round((f-34)/33*100))}\u202D`)
      shield.push(" ")
    } else if (f > 0) {
      shield.push(`\u202E${this.blockPercent(Math.round(f/33*100))}\u202D`)
      shield.push(" ")
      shield.push(" ")
    } else {
      shield.push(" ")
      shield.push(" ")
      shield.push(" ")
    }
    return shield.join("")
  }

  blockPercent(percent: number): string {
    const indexes = BlackCharacters.length - 1
    const index = (percent/100) * indexes
    const char = BlackCharacters[Math.floor(index)]
    return char
  }
}

/*
┅┅┅
 ╦
╠╋╣
 ╩
┅┅┅
*/
class EnemyTarget {
  mainPanel: GUI.StackPanel
  shieldsFore: GUI.TextBlock
  armorFront: GUI.TextBlock
  bodyPanel: GUI.StackPanel
  armorLeft: GUI.TextBlock
  health: GUI.TextBlock
  armorRight: GUI.TextBlock
  armorAft: GUI.TextBlock
  shieldsAft: GUI.TextBlock

  constructor() {
    this.setupMain()
  }
  setupMain() {
    const mainPanel = new GUI.StackPanel()
    mainPanel.isVertical = true
    mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    const bodyPanel = new GUI.StackPanel()
    bodyPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    bodyPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    bodyPanel.isVertical = false
    bodyPanel.height = "24px"

    this.shieldsFore = this.createTextBlock("╍╍╍", true)
    mainPanel.addControl(this.shieldsFore)
    this.armorFront = this.createTextBlock(" ╦ ")
    mainPanel.addControl(this.armorFront)
    this.armorLeft = this.createTextBlock("╠")
    this.health = this.createTextBlock("╋")
    this.armorRight = this.createTextBlock("╣")
    bodyPanel.addControl(this.armorLeft)
    bodyPanel.addControl(this.health)
    bodyPanel.addControl(this.armorRight)
    mainPanel.addControl(bodyPanel)
    this.armorAft = this.createTextBlock(" ╩ ")
    mainPanel.addControl(this.armorAft)
    this.shieldsAft = this.createTextBlock("╍╍╍", true)
    mainPanel.addControl(this.shieldsAft)

    this.mainPanel = mainPanel
    this.bodyPanel = bodyPanel
  }

  createTextBlock(text, wide = false): GUI.TextBlock {
    const tb = new GUI.TextBlock()
    tb.fontFamily = "monospace"
    tb.text = text
    tb.color = "white"
    tb.fontSize = 24
    tb.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    tb.height = "24px"
    if (!wide) {
      tb.width = "24px"
    }
    // tb.resizeToFit = true
    return tb
  }

  update(entity: Entity, planeClass: any) {
    this.updateShield(entity.shields.currentFore/entity.shields.maxFore, this.shieldsFore)
    this.updateShield(entity.shields.currentAft/entity.shields.maxAft, this.shieldsAft)
    this.updateArmor(entity.armor.front/planeClass.armor.front, this.armorFront, " ╦ ", " ┬ ", "   ")
    this.updateArmor(entity.armor.back/planeClass.armor.back, this.armorAft, " ╩ ", " ┬ ", "   ")
    this.updateArmor(entity.armor.left/planeClass.armor.left, this.armorLeft, "╠", "├", " ")
    this.updateArmor(entity.armor.right/planeClass.armor.right, this.armorRight, "╣", "┤", " ")
    this.updateHealth(entity.health/planeClass.health, this.health, "╋", "┼", " ")
  }

  updateShield(percent: number, component: TextBlock) {
    if (percent == 0) {
      component.text = "   "
    } else if (percent < 0.35) {
      component.text = "╌╌╌"
      component.color = "red"
    } else if (percent < 0.55) {
      component.text = "╌╌╌"
      component.color = "yellow"
    } else if (percent < 0.75) {
      component.text = "╍╍╍"
      component.color = "yellow"
    } else if (percent < 0.95) {
      component.text = "╍╍╍"
      component.color = "blue"
    } else {
      component.text = "╍╍╍"
      component.color = "blue"
    }
  }
  updateArmor(percent: number, component: TextBlock, glyphHigh: string, glyphLow: string, glyphEmpty: string) {
    if (percent == 0) {
      component.text = glyphEmpty
    } else if (percent < 0.35) {
      component.text = glyphLow
      component.color = "red"
    } else if (percent < 0.55) {
      component.text = glyphLow
      component.color = "grey"
    } else if (percent < 0.75) {
      component.text = glyphHigh
      component.color = "grey"
    } else if (percent < 0.95) {
      component.text = glyphHigh
      component.color = "grey"
    } else {
      component.text = glyphHigh
      component.color = "white"
    }
  }
  updateHealth(percent: number, component: TextBlock, glyphHigh: string, glyphLow: string, glyphEmpty: string) {
    if (percent == 0) {
      component.text = glyphEmpty
    } else if (percent < 0.35) {
      component.text = glyphLow
      component.color = "red"
    } else if (percent < 0.55) {
      component.text = glyphLow
      component.color = "yellow"
    } else if (percent < 0.75) {
      component.text = glyphHigh
      component.color = "yellow"
    } else if (percent < 0.95) {
      component.text = glyphHigh
      component.color = "green"
    } else {
      component.text = glyphHigh
      component.color = "green"
    }
  }
}

function projectToScreen(point: Vector3): Vector2 | undefined {
  const scene = AppContainer.instance.scene
  // const isInFrustum = scene.activeCamera.isInFrustum(point);
  const camera = scene.activeCamera;
  const frustumPlanes = Frustum.GetPlanes(camera.getTransformationMatrix());

  const isInFrustum = Frustum.IsPointInFrustum(point, frustumPlanes)
  if (!isInFrustum) {
    return undefined
  }
  
  const result = Vector3.Project(
      point,
      Matrix.Identity(),
      scene.getTransformMatrix(),
      scene.activeCamera.viewport.toGlobal(scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight())
  );

  return new Vector2(result.x, result.y);
}