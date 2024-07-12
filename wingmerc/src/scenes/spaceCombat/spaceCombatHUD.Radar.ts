import * as GUI from "@babylonjs/gui"
import { Color3, Color4, DynamicTexture, Quaternion, Sound, TmpVectors, Vector2, Vector3 } from "@babylonjs/core";
import { AppContainer } from "../../app.container";
import { Entity, EntityUUID, queries, world } from "../../world/world";
import { QuaternionFromObj, ToDegree, ToDegree360, Vector3FromObj } from "../../utils/math";
import { DynamicTextureImage, TextSizeAnimationComponent, TintedImage } from '../../utils/guiHelpers';
import { SoundEffects } from "../../utils/sounds/soundEffects";
import { Color } from "../../utils/color";
import { rand, random } from "../../utils/random";

export class RadarDisplay {

  panel: GUI.StackPanel
  missileLock: GUI.TextBlock
  missileLockWarning: Sound
  radarTexture: DynamicTexture
  radarImage: DynamicTextureImage
  radarImageBackground: GUI.Image
  radarImageDamageFront: GUI.Image
  radarImageDamageBack: GUI.Image
  radarImageDamageLeft: GUI.Image
  radarImageDamageTop: GUI.Image
  radarImageDamageRight: GUI.Image
  radarImageDamageBottom: GUI.Image
  lockFlash: number = 0
  get mainComponent(): GUI.Control { return this.panel }
  constructor() {
    this.setupMain()
  }
  dispose() {
    this.radarTexture.dispose()
    this.radarImage.dispose()
    this.radarImageBackground.dispose()
    this.missileLock.dispose()
    if (this.missileLockWarning != undefined) {
      SoundEffects.Silience(this.missileLockWarning)
      this.missileLockWarning = undefined
    }
  }
  setupMain() {
    const radarPanel = new GUI.StackPanel("radar panel")
    radarPanel.isVertical = true
    radarPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    radarPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    radarPanel.width = "240px"
    radarPanel.paddingTopInPixels = 24
    radarPanel.paddingBottomInPixels = 24
    this.panel = radarPanel

    const missileLock = new GUI.TextBlock()
    this.missileLock = missileLock
    missileLock.fontFamily = "monospace"
    missileLock.text = "[LOCK]"
    missileLock.color = "grey"
    missileLock.fontSize = 24
    missileLock.height = "24px"
    missileLock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    missileLock.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER

    const dynamicTexture = new DynamicTexture("radarTexture", { width: 64, height: 64 })
    this.radarTexture = dynamicTexture

    const radarImage = new DynamicTextureImage("radar", this.radarTexture)
    this.radarImage = radarImage
    radarImage.height = "64px"
    radarImage.width = "64px"
    radarImage.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    radarImage.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER

    const createRadarDamage = (side: string, asset: string) => {
      const radarDamageBackground = new TintedImage("radarDamage"+side, asset)
      radarDamageBackground.height = "64px"
      radarDamageBackground.width = "64px"
      radarDamageBackground.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
      radarDamageBackground.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
      radarDamageBackground.alpha = 0.2
      radarDamageBackground.isVisible = false
      radarDamageBackground.onImageLoadedObservable.addOnce(() => {
        radarDamageBackground.tint = new Color4(1, 0, 0, 1)
      })
      this.radarImage.addControl(radarDamageBackground)
      return radarDamageBackground
    }

    const radarImageBackground = new GUI.Image("radarBackground", "assets/crosshairs/crosshairs_23.png")
    this.radarImageBackground = radarImageBackground
    radarImageBackground.height = "64px"
    radarImageBackground.width = "64px"
    radarImageBackground.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    radarImageBackground.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
    radarImageBackground.alpha = 0.2

    this.radarImageDamageFront = createRadarDamage("Front", "assets/crosshairs/radardamage_0.png")
    this.radarImageDamageBack = createRadarDamage("Back", "assets/crosshairs/radardamage_1.png")
    this.radarImageDamageLeft= createRadarDamage("Left", "assets/crosshairs/radardamage_2.png")
    this.radarImageDamageTop = createRadarDamage("Top", "assets/crosshairs/radardamage_3.png")
    this.radarImageDamageRight = createRadarDamage("Right", "assets/crosshairs/radardamage_4.png")
    this.radarImageDamageBottom = createRadarDamage("Bottom", "assets/crosshairs/radardamage_5.png")

    radarImage.addControl(radarImageBackground)
    this.panel.addControl(missileLock)
    this.panel.addControl(radarImage)
  }

