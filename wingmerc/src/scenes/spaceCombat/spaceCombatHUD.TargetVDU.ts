import { TextBlock } from "@babylonjs/gui";
import * as GUI from "@babylonjs/gui"
import { Vector3 } from "@babylonjs/core";
import { Entity, world } from "../../world/world";
import * as Ships from "../../data/ships";

export class TargetVDU {

  lockPanel: GUI.StackPanel
  enemyTarget: TargetBody
  lockType: TextBlock
  lockName: TextBlock
  lockDistance: TextBlock

  get mainComponent(): GUI.Control {
    return this.lockPanel
  }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.enemyTarget.dispose()
    this.lockType.dispose()
    this.lockName.dispose()
    this.lockDistance.dispose()
    this.lockPanel.dispose()
  }
  setupMain() {
    const lockPanel = new GUI.StackPanel("TargetVDU")
    this.lockPanel = lockPanel
    lockPanel.isVertical = true
    lockPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    lockPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    lockPanel.width = "240px"
    lockPanel.paddingRightInPixels = 24
    lockPanel.paddingBottomInPixels = 24

    const lockType = new GUI.TextBlock("LockType")
    this.lockType = lockType
    lockType.fontFamily = "monospace"
    lockType.text = "[Auto Target]"
    lockType.color = "white"
    lockType.fontSize = 24
    lockType.height = "24px"
    lockType.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    lockType.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    lockPanel.addControl(lockType)

    const lockName = new GUI.TextBlock("Name")
    this.lockName = lockName
    lockName.fontFamily = "monospace"
    lockName.text = "[krant]"
    lockName.color = "red"
    lockName.fontSize = 24
    lockName.height = "24px"
    lockName.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    lockName.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    lockPanel.addControl(lockName)

    const lockDistance = new GUI.TextBlock("Distance")
    this.lockDistance = lockDistance
    lockDistance.fontFamily = "monospace"
    lockDistance.text = "----- k"
    lockDistance.color = "white"
    lockDistance.fontSize = 24
    lockDistance.height = "24px"
    lockDistance.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    lockDistance.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT
    lockPanel.addControl(lockDistance)

    this.enemyTarget = new TargetBody()
    lockPanel.addControl(this.enemyTarget.mainPanel)
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
  update(playerEntity: Entity) {
    
    if (playerEntity.targeting?.target == undefined || playerEntity.targeting?.target == -1) {
      this.updateTargetType(playerEntity)
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

    if (this.lockPanel.containsControl(this.enemyTarget.mainPanel) == false) {
      this.lockPanel.addControl(this.enemyTarget.mainPanel)
    }
    this.enemyTarget.update(targetEntity, planeClass)
  }
}

/*
┅┅┅
 ╦
╠╋╣
 ╩
┅┅┅
*/
class TargetBody {
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
  /**
   * call to clean up
   */
  dispose() {
    this.mainPanel.dispose()
    this.shieldsFore.dispose()
    this.armorFront.dispose()
    this.bodyPanel.dispose()
    this.armorLeft.dispose()
    this.health.dispose()
    this.armorRight.dispose()
    this.armorAft.dispose()
    this.shieldsAft.dispose()
  }

  setupMain() {
    const mainPanel = new GUI.StackPanel("TargetingBodyPanel")
    mainPanel.isVertical = true
    mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    const bodyPanel = new GUI.StackPanel("TargetBody")
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
    if (entity.shields) {
      this.updateShield(entity.shields.currentFore/entity.shields.maxFore, this.shieldsFore)
      this.updateShield(entity.shields.currentAft/entity.shields.maxAft, this.shieldsAft)
    }
    if (entity.armor) {
      this.updateArmor(entity.armor.front/planeClass.armor.front, this.armorFront, " ╦ ", " ┬ ", "   ")
      this.updateArmor(entity.armor.back/planeClass.armor.back, this.armorAft, " ╩ ", " ┬ ", "   ")
      this.updateArmor(entity.armor.left/planeClass.armor.left, this.armorLeft, "╠", "├", " ")
      this.updateArmor(entity.armor.right/planeClass.armor.right, this.armorRight, "╣", "┤", " ")
    }
    if (entity.health) {
      this.updateHealth(entity.health/planeClass.health, this.health, "╋", "┼", " ")
    } else {
      this.updateHealth(1, this.health, "0", "O", " ")
    }
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