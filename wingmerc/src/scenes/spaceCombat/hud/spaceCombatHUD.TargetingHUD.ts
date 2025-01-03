import { Weapon } from "../../../data/weapons/weapon"
import { Weapons } from "../../../data/weapons"
import * as GUI from "@babylonjs/gui"
import { Axis, Color3, Color4, Mesh, MeshBuilder, Sound, StandardMaterial, Texture, Vector3 } from "@babylonjs/core"
import { Entity, EntityForId, EntityUUID, queries } from "../../../world/world"
import { SoundEffects } from "../../../utils/sounds/soundEffects"
import { ToRadians, Vector3FromObj } from "../../../utils/math"
import { debugLog } from "../../../utils/debuglog"

const referenceDistance = 10 // e.g., 10 units
const referenceSize = 1 // e.g., 1 unit
const InRangeBlinkSpeed = 100
export class TargetingHUD {
  hud: GUI.Container
  crosshair: GUI.Image
  crosshairPlane: Mesh
  crosshairPlaneFar: Mesh
  targetId: EntityUUID = undefined
  missileLockingTexture: Texture
  missileLockedTexture: Texture
  missileLockTargetPlane: Mesh
  missileLockSound: Sound
  missileLockingSound: Sound
  missileLockedTimerCount = 0
  inRangeCount = 0

  get mainComponent(): GUI.Control {
    return this.hud
  }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.hud.dispose()
    if (this.missileLockSound) {
      SoundEffects.Silience(this.missileLockSound)
      this.missileLockSound = undefined
    }
    if (this.missileLockingSound) {
      SoundEffects.Silience(this.missileLockingSound)
      this.missileLockingSound = undefined
    }
    if (this.crosshairPlane) {
      this.crosshairPlane.dispose()
      this.crosshairPlane = undefined
    }