  update(playerEntity: Entity, hitPlayer: Set<EntityUUID>, dt: number) {
    // we need player forward and up directions, and position
    const { direction, up, position, rotationQuaternion } = playerEntity
    
    const textureWidth = this.radarTexture.getSize().width;
    const textureHeight = this.radarTexture.getSize().height;
    const centerX = textureWidth / 2;
    const centerY = textureHeight / 2;
    const context = this.radarTexture.getContext();
    context.clearRect(0, 0, textureWidth, textureHeight)

    let frontHit = false, backHit = false, leftHit = false, topHit = false, rightHit = false, bottomHit = false
    const playerLock = AppContainer.instance.player.playerEntity.targeting.locked
    const lockedId = AppContainer.instance.player.playerEntity.targeting.target
    const playerId = AppContainer.instance.player.playerEntity.id
    let locked = false
    let missileIncoming = false
    for (const target of queries.targets) {
      if (target.position == undefined || target == AppContainer.instance.player.playerEntity) {
        continue
      }
      const targetPosition = new Vector3(target.position.x, target.position.y, target.position.z)
      const distance = Vector3FromObj(position, TmpVectors.Vector3[3]).subtractInPlace(targetPosition).length()
      let targetType: "enemy" | "missile" | "dead" | "player" = target.isTargetable
      if (target.deathRattle) {
        targetType = "dead"
      }
      const radarPosition = mapToRadar(targetPosition, Vector3FromObj(position), Vector3FromObj(direction), Vector3FromObj(up), QuaternionFromObj(rotationQuaternion))
      // const radarPosition = mapToFlatCircle(Vector3FromObj(position), Vector3FromObj(direction), Vector3FromObj(up), targetPosition, 512)
      const playerSystems = AppContainer.instance.player.playerEntity.systems
      const playerRadarQuality = playerSystems.state.radar / playerSystems.base.radar
      if (random() <= playerRadarQuality) {
        // flicker radar is radar damaged
        this.drawPointOnDynamicTexture(targetType, distance, radarPosition, this.radarTexture, playerLock && target.id == lockedId, false)
      }

      // update lock warning
      if (target.targeting?.locked && target.targeting?.target == playerId && target.targeting?.missileLocked) {
        locked = true
      }
      if (target.isTargetable == "missile" && target.missileRange?.target == playerId) {
        locked = true
        missileIncoming = true
        if (this.missileLockWarning == undefined) {
          this.missileLockWarning = SoundEffects.MissileIncoming()
          this.missileLockWarning.loop = true
        }
      } else {
        if (this.missileLockWarning != undefined) {
          this.missileLockWarning.stop()
          this.missileLockWarning.dispose()
          this.missileLockWarning = undefined
        }
      }
      if (hitPlayer.has(target.id)) {
        const positionHit = this.radarPositionToQuadrant(radarPosition)
        switch (positionHit) {
          case "front":
            frontHit = true
            break
          case "back":
            backHit = true
            break
          case "top":
            topHit = true
            break
          case "right":
            rightHit = true
            break
          case "bottom":
            bottomHit = true
            break
          case "left":
            leftHit = true
            break
        }
      }
    }
    if (frontHit) {
      this.radarImageDamageFront.isVisible = true
      this.radarImageDamageFront.alpha = Math.max(this.radarImageDamageFront.alpha + 0.2, 1)
    } else {
      this.radarImageDamageFront.alpha = Math.max(0, this.radarImageDamageFront.alpha - (1 * (dt / 1000)))
    }
    if (backHit) {
      this.radarImageDamageBack.isVisible = true
      this.radarImageDamageBack.alpha = Math.max(this.radarImageDamageBack.alpha + 0.2, 1)
    } else {
      this.radarImageDamageBack.alpha = Math.max(0, this.radarImageDamageBack.alpha - (1 * (dt / 1000)))
    }
    if (leftHit) {
      this.radarImageDamageLeft.isVisible = true
      this.radarImageDamageLeft.alpha = Math.max(this.radarImageDamageLeft.alpha + 0.2, 1)
    } else {
      this.radarImageDamageLeft.alpha = Math.max(0, this.radarImageDamageLeft.alpha - (1 * (dt / 1000)))
    }
    if (topHit) {
      this.radarImageDamageTop.isVisible = true
      this.radarImageDamageTop.alpha = Math.max(this.radarImageDamageTop.alpha + 0.2, 1)
    } else {
      this.radarImageDamageTop.alpha = Math.max(0, this.radarImageDamageTop.alpha - (1 * (dt / 1000)))
    }
    if (rightHit) {
      this.radarImageDamageRight.isVisible = true
      this.radarImageDamageRight.alpha = Math.max(this.radarImageDamageRight.alpha + 0.2, 1)
    } else {
      this.radarImageDamageRight.alpha = Math.max(0, this.radarImageDamageRight.alpha - (1 * (dt / 1000)))
    }
    if (bottomHit) {
      this.radarImageDamageBottom.isVisible = true
      this.radarImageDamageBottom.alpha = Math.max(this.radarImageDamageBottom.alpha + 0.2, 1)
    } else {
      this.radarImageDamageBottom.alpha = Math.max(0, this.radarImageDamageBottom.alpha - (1 * (dt / 1000)))
    }
    if (locked) {
      this.missileLock.color = "yellow"
    } else {
      this.missileLock.color = "grey"
    }
    if (missileIncoming) {
      this.lockFlash += dt
      if (this.lockFlash > 600) {
        this.lockFlash = 0
      }
      if (this.lockFlash > 300) {
        this.missileLock.color = "yellow"
      } else {
        this.missileLock.color = "red"
      }
    } else {
      this.missileLock.color = "grey"
    }
    hitPlayer.clear()
    this.radarTexture.update()
    this.radarImage.markAsDirty()
  }

  drawPointOnDynamicTexture(targetType: string, distance: number, point: {x: number, y: number}, dynamicTexture: DynamicTexture, locked: boolean, update: boolean = false): void {
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
    let colorClose: Vector3 = TmpVectors.Vector3[0]
    let colorFar: Vector3 = TmpVectors.Vector3[1]
    switch (targetType) {
      case "enemy":
        colorClose.set(255, 0, 0);
        colorFar.set(55, 0, 0);
        break;
      case "missile":
        colorClose.set(255, 255, 0);
        colorFar.set(55, 55, 0);
        break;
      case "dead":
        colorClose.set(200, 200, 200);
        colorFar.set(100, 100, 100);
        break;
      case "player":
        colorClose.set(0, 0, 255);
        colorFar.set(0, 0, 55);
        break;
      default:
        colorClose.set(255, 0, 0);
        colorFar.set(255, 0, 0);
        break;
    }
    const distanceAlpha = this.normalizeDistance(distance) / 100
    const color = Vector3.LerpToRef(colorFar, colorClose, distanceAlpha, TmpVectors.Vector3[2])
    const rgbaColor = Color.rgb(color.x, color.y, color.z)
    context.strokeStyle = rgbaColor
    context.fillStyle = rgbaColor
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

  normalizeDistance(distance: number): number {
    if (distance <= 1000) {
        return 100;
    } else if (distance <= 10000) {
        return 100 - ((distance - 1000) / 9000) * 90;
    } else {
        return 10;
    }
}
  radarPositionToQuadrant(point: { x: number, y:number }): "front" | "back" | "left" | "top" | "right" | "bottom" {
    const pixelX = (2 * (1 - (point.x + 1) * 0.5)) - 1 // normalize to -1 to 1
    const pixelY = ( 2 * (1 - (point.y + 1) * 0.5)) - 1 // normalize to -1 to 1
    const location = new Vector2(pixelX, pixelY)
    const distance = location.length()
    if (distance > 0.8) {
      return "back"
    } else if (distance < 0.30) {
      return "front"
    }
    // find out if which of the four sections
    const angle = ToDegree360(Vector3.GetAngleBetweenVectors(new Vector3(0, -1, 0), new Vector3(pixelX, pixelY, 0), new Vector3(0, 0, 1)))
    // console.log("----")
    // console.log(angle)
    if (angle >= 315 || angle < 45) {
      return "top"
    } else if (angle >= 45 && angle < 135) {
      return "right"
    } else if (angle >= 135 && angle < 225) {
      return "bottom"
    } else {
      return "left"
    }
  }
}

/**
 * 
 * @param point 
 * @param position 
 * @param forward 
 * @param up 
 * @param rotation 
 * @returns object {x: number, y: number} normalized to 0-1
 */
function mapToRadar(point: Vector3, position: Vector3, forward: Vector3, up: Vector3, rotation: Quaternion): { x: number, y: number } {
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
  // console.log("Degrees Around Plane", degreesAroundPlane)
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