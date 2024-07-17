import { Weapon } from './../../data/weapons/weapon';
import * as Weapons from './../../data/weapons';
import * as GUI from "@babylonjs/gui"
import { Axis, Color3, Color4, Frustum, Matrix, Mesh, MeshBuilder, Sound, StandardMaterial, Texture, TmpVectors, Vector2, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { Entity, EntityForId, world } from "../../world/world";
import { TintedImage } from '../../utils/guiHelpers';
import { SoundEffects } from "../../utils/sounds/soundEffects";
import { ToRadians, Vector3FromObj } from '../../utils/math';


const RedTint = new Color4(1, 0, 0, 1)
const referenceDistance = 10; // e.g., 10 units
const referenceSize = 1; // e.g., 1 unit

export class TargetingHUD {
  
  hud: GUI.Container
  crosshair: GUI.Image
  crosshairPlane: Mesh
  missileLockTargetPlane: Mesh
  missileLockSound: Sound
  missileLockingSound: Sound

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
  }

  setupMain() {
    this.hud = new GUI.Container("TargingHUD")
    this.hud.left = -24
    this.hud.top = -24
  }

  update(playerEntity: Entity, dt: number) {
    
    if (playerEntity.node && this.crosshairPlane == undefined) {
      const crosshairTexture = new Texture("assets/crosshairs/crosshairs_29.png", undefined, undefined, false, Texture.NEAREST_LINEAR)
      crosshairTexture.hasAlpha = true
      const crosshairMaterial = new StandardMaterial("crosshairMaterial")
      crosshairMaterial.diffuseTexture = crosshairTexture
      crosshairMaterial.emissiveColor = Color3.White()
      crosshairMaterial.specularColor = Color3.Black()
      this.crosshairPlane = MeshBuilder.CreatePlane("constantSizePlaneCrosshair", { size: 10, sideOrientation: Mesh.DOUBLESIDE });
      this.crosshairPlane.material = crosshairMaterial

      const pointInFront = TmpVectors.Vector3[2].copyFrom(playerEntity.node.position)
      pointInFront.addInPlace(Vector3FromObj(playerEntity.direction, TmpVectors.Vector3[0]).multiplyInPlace(TmpVectors.Vector3[1].setAll(100)))
      this.crosshairPlane.position.copyFrom(pointInFront)
      this.crosshairPlane.parent = playerEntity.node
    }
    if (playerEntity.node && this.missileLockTargetPlane == undefined) {
      console.log("[locking] plane created")
      const missileLockTexture = new Texture("assets/crosshairs/crosshairs_14.png", undefined, undefined, false, Texture.NEAREST_LINEAR)
      missileLockTexture.hasAlpha = true
      const missileLockMaterial = new StandardMaterial("missileLockMaterial")
      missileLockMaterial.diffuseTexture = missileLockTexture
      missileLockMaterial.diffuseColor = Color3.Red()
      missileLockMaterial.emissiveColor = Color3.Red()
      missileLockMaterial.specularColor = Color3.Black()
      this.missileLockTargetPlane = MeshBuilder.CreatePlane("constantSizePlaneCrosshair", { size: 1 });
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
        console.log("[locking] plane disposed")
        this.missileLockTargetPlane = undefined
      })
    }
    let canLock = false
    const mount = playerEntity.weapons.mounts[playerEntity.weapons.selected]
    const weapon = Weapons[mount.type] as Weapon
    canLock = mount.count > 0 && (weapon.type == "heatseeking" || weapon.type == "imagerecognition")
    if (playerEntity.targeting?.target == undefined || playerEntity.targeting?.target == "") {
      this.missileLockTargetPlane.rotation.setAll(0)
      this.missileLockTargetPlane.isVisible = false
      this.missileLockTargetPlane.parent = undefined
      this.missileLockTargetPlane.position.setAll(0)
      this.missileLockTargetPlane.scaling.setAll(1)
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
    let targetEntity = EntityForId(playerEntity.targeting.target)
    canLock = canLock && targetEntity.teamId != playerEntity.teamId
    const enemyPosition = new Vector3(targetEntity.position.x, targetEntity.position.y, targetEntity.position.z)
    const camera = AppContainer.instance.camera
    const distance = Vector3.Distance(camera.position, enemyPosition)
    // console.log("[locking] canLock", canLock)
    if (canLock && playerEntity.targeting?.missileLocked) {
      if (this.missileLockSound == undefined) {
        this.missileLockSound = SoundEffects.MissileTone()
        this.missileLockSound.loop = true
      }
      if (this.missileLockingSound != undefined) {
        SoundEffects.Silience(this.missileLockingSound)
        this.missileLockingSound = undefined
      }
      this.missileLockTargetPlane.isVisible = true
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
      this.missileLockTargetPlane.isVisible = true
      if (this.missileLockTargetPlane.parent == undefined) {
        this.missileLockTargetPlane.position.setAll(0)
        this.missileLockTargetPlane.parent = targetEntity.node
      }
      // this.missileLockTargetPlane.position.copyFrom(enemyPosition)
      const alpha = referenceSize * ((playerEntity.targeting?.timeToLock - playerEntity.targeting?.targetingTime) / playerEntity.targeting?.timeToLock)
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