    if (this.crosshairPlaneFar) {
      this.crosshairPlaneFar.dispose()
      this.crosshairPlaneFar = undefined
    }
  }

  setupMain() {
    this.hud = new GUI.Container("TargingHUD")
    this.hud.left = -24
    this.hud.top = -24
  }

  update(playerEntity: Entity, dt: number) {
    if (playerEntity.node && this.crosshairPlane == undefined) {
      const crosshairTexture = new Texture(
        "assets/crosshairs/crosshairs_29.png",
        undefined,
        undefined,
        false,
        Texture.NEAREST_LINEAR
      )
      crosshairTexture.hasAlpha = true
      const crosshairMaterial = new StandardMaterial("crosshairMaterial")
      crosshairMaterial.diffuseTexture = crosshairTexture
      crosshairMaterial.emissiveColor = Color3.White()
      crosshairMaterial.specularColor = Color3.Black()
      this.crosshairPlane = MeshBuilder.CreatePlane("constantSizePlaneCrosshair", {
        size: 10,
        sideOrientation: Mesh.DOUBLESIDE,
      })
      this.crosshairPlane.material = crosshairMaterial
      this.crosshairPlane.metadata = { keepVisible: true }

      const pointInFront = Vector3.Forward().multiplyByFloats(-100, -100, -100)
      this.crosshairPlane.position.copyFrom(pointInFront)
      this.crosshairPlane.parent = playerEntity.node

      const crosshairTextureFar = new Texture(
        "assets/crosshairs/crosshairs_29.png",
        undefined,
        undefined,
        false,
        Texture.NEAREST_LINEAR
      )
      crosshairTextureFar.hasAlpha = true
      const crosshairMaterialFar = new StandardMaterial("crosshairMaterial")
      crosshairMaterialFar.diffuseTexture = crosshairTexture
      crosshairMaterialFar.emissiveColor = Color3.White()
      crosshairMaterialFar.specularColor = Color3.Black()
      this.crosshairPlaneFar = MeshBuilder.CreatePlane("constantSizePlaneCrosshair", {
        size: 10,
        sideOrientation: Mesh.DOUBLESIDE,
      })
      this.crosshairPlaneFar.material = crosshairMaterial
      this.crosshairPlaneFar.metadata = { keepVisible: true }

      const pointInFrontFar = Vector3.Forward().multiplyByFloats(-200, -200, -200)
      this.crosshairPlaneFar.position.copyFrom(pointInFrontFar)
      this.crosshairPlaneFar.parent = playerEntity.node
    }
    if (playerEntity.node && this.missileLockTargetPlane == undefined) {
      debugLog("[locking] plane created")
      const missileLockingTexture = new Texture(
        "assets/crosshairs/crosshairs_15.png",
        undefined,
        undefined,
        false,
        Texture.NEAREST_LINEAR
      )
      missileLockingTexture.hasAlpha = true
      this.missileLockingTexture = missileLockingTexture
      const missileLockedTexture = new Texture(
        "assets/crosshairs/crosshairs_14.png",
        undefined,
        undefined,
        false,
        Texture.NEAREST_LINEAR
      )
      missileLockedTexture.hasAlpha = true
      this.missileLockedTexture = missileLockedTexture
      const missileLockMaterial = new StandardMaterial("missileLockMaterial")
      missileLockMaterial.diffuseTexture = missileLockingTexture
      missileLockMaterial.diffuseColor = Color3.Red()
      missileLockMaterial.emissiveColor = Color3.Red()
      missileLockMaterial.specularColor = Color3.Black()
      this.missileLockTargetPlane = MeshBuilder.CreatePlane("constantSizePlaneCrosshair", { size: 1 })
      this.missileLockTargetPlane.ignoreCameraMaxZ = true
      this.missileLockTargetPlane.material = missileLockMaterial
      this.missileLockTargetPlane.billboardMode = Mesh.BILLBOARDMODE_ALL
      this.missileLockTargetPlane.setParent(playerEntity.node)
      this.missileLockTargetPlane.isPickable = false

      // let observer = this.missileLockTargetPlane.onBeforeRenderObservable.add(() => {
      //   if (playerEntity.targeting?.target == undefined || playerEntity.targeting?.target == "") {
      //     this.missileLockTargetPlane.isVisible = false
      //   }
      // })
      this.missileLockTargetPlane.onDisposeObservable.addOnce(() => {
        debugLog("[locking] plane disposed")
        this.missileLockTargetPlane = undefined
      })
    }
    let canLock = false
    const mount = playerEntity.weapons.mounts[playerEntity.weapons.selected]
    const weapon = Weapons[mount.type] as Weapon
    canLock = mount.count > 0 && (weapon.weaponType == "heatseeking" || weapon.weaponType == "imagerecognition")
    if (playerEntity.targeting?.target == undefined || playerEntity.targeting?.target == "") {
      this.targetId = undefined
      this.missileLockTargetPlane.isVisible = false
      this.missileLockTargetPlane.parent = undefined
      this.missileLockTargetPlane.position.setAll(0)
      this.missileLockTargetPlane.scaling.setAll(1)
      this.missileLockTargetPlane.rotation.setAll(0)
      this.inRangeCount = 0
      this.crosshairPlaneFar.isVisible = true
      if (this.missileLockSound != undefined) {
        SoundEffects.Silience(this.missileLockSound)
        this.missileLockSound = undefined
      }
      if (this.missileLockingSound != undefined) {
        SoundEffects.Silience(this.missileLockingSound)
        this.missileLockingSound = undefined
      }
      this.missileLockedTimerCount = 0
      return
    }
    if (playerEntity.targeting.target !== this.targetId) {
      // disconnect lock plane from old target so it can be connected to the new target
      this.missileLockTargetPlane.isVisible = false
      this.missileLockTargetPlane.parent = undefined
      this.inRangeCount = 0
      this.crosshairPlaneFar.isVisible = true
    }
    let targetEntity = EntityForId(playerEntity.targeting.target)
    this.targetId = playerEntity.targeting.target
    /// gun range logic
    if (playerEntity.targeting.gunInterceptPosition.active && playerEntity.targeting.gunInterceptPosition.inRange) {
      this.inRangeCount += dt
      if (this.inRangeCount > InRangeBlinkSpeed) {
        this.crosshairPlaneFar.isVisible = !this.crosshairPlaneFar.isVisible
        this.inRangeCount -= InRangeBlinkSpeed
      }
    }
    canLock = canLock && targetEntity.teamId != playerEntity.teamId
    const enemyPosition = new Vector3(targetEntity.position.x, targetEntity.position.y, targetEntity.position.z)
    const origin =
      (queries.origin.first?.position ? Vector3FromObj(queries.origin.first?.position) : undefined) ??
      Vector3.ZeroReadOnly
    const distance = Vector3.Distance(origin, enemyPosition)
    // console.log("[locking] canLock", canLock)
    if (canLock && playerEntity.targeting?.missileLocked) {
      this.missileLockedTimerCount += dt
      if (this.missileLockSound == undefined && this.missileLockedTimerCount < 3000) {
        this.missileLockSound = SoundEffects.MissileTone()
        this.missileLockSound.loop = true
      }
      if (this.missileLockingSound != undefined) {
        SoundEffects.Silience(this.missileLockingSound)
        this.missileLockingSound = undefined
      }
      if (this.missileLockSound && this.missileLockedTimerCount >= 3000) {
        SoundEffects.Silience(this.missileLockSound)
        this.missileLockSound = undefined
      }
      this.missileLockTargetPlane.isVisible = true
      ;(this.missileLockTargetPlane.material as StandardMaterial).diffuseTexture = this.missileLockedTexture
      if (this.missileLockTargetPlane.parent == undefined) {
        this.missileLockTargetPlane.position.setAll(0)
        this.missileLockTargetPlane.parent = targetEntity.node
      }
      // this.missileLockTargetPlane.position.copyFrom(enemyPosition)
      // scale
      const newSize = referenceSize * (distance / referenceDistance)
      this.missileLockTargetPlane.rotate(Axis.Z, (ToRadians(90) / 500) * dt)
      this.missileLockTargetPlane.scaling.setAll(newSize)
    } else if (canLock && playerEntity.targeting?.targetingTime > 0) {
      // console.log("[locking] ", playerEntity.targeting?.targetingTime)
      if (this.missileLockSound != undefined) {
        SoundEffects.Silience(this.missileLockSound)
        this.missileLockSound = undefined
      }
      if (this.missileLockingSound == undefined) {
        this.missileLockingSound = SoundEffects.MissileLock()
        this.missileLockingSound.loop = true
      }
      ;(this.missileLockTargetPlane.material as StandardMaterial).diffuseTexture = this.missileLockingTexture
      this.missileLockTargetPlane.isVisible = true
      if (this.missileLockTargetPlane.parent == undefined) {
        this.missileLockTargetPlane.position.setAll(0)
        this.missileLockTargetPlane.parent = targetEntity.node
      }
      // this.missileLockTargetPlane.position.copyFrom(enemyPosition)
      const alpha =
        referenceSize *
        ((playerEntity.targeting?.timeToLock - playerEntity.targeting?.targetingTime) /
          playerEntity.targeting?.timeToLock)
      const newSize = (referenceSize + alpha) * (distance / referenceDistance)
      // console.log("[locking] scale", newSize, referenceSize, alpha)
      this.missileLockTargetPlane.scaling.setAll(newSize)
      this.missileLockTargetPlane.rotate(Axis.Z, (ToRadians(90) / 1000) * dt)
    } else {
      this.missileLockTargetPlane.isVisible = false
      this.missileLockTargetPlane.parent = undefined
      this.missileLockTargetPlane.position.setAll(0)
      this.missileLockTargetPlane.rotation.setAll(0)
      if (this.missileLockSound != undefined) {
        SoundEffects.Silience(this.missileLockSound)
        this.missileLockSound = undefined
      }
      if (this.missileLockingSound != undefined) {
        SoundEffects.Silience(this.missileLockingSound)
        this.missileLockingSound = undefined
      }
    }
  }
}
