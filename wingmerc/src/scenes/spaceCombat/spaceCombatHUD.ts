import { AdvancedDynamicTexture, Button, InputText, TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { DynamicTexture, Frustum, ICanvasRenderingContext, Matrix, Observer, Quaternion, Vector2, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { Entity, queries, world } from "../../world/world";
import * as Ships from "../../data/ships";
import { QuaternionFromObj, ToDegree } from "../../utils/math";
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
  missleLock: TextBlock
  lockType: TextBlock
  lockName: TextBlock
  lockDistance: TextBlock
  lockPanel: GUI.StackPanel
  lockBox: GUI.Image
  leadTarget: GUI.Image
  radarTexture: DynamicTexture
  radarImage: DynamicTextureImage
  radarImageBackground: GUI.Image

  flashTimer = 0

  constructor() {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("HUD");
    this.gui = advancedTexture
    this.setupMain()
  }
  setupMain() {
    const dynamicTexture = new DynamicTexture("radarTexture", { width: 64, height: 64 })
    this.radarTexture = dynamicTexture

    const crosshair = new GUI.Image("but", "assets/crosshairs/crosshairs_29.png")
    crosshair.height = "64px"
    crosshair.width = "64px"
    crosshair.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    crosshair.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    this.gui.addControl(crosshair)

    const lockBox = new GUI.Image("lockBox", "assets/crosshairs/crosshairs_24.png")
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

    const leadtarget = new GUI.Image("lockTarget", "assets/crosshairs/crosshairs_03.png")
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

    const radarImageBackground = new GUI.Image("radarBackground", "assets/crosshairs/crosshairs_23.png")
    this.radarImageBackground = radarImageBackground
    radarImageBackground.height = "64px"
    radarImageBackground.width = "64px"
    radarImageBackground.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    radarImageBackground.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    radarImageBackground.alpha = 0.2

    const radarImage = new DynamicTextureImage("radar", this.radarTexture)
    this.radarImage = radarImage
    radarImage.height = "64px"
    radarImage.width = "64px"
    radarImage.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    radarImage.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    // radarImage.alpha = 1

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
    radarImage.addControl(radarImageBackground)
    powerPanel.addControl(radarImage)

    const power = new GUI.TextBlock()
    this.power = power
    power.fontFamily = "monospace"
    power.text = "⚡|▉▉▉"
    power.color = "blue"
    power.fontSize = 24
    power.height = "24px"
    power.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    power.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
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

    const missileLock = new GUI.TextBlock()
    this.missleLock = missileLock
    missileLock.fontFamily = "monospace"
    missileLock.text = "[LOCK]"
    missileLock.color = "grey"
    missileLock.fontSize = 24
    missileLock.height = "24px"
    missileLock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    missileLock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    powerPanel.addControl(missileLock)

    const lockType = new GUI.TextBlock()
    this.lockType = lockType
    lockType.fontFamily = "monospace"
    lockType.text = "[Auto Target]"
    lockType.color = "white"
    lockType.fontSize = 24
    lockType.height = "24px"
    lockType.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    lockType.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    lockPanel.addControl(lockType)

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
    this.flashTimer += dt
    const playerEntity = AppContainer.instance.player.playerEntity
    this.setSpeed.text = `SET[${playerEntity.setSpeed.toString().padStart(4)} mps]`
    this.speed.text = `ACT[${Math.round(playerEntity.currentSpeed).toString().padStart(4)} mps]`
    this.shieldsFore.text = `↑)${this.foreShieldBar()}`
    this.shieldsAft.text = `↓)${this.aftShieldBar()}`
    this.armorFront.text = `↑║${this.frontArmorBar()}`
    this.armorBack.text = `↓║${this.backArmorBar()}`
    this.armorLeft.text = `←║${this.leftArmorBar()}`
    this.armorRight.text = `→║${this.rightArmorBar()}`
    this.power.text = `⚡${this.powerBar()} `
    this.updateTargeting(playerEntity)
    this.updateRadar(playerEntity)
  }

  updateTargetType(playerEntity: Entity) {
    if (playerEntity.targeting?.locked) {
      this.lockType.text = "[ Locked ]"
      this.lockType.color = "red"
    } else {
      this.lockType.text = "[ Auto Target ]"
      this.lockType.color = "white"
    }
  }
  updateTargeting(playerEntity: Entity) {
    
    if (playerEntity.targeting?.target == undefined || playerEntity.targeting?.target == -1) {
      this.updateTargetType(playerEntity)
      this.lockBox.isVisible = false
      this.lockName.text = "[ no target ]"
      this.lockDistance.text = "----- m"
      if (this.lockPanel.containsControl(this.enemyTarget.mainPanel) == true) {
        this.lockPanel.removeControl(this.enemyTarget.mainPanel)
      }
      return 
    }
    this.updateTargetType(playerEntity)
    let targetEntity = world.entity(playerEntity.targeting.target)
    if (targetEntity == undefined) {
      this.lockBox.isVisible = false
      this.lockName.text = "[ no target ]"
      this.lockDistance.text = "----- m"
      if (this.lockPanel.containsControl(this.enemyTarget.mainPanel) == true) {
        this.lockPanel.removeControl(this.enemyTarget.mainPanel)
      }
    }
    const planeClass = Ships[targetEntity.planeTemplate]
    this.lockName.text = `[ ${targetEntity.targetName} ]`
    const enemyPosition = new Vector3(targetEntity.position.x, targetEntity.position.y, targetEntity.position.z)
    const distance = Math.round(new Vector3(playerEntity.position.x, playerEntity.position.y, playerEntity.position.z)
      .subtract(enemyPosition).length())
    this.lockDistance.text = `${distance.toString().padStart(5)} m`
    
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

  updateRadar(playerEntity: Entity) {
    // we need player forward and up directions, and position
    const { direction, up, position, rotationQuaternion } = playerEntity
    
    const textureWidth = this.radarTexture.getSize().width;
    const textureHeight = this.radarTexture.getSize().height;
    const centerX = textureWidth / 2;
    const centerY = textureHeight / 2;
    const context = this.radarTexture.getContext();
    context.clearRect(0, 0, textureWidth, textureHeight)

    // Draw a circle
    // context.beginPath();
    // context.arc(centerX, centerY, textureWidth*0.49, 0, 2 * Math.PI);
    // context.strokeStyle = "red";
    // context.lineWidth = 5;
    // context.stroke();
    // context.closePath();
    const playerLock = AppContainer.instance.player.playerEntity.targeting.locked
    const lockedId = AppContainer.instance.player.playerEntity.targeting.target
    const playerId = world.id(AppContainer.instance.player.playerEntity)
    let locked = false
    let missileIncoming = false
    for (const target of queries.targets) {
      if (target.isTargetable == "player" || target.position == undefined) {
        continue
      }
      const targetPosition = new Vector3(target.position.x, target.position.y, target.position.z)

      const radarPosition = mapToRadar(targetPosition, Vector3FromObj(position), Vector3FromObj(direction), Vector3FromObj(up), QuaternionFromObj(rotationQuaternion))
      // const radarPosition = mapToFlatCircle(Vector3FromObj(position), Vector3FromObj(direction), Vector3FromObj(up), targetPosition, 512)
      this.drawPointOnDynamicTexture(target.isTargetable, radarPosition, this.radarTexture, playerLock && world.id(target) ==lockedId, false)

      // update lock warning
      if (target.targeting?.locked && target.targeting?.target == playerId && target.targeting?.missileLocked) {
        locked = true
      }
      if (target.isTargetable == "missile" && target.missileRange?.target == playerId) {
        locked = true
        missileIncoming = true
      }
    }
    if (missileIncoming) {
      if (Math.round(this.flashTimer / 250) % 2 == 0) {
        this.missleLock.color = "red"
      } else {
        this.missleLock.color = "yellow"
      }
    } else if (locked) {
      this.missleLock.color = "yellow"
    } else {
      this.missleLock.color = "grey"
    }
    this.radarTexture.update()
    this.radarImage.markAsDirty()
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
  drawPointOnDynamicTexture(targetType: string, point: {x: number, y: number}, dynamicTexture: DynamicTexture, locked: boolean, update: boolean = false): void {
    // Calculate pixel coordinates on the DynamicTexture
    const textureWidth = dynamicTexture.getSize().width;
    const textureHeight = dynamicTexture.getSize().height;
    const pixelX = (1 - (point.x + 1) * 0.5) * textureWidth;
    const pixelY = (1 - (point.y + 1) * 0.5) * textureHeight;
    // const pixelX = point.x * textureWidth;
    // const pixelY = point.y * textureHeight;

    // Draw a point on the DynamicTexture
    const context = dynamicTexture.getContext();
    // TODO: this should come from the entity which should come from the radar unit type and capabilities
    switch (targetType) {
      case "enemy":
        context.strokeStyle = "red";
        context.fillStyle = "red";
        break;
      case "missile":
        context.strokeStyle = "yellow";
        context.fillStyle = "yellow";
        break;
      default:
        context.strokeStyle = "red";
        context.fillStyle = "red";
        break;
    }
    if (locked) {
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(pixelX-2, pixelY)
      context.lineTo(pixelX+2, pixelY)
      context.stroke()
      context.beginPath()
      context.moveTo(pixelX, pixelY-2)
      context.lineTo(pixelX, pixelY+2)
      context.stroke()
    } else {
      context.fillRect(pixelX-1, pixelY-1, 3, 3); // Adjust the size as needed
    }

    if (update) {
      // Update the DynamicTexture
      dynamicTexture.update();
    }
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
    if (percent <= 0.05) {
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

function Vector3FromObj(obj: {x: number, y: number, z: number}): Vector3 {
  return new Vector3(obj.x, obj.y, obj.z)
}

// let meh = 0
function mapToRadar(point: Vector3, position: Vector3, forward: Vector3, up: Vector3, rotation: Quaternion): { x: number, y: number } {
  // meh += 1
  // Translate the world position to the local space
  const localPoint = point.subtract(position);
  
  const invertedRotation = rotation.invert()
  const flattenLocalPosition = localPoint.clone()
  flattenLocalPosition.applyRotationQuaternionInPlace(invertedRotation)
  // squash the localPosition to the vertical plane
  flattenLocalPosition.z = 0
  // flattenLocalPosition.x = -flattenLocalPosition.x
  flattenLocalPosition.normalize()

  // // find the angle between up and the flattened position
  // const right = Vector3.Cross(up, forward).normalize();
  // const angleRadiansAroundPlane = Vector3.GetAngleBetweenVectors(flattenLocalPosition, Vector3.Up(), Vector3.Forward(true))
  // const degreesAroundPlane = ToDegree(angleRadiansAroundPlane)
  // if (meh % 60 == 0) {
  //   console.log("Degrees Around Plane", degreesAroundPlane)
  // }
  // now we need to find the magnitude by finding the angle between the direction and the position
  // Calculate the dot product of the two vectors
  const dotProduct = Vector3.Dot(forward, localPoint.normalize())
  // Calculate the angle in radians
  const angleRadians = Math.acos(dotProduct)
  // Convert the angle to degrees
  const angleDegrees = ToDegree(angleRadians)
  const magnitude = (angleDegrees / 180)

  const scaledPosition = flattenLocalPosition.multiplyByFloats(magnitude, magnitude, magnitude)



  return {
      x: scaledPosition.x, // Normalize to [0, 1]
      y: scaledPosition.y  // Normalize to [0, 1]
  };
}

function mapToRadarBroken(point: Vector3, position: Vector3, forward: Vector3, up: Vector3): { x: number, y: number } {
  
  const localPoint = point.subtract(position);
  const forwardProjection = forward.normalizeToNew().scale(Vector3.Dot(localPoint, forward.normalize()));
  const right = Vector3.Cross(up, forward).normalize();
  const rightProjection = right.scale(Vector3.Dot(localPoint, right));
  const upProjection = up.scale(Vector3.Dot(localPoint, up.normalize()));

  const projectedPoint = forwardProjection.add(rightProjection).add(upProjection);

  const mappedX = Math.atan2(projectedPoint.x, projectedPoint.z) / Math.PI;
  const mappedY = Math.asin(projectedPoint.y);

  return {
      x: (mappedX + Math.PI) / (2 * Math.PI), // Normalize to [0, 1]
      y: (mappedY + Math.PI / 2) / Math.PI  // Normalize to [0, 1]
  };
}

class DynamicTextureImage extends GUI.Rectangle{
    
  private _dynamicTexture: DynamicTexture

  get dynamicTexture() {
    return this._dynamicTexture
  }

  constructor(name: string, source: DynamicTexture) {
      super(name) 
      this._dynamicTexture = source
  }

  

  protected _localDraw(context: ICanvasRenderingContext): void {
    // Copy the image from the source canvas to the target canvas
    const sourceCtx = this._dynamicTexture.getContext()
    const canvas = sourceCtx.canvas
    // const imageData = sourceCtx.getImageData(0, 0, this.dynamicTexture.getSize().width, this.dynamicTexture.getSize().height)
    context.save()
    // context.putImageData(imageData, 0, 0)
    context.drawImage(canvas, this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height)

    context.restore();
  }
}