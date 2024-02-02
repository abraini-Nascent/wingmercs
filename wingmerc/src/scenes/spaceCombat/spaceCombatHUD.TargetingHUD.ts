import * as GUI from "@babylonjs/gui"
import { Color4, Frustum, Matrix, Vector2, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { Entity, world } from "../../world/world";
import * as Ships from "../../data/ships";
import { TintedImage } from '../../utils/guiHelpers';

export class TargetingHUD {
  
  hud: GUI.Container
  crosshair: GUI.Image
  lockBox: GUI.Image
  targetBox: GUI.Image
  missileLockTarget: GUI.Image
  leadTarget: GUI.Image

  get mainComponent(): GUI.Control {
    return this.hud
  }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.crosshair.dispose()
    this.targetBox.dispose()
    this.lockBox.dispose()
    this.leadTarget.dispose()
    this.hud.dispose()
  }

  setupMain() {
    this.hud = new GUI.Container("TargingHUD")

    const crosshair = new GUI.Image("but", "assets/crosshairs/crosshairs_29.png")
    crosshair.height = "64px"
    crosshair.width = "64px"
    crosshair.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    crosshair.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    this.crosshair = crosshair
    this.hud.addControl(crosshair)

    const lockBox = new TintedImage("lockBox", "assets/crosshairs/crosshairs_39.png")
    lockBox.height = "64px"
    lockBox.width = "64px"
    lockBox.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    lockBox.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    lockBox.paddingLeft = "-64px"
    lockBox.paddingTop = "-64px"
    lockBox.isVisible = false
    lockBox.color = "red"
    lockBox.alpha = 0.85
    lockBox.onImageLoadedObservable.addOnce(() => {
      lockBox.tint = new Color4(1, 0, 0, 1)
    })
    this.hud.addControl(lockBox)
    this.lockBox = lockBox

    const targetBox = new TintedImage("targetBox", "assets/crosshairs/crosshairs_63.png")
    targetBox.height = "64px"
    targetBox.width = "64px"
    targetBox.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    targetBox.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    targetBox.paddingLeft = "-64px"
    targetBox.paddingTop = "-64px"
    targetBox.isVisible = false
    targetBox.onImageLoadedObservable.addOnce(() => {
      targetBox.tint = new Color4(1, 0, 0, 1)
    })
    
    targetBox.alpha = 0.85
    this.hud.addControl(targetBox)
    this.targetBox = targetBox

    const leadtarget = new TintedImage("lockTarget", "assets/crosshairs/crosshairs_03.png")
    leadtarget.height = "64px"
    leadtarget.width = "64px"
    leadtarget.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    leadtarget.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    leadtarget.paddingLeft = "-64px"
    leadtarget.paddingTop = "-64px"
    leadtarget.isVisible = false
    leadtarget.alpha = 0.2
    leadtarget.onImageLoadedObservable.addOnce(() => {
      leadtarget.tint = new Color4(1, 0, 0, 1)
    })
    this.hud.addControl(leadtarget)
    this.leadTarget = leadtarget

    const missileLockTarget = new TintedImage("missileLockTarget", "assets/crosshairs/crosshairs_14.png")
    missileLockTarget.height = "64px"
    missileLockTarget.width = "64px"
    missileLockTarget.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    missileLockTarget.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    missileLockTarget.paddingLeft = "-64px"
    missileLockTarget.paddingTop = "-64px"
    missileLockTarget.isVisible = false
    missileLockTarget.alpha = 0.2
    missileLockTarget.onImageLoadedObservable.addOnce(() => {
      missileLockTarget.tint = new Color4(1, 0, 0, 1)
    })
    this.hud.addControl(missileLockTarget)
    this.missileLockTarget = missileLockTarget
  }

  update(playerEntity: Entity) {
    
    if (playerEntity.targeting?.target == undefined || playerEntity.targeting?.target == -1) {
      this.lockBox.isVisible = false
      this.targetBox.isVisible = false
      return 
    }
    let targetEntity = world.entity(playerEntity.targeting.target)
    if (targetEntity == undefined) {
      this.lockBox.isVisible = false
      this.targetBox.isVisible = false
    }
    const planeClass = Ships[targetEntity.planeTemplate]
    const enemyPosition = new Vector3(targetEntity.position.x, targetEntity.position.y, targetEntity.position.z)
    const distance = Math.round(new Vector3(playerEntity.position.x, playerEntity.position.y, playerEntity.position.z)
      .subtract(enemyPosition).length())
    
    if (playerEntity.targeting?.locked) {
      this.lockBox.isVisible = true
    } else {
      this.targetBox.isVisible = true
    }
    const lockPosition = projectToScreen(enemyPosition)
    if (lockPosition) {
      this.targetBox.topInPixels = lockPosition.y
      this.targetBox.leftInPixels = lockPosition.x
      this.lockBox.topInPixels = lockPosition.y
      this.lockBox.leftInPixels = lockPosition.x
    } else {
      this.lockBox.isVisible = false
      this.targetBox.isVisible = false
    }

    if (lockPosition && playerEntity.targeting?.missileLocked) {
      this.missileLockTarget.topInPixels = lockPosition.y
      this.missileLockTarget.leftInPixels = lockPosition.x
      this.missileLockTarget.widthInPixels = 52
      this.missileLockTarget.heightInPixels = 52
      this.missileLockTarget.paddingTopInPixels = -52
      this.missileLockTarget.paddingLeftInPixels = -52
      this.missileLockTarget.isVisible = true
    } else if (lockPosition && playerEntity.targeting?.targetingTime > 0) {
      let alpha = playerEntity.targeting?.targetingTime / 3000
      let currentSize = 104 - (52 * alpha)
      this.missileLockTarget.widthInPixels = currentSize
      this.missileLockTarget.heightInPixels = currentSize
      this.missileLockTarget.topInPixels = lockPosition.y + 52 - (52 * alpha)
      this.missileLockTarget.leftInPixels = lockPosition.x + 52 - (52 * alpha)
      this.missileLockTarget.paddingTopInPixels = -currentSize
      this.missileLockTarget.paddingLeftInPixels = -currentSize
      this.missileLockTarget.isVisible = true
    } else {
      this.missileLockTarget.isVisible = false
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