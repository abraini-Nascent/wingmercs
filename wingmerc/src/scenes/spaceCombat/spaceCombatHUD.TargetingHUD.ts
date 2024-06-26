import { Weapon } from './../../data/weapons/weapon';
import * as Weapons from './../../data/weapons';
import * as GUI from "@babylonjs/gui"
import { Color4, Frustum, Matrix, Sound, Vector2, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { Entity, world } from "../../world/world";
import * as Ships from "../../data/ships";
import { TintedImage } from '../../utils/guiHelpers';
import { SoundEffects } from "../../utils/sounds/soundEffects";

export class TargetingHUD {
  
  hud: GUI.Container
  crosshair: GUI.Image
  leadTarget: GUI.Image
  lockBox: GUI.Image
  targetBox: GUI.Image
  missileLockTarget: GUI.Image
  missileLockSound: Sound
  missileLockingSound: Sound

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
    if (this.missileLockSound) {
      SoundEffects.Silience(this.missileLockSound)
      this.missileLockSound = undefined
    }
    if (this.missileLockingSound) {
      SoundEffects.Silience(this.missileLockingSound)
      this.missileLockingSound = undefined
    }
  }

  setupMain() {
    this.hud = new GUI.Container("TargingHUD")
    this.hud.left = -24
    this.hud.top = -24

    const crosshair = new GUI.Image("but", "assets/crosshairs/crosshairs_29.png")
    crosshair.left = 24
    crosshair.top = 24
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

    const leadtarget = new TintedImage("lockTarget", "assets/crosshairs/crosshairs_02.png")
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

  update(playerEntity: Entity, dt: number) {
    
    let canLock = false
    const mount = playerEntity.weapons.mounts[playerEntity.weapons.selected]
    const weapon = Weapons[mount.type] as Weapon
    canLock = mount.count > 0 && weapon.type == "heatseeking"
    if (playerEntity.targeting?.target == undefined || playerEntity.targeting?.target == -1) {
      this.missileLockTarget.rotation = 0
      this.lockBox.isVisible = false
      this.targetBox.isVisible = false
      this.leadTarget.isVisible = false
      this.missileLockTarget.isVisible = false
      if (this.missileLockSound != undefined) {
        SoundEffects.Silience(this.missileLockSound)
        this.missileLockSound = undefined
      }
      if (this.missileLockingSound != undefined) {
        SoundEffects.Silience(this.missileLockingSound)
        this.missileLockingSound = undefined
      }
      return 
    }
    let targetEntity = world.entity(playerEntity.targeting.target)
    if (targetEntity == undefined) {
      this.lockBox.isVisible = false
      this.targetBox.isVisible = false
    }
    const enemyPosition = new Vector3(targetEntity.position.x, targetEntity.position.y, targetEntity.position.z)
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

    if (lockPosition && canLock && playerEntity.targeting?.missileLocked) {
      if (this.missileLockSound == undefined) {
        this.missileLockSound = SoundEffects.MissileTone()
        this.missileLockSound.loop = true
      }
      if (this.missileLockingSound != undefined) {
        SoundEffects.Silience(this.missileLockingSound)
        this.missileLockingSound = undefined
      }
      this.missileLockTarget.topInPixels = lockPosition.y
      this.missileLockTarget.leftInPixels = lockPosition.x
      this.missileLockTarget.widthInPixels = 52
      this.missileLockTarget.heightInPixels = 52
      this.missileLockTarget.paddingTopInPixels = -52
      this.missileLockTarget.paddingLeftInPixels = -52
      this.missileLockTarget.isVisible = true
      this.missileLockTarget.rotation += (Math.PI/2) * dt / 1000
    } else if (lockPosition && canLock && playerEntity.targeting?.targetingTime > 0) {
      if (this.missileLockingSound == undefined) {
        this.missileLockingSound = SoundEffects.MissileLock()
        this.missileLockingSound.loop = true
      }
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
      if (this.missileLockSound != undefined) {
        SoundEffects.Silience(this.missileLockSound)
        this.missileLockSound = undefined
      }
      if (this.missileLockingSound != undefined) {
        SoundEffects.Silience(this.missileLockingSound)
        this.missileLockingSound = undefined
      }
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