import { DestinationVDU } from "./spaceCombatHUD.DestinationVDU"
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../../app.container"
import { Display, EntityUUID, world } from "../../../world/world"
import { InterceptorSubscription, interceptEvent } from "../../../app.pipeline"
import { StatsHud } from "./spaceCombatHUD.StatsVDU"
import { TargetVDU } from "./spaceCombatHUD.TargetVDU"
import { barPercentCustom } from "./spaceCombatHUD.helpers"
import { RadarDisplay } from "./spaceCombatHUD.Radar"
import { SpeedHUD } from "./spaceCombatHUD.SpeedHUD"
import { DamageVDU } from "./spaceCombatHUD.DamageVDU"
import { WeaponsVDU } from "./spaceCombatHUD.WeaponsVDU"
import { SoundEffects } from "../../../utils/sounds/soundEffects"
import { GunsVDU } from "./spaceCombatHUD.GunsVDU"
import { DebugAIVDU } from "./spaceCombatHUD.DebugAIVDU"
import { ObjectivesVDU } from "./spaceCombatHUD.ObjectivesVDU"
import { CommunicationsVDU } from "./spaceCombatHUD.CommunicationsVDU"
import { Axis, Color3, Mesh, MeshBuilder, Space, StandardMaterial, Vector3 } from "@babylonjs/core"
import { FluentContainer, FluentControl } from "../../../utils/fluentGui"

export class CombatHudInWorld {
  power: TextBlock
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
  objectivesVDU: ObjectivesVDU
  commsVDU: CommunicationsVDU

  /// DEBUG SCREENS
  debugAiVdu: DebugAIVDU

  leftVDU: Display = "weapons"
  rightVDU: Display = "target"
  statsVDU: StatsHud
  registerHitInterceptor: InterceptorSubscription
  hitPlayer: Set<EntityUUID> = new Set()
  flashTimer = 0

  // in real space display
  vdu1Gui: AdvancedDynamicTexture
  vdu1Mesh: Mesh
  vdu2Gui: AdvancedDynamicTexture
  vdu2Mesh: Mesh
  radarGui: AdvancedDynamicTexture
  radarMesh: Mesh
  powerGui: AdvancedDynamicTexture
  powerMesh: Mesh

  constructor() {
    this.registerHitInterceptor = interceptEvent(
      "registerHit",
      (input: { victim: EntityUUID; shooter: EntityUUID }) => {
        if (input.victim == AppContainer.instance.player.playerEntity.id) {
          this.hitPlayer.add(input.shooter)
        }
        return input
      }
    )
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
    this.speedHUD.dispose()
    this.damageDisplay.dispose()
    this.destinationVDU.dispose()
    this.objectivesVDU.dispose()
    this.commsVDU.dispose()
    this.debugAiVdu.dispose()
    this.weapons.dispose()
    this.guns.dispose()
    this.power.dispose()

    this.vdu1Gui.dispose()
    this.vdu1Mesh.dispose()
    this.vdu2Gui.dispose()
    this.vdu2Mesh.dispose()
    this.radarGui.dispose()
    this.radarMesh.dispose()
  }

  deinit() {
    console.log("[SpaceCombatHud] deinit")
  }
  setupMain() {
    this.speedHUD = new SpeedHUD()

    this.enemyTarget = new TargetVDU()
    this.damageDisplay = new DamageVDU()
    this.destinationVDU = new DestinationVDU()
    this.objectivesVDU = new ObjectivesVDU()
    this.weapons = new WeaponsVDU()
    this.guns = new GunsVDU()
    this.radarDisplay = new RadarDisplay()
    this.statsVDU = new StatsHud()
    this.commsVDU = new CommunicationsVDU()
    this.debugAiVdu = new DebugAIVDU()

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
  }

  updateScreen(dt: number) {
    this.flashTimer += dt
    const playerEntity = AppContainer.instance.player.playerEntity

    if (playerEntity.node != undefined && this.vdu1Mesh == undefined) {
      // create the screen mesh
      this.vdu1Mesh = MeshBuilder.CreatePlane("vdu-plane", { size: 0.25, sideOrientation: Mesh.DOUBLESIDE })
      this.vdu1Gui = AdvancedDynamicTexture.CreateForMeshTexture(this.vdu1Mesh, 240, 240)
      this.vdu1Gui.idealWidth = 240

      let mat = new StandardMaterial("vdu1-plane-mat")
      mat.diffuseTexture = this.vdu1Gui
      mat.emissiveTexture = this.vdu1Gui
      mat.specularColor = Color3.Black()
      this.vdu1Mesh.material = mat
      this.vdu1Mesh.position.set(0.2, -0.55, -1)
      this.vdu1Gui.addControl(this.vdu1Container)
      // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
      // this.vduMesh.lookAt(VRSystem.xr.baseExperience.camera.position)
      // Rotate the plane 180 degrees around the Y-axis to flip it
      this.vdu1Mesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
      this.vdu1Mesh.parent = AppContainer.instance.player.playerEntity.node
    }
    if (playerEntity.node != undefined && this.vdu2Mesh == undefined) {
      // create the screen mesh
      this.vdu2Mesh = MeshBuilder.CreatePlane("vdu2-plane", { size: 0.25, sideOrientation: Mesh.DOUBLESIDE })
      this.vdu2Gui = AdvancedDynamicTexture.CreateForMeshTexture(this.vdu2Mesh, 240, 240)
      this.vdu2Gui.idealWidth = 240

      let mat = new StandardMaterial("vdu1-plane-mat")
      mat.diffuseTexture = this.vdu2Gui
      mat.emissiveTexture = this.vdu2Gui
      mat.specularColor = Color3.Black()
      this.vdu2Mesh.material = mat
      this.vdu2Mesh.position.set(-0.2, -0.55, -1)
      this.vdu2Gui.addControl(this.vdu2Container)
      // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
      // this.vduMesh.lookAt(VRSystem.xr.baseExperience.camera.position)
      // Rotate the plane 180 degrees around the Y-axis to flip it
      this.vdu2Mesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
      this.vdu2Mesh.parent = AppContainer.instance.player.playerEntity.node
    }
    if (playerEntity.node != undefined && this.radarMesh == undefined) {
      // create the screen mesh
      this.radarMesh = MeshBuilder.CreatePlane("vdu2-plane", { size: 0.1, sideOrientation: Mesh.DOUBLESIDE })
      this.radarGui = AdvancedDynamicTexture.CreateForMeshTexture(this.radarMesh, 150, 150)
      this.radarGui.idealWidth = 150

      let mat = new StandardMaterial("vdu1-plane-mat")
      mat.diffuseTexture = this.radarGui
      mat.emissiveTexture = this.radarGui
      mat.specularColor = Color3.Black()
      this.radarMesh.material = mat
      this.radarMesh.position.set(0, -0.55, -0.55)
      this.radarMesh.lookAt(Vector3.Zero())
      const background = new FluentContainer("background").background("black")
      this.radarGui.addControl(background.build())
      this.radarGui.addControl(this.radarDisplay.mainComponent)
      // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
      // this.vduMesh.lookAt(VRSystem.xr.baseExperience.camera.position)
      // Rotate the plane 180 degrees around the Y-axis to flip it
      this.radarMesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
      this.radarMesh.parent = AppContainer.instance.player.playerEntity.node
    }
    if (playerEntity.node != undefined && this.powerMesh == undefined) {
      // create the screen mesh
      this.powerMesh = MeshBuilder.CreatePlane("power-plane", {
        width: 0.4,
        height: 0.4,
        sideOrientation: Mesh.DOUBLESIDE,
      })
      this.powerGui = AdvancedDynamicTexture.CreateForMeshTexture(this.powerMesh)
      this.powerGui.idealWidth = 250

      let mat = new StandardMaterial("vdu1-plane-mat")
      mat.diffuseTexture = this.powerGui
      mat.emissiveTexture = this.powerGui
      mat.specularColor = Color3.Black()
      this.powerMesh.material = mat
      this.powerMesh.position.set(0, -0.355, -1)
      // this.powerMesh.lookAt(Vector3.Zero())
      // const background = new FluentContainer("background").background("black")
      // this.powerGui.addControl(background.build())
      this.powerGui.addControl(this.power)
      // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
      // this.vduMesh.lookAt(VRSystem.xr.baseExperience.camera.position)
      // Rotate the plane 180 degrees around the Y-axis to flip it
      this.powerMesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
      this.powerMesh.parent = AppContainer.instance.player.playerEntity.node
    }
    if (playerEntity.vduState.left != this.leftVDU) {
      SoundEffects.Select()
      this.leftVDU = this.switchDisplay(this.vdu1Container, playerEntity.vduState.left)
    }
    if (playerEntity.vduState.right != this.rightVDU) {
      SoundEffects.Select()
      this.rightVDU = this.switchDisplay(this.vdu2Container, playerEntity.vduState.right)
    }
    this.power.text = `⚡${this.powerBar()} `

    // debugs
    this.debugAiVdu.update(playerEntity, dt)
    // screens
    this.statsVDU.update(dt)
    this.speedHUD.update(dt)
    this.damageDisplay.update()
    this.destinationVDU.update(playerEntity, dt)
    this.weapons.update()
    this.guns.update()
    this.enemyTarget.update(playerEntity, dt)
    this.radarDisplay.update(playerEntity, this.hitPlayer, dt)
    this.objectivesVDU.update(playerEntity, dt)
    if (playerEntity.openComms) {
      if (playerEntity.vduState.right == "comms" || playerEntity.vduState.left == "comms") {
        this.commsVDU.update(playerEntity, dt)
      } else {
        world.removeComponent(playerEntity, "openComms")
      }
    }
  }

  powerBar() {
    const playerEntity = AppContainer.instance.player.playerEntity
    let f = playerEntity.powerPlant.currentCapacity / playerEntity.powerPlant.maxCapacity
    f = Math.round(f * 100)
    return barPercentCustom(f, 10)
  }

  switchDisplay(vdu: GUI.Container, display: Display): Display {
    let oldVDU = vdu.children[0]
    if (oldVDU != undefined) {
      vdu.removeControl(oldVDU)
    }
    switch (display) {
      case "comms":
        vdu.addControl(this.commsVDU.mainComponent)
        break
      case "debugAi":
        vdu.addControl(this.debugAiVdu.mainComponent)
        break
      case "damage":
        vdu.addControl(this.damageDisplay.mainComponent)
        break
      case "target":
        vdu.addControl(this.enemyTarget.mainComponent)
        break
      case "guns":
        vdu.addControl(this.guns.mainComponent)
        break
      case "weapons":
        vdu.addControl(this.weapons.mainComponent)
        break
      case "destination":
        vdu.addControl(this.destinationVDU.mainComponent)
        break
      case "objectives":
        vdu.addControl(this.objectivesVDU.mainComponent)
        break
    }
    return display
  }
}
