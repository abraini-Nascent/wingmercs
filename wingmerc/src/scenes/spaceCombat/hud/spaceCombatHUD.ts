import { DestinationVDU } from "./spaceCombatHUD.DestinationVDU"
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui"
import * as GUI from "@babylonjs/gui"
import { AppContainer } from "../../../app.container"
import { Display, EntityUUID, world } from "../../../world/world"
import { InterceptorSubscription, interceptEvent } from "../../../app.pipeline"
import { StatsHud } from "./spaceCombatHUD.StatsVDU"
import { TargetVDU } from "./spaceCombatHUD.TargetVDU"
import { TextSizeAnimationComponent } from "../../../utils/guiHelpers"
import { barPercentCustom } from "./spaceCombatHUD.helpers"
import { RadarDisplay } from "./spaceCombatHUD.Radar"
import { TargetingHUD } from "./spaceCombatHUD.TargetingHUD"
import { SpeedHUD } from "./spaceCombatHUD.SpeedHUD"
import { DamageVDU } from "./spaceCombatHUD.DamageVDU"
import { WeaponsVDU } from "./spaceCombatHUD.WeaponsVDU"
import { SoundEffects } from "../../../utils/sounds/soundEffects"
import { GunsVDU } from "./spaceCombatHUD.GunsVDU"
import { DebugAIVDU } from "./spaceCombatHUD.DebugAIVDU"
import { ObjectivesVDU } from "./spaceCombatHUD.ObjectivesVDU"
import { CommunicationsVDU } from "./spaceCombatHUD.CommunicationsVDU"
import { DebugInputVDU } from "./spaceCombatHUD.DebugInputVDU"
import { DisposableBag } from "../../../utils/disposeBag"
import {
  Axis,
  Color3,
  IDisposable,
  Mesh,
  MeshBuilder,
  Space,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core"
import { FluentContainer, FluentTextBlock, Ref } from "../../../utils/fluentGui"
import { CombatXRControllerInput } from "../../../world/systems/input/combatInput/combatXRControllerInput"
import { VRSystem } from "../../../world/systems/renderSystems/vrSystem"
import { AutoHUD } from "./spaceCombatHUD.AutoHUD"
import { RetroGui } from "../../../utils/retroGui"
import { TextBlockExtra } from "../../../utils/TextBlockExtra"
import { MotionHandCollision, MotionHands } from "../../../world/systems/input/vr/motionHands"
import { VDU } from "./SpaceCombatHUD.VDU"
import { debugLog } from "../../../utils/debuglog"

const LeftDisplays: Display[] = ["damage", "guns", "weapons", "debugAi", "debugInput"]
const RightDisplays: Display[] = ["target", "destination", "objectives", "debugAi"]

export class CombinedCombatHud implements IDisposable {
  hud: CombatHud
  inWorldHud: CombatHud
  _getReady: boolean = false
  _gameover: boolean = false
  _landed: boolean = false

  set getReady(value: boolean) {
    this._getReady = value
    if (this.hud) {
      this.hud.getReady = value
    }
    if (this.inWorldHud) {
      this.inWorldHud.getReady = value
    }
  }
  set gameover(value: boolean) {
    this._gameover = value
    if (this.hud) {
      this.hud.gameover = value
    }
    if (this.inWorldHud) {
      this.inWorldHud.gameover = value
    }
  }
  set landed(value: boolean) {
    this._landed = value
    if (this.hud) {
      this.hud.landed = value
    }
    if (this.inWorldHud) {
      this.inWorldHud.landed = value
    }
  }
  constructor() {
    return
    if (!VRSystem.inXR) {
      this.hud = new CombatHud()
    } else {
      this.inWorldHud = new CombatHud(true)
    }
  }

  dispose(): void {
    if (this.hud) {
      this.hud.dispose()
      this.hud = undefined
    }
    if (this.inWorldHud) {
      this.inWorldHud.dispose()
      this.inWorldHud = undefined
    }
  }

  checkXr(): void {
    if (VRSystem.inXR) {
      if (this.hud) {
        this.hud.dispose()
        this.hud = undefined
      }
      if (!this.inWorldHud) {
        this.inWorldHud = new CombatHud(true)
        this.inWorldHud.getReady = this._getReady
        this.inWorldHud.gameover = this._gameover
      }
    } else {
      if (this.inWorldHud) {
        this.inWorldHud.dispose()
        this.inWorldHud = undefined
      }
      if (!this.hud) {
        this.hud = new CombatHud()
        this.hud.getReady = this._getReady
        this.hud.gameover = this._gameover
      }
    }
  }

  update(delta: number): void {
    if (this.hud) {
      this.hud.updateScreen(delta)
    }
    if (this.inWorldHud) {
      this.inWorldHud.updateScreen(delta)
    }
  }
}
export class CombatHud {
  gui: AdvancedDynamicTexture
  disposableBag = new DisposableBag()
  hud: GUI.Container
  gameoverScreen: GUI.Container
  power: TextBlock

  targetingHUD: TargetingHUD
  speedHUD: SpeedHUD
  autoHUD: AutoHUD
  /** Left */
  vdu1: VDU
  vdu1Container: GUI.Container
  vdu1Buttons: Mesh[] = []
  /** Right */
  vdu2: VDU
  vdu2Container: GUI.Container
  vdu2Buttons: Mesh[] = []
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
  debugInputVdu: DebugInputVDU

  score: TextBlock
  timeLeft: TextBlock
  gameOverText: TextSizeAnimationComponent
  getReadyText: TextSizeAnimationComponent

  leftVDU: Display = "weapons"
  rightVDU: Display = "target"
  statsVDU: StatsHud
  registerHitInterceptor: InterceptorSubscription
  hitPlayer: Set<EntityUUID> = new Set()
  flashTimer = 0
  gameover: boolean = false
  landed: boolean = false
  _getReady: boolean = false
  spectator: boolean = false

  // in real space display
  inWorld: boolean
  screenMesh: Mesh
  vdu1Gui: AdvancedDynamicTexture
  vdu1Mesh: Mesh
  vdu1Node: TransformNode
  vdu2Gui: AdvancedDynamicTexture
  vdu2Node: TransformNode
  vdu2Mesh: Mesh
  radarGui: AdvancedDynamicTexture
  radarMesh: Mesh
  powerGui: AdvancedDynamicTexture
  powerMesh: Mesh
  speedGui: AdvancedDynamicTexture
  speedMesh: Mesh
  autoGui: AdvancedDynamicTexture
  autoMesh: Mesh
  statsGui: AdvancedDynamicTexture
  statsMesh: Mesh

  constructor(inWorld: boolean = false) {
    this.inWorld = inWorld
    if (inWorld) {
      this.screenMesh = this.disposableBag.add(
        MeshBuilder.CreatePlane("screen-plane", { height: 2, width: 2 * (16 / 9), sideOrientation: Mesh.DOUBLESIDE })
      )
      this.screenMesh.isPickable = false
      const advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.screenMesh, 1920, 1080)
      advancedTexture.idealWidth = 1920
      let mat = new StandardMaterial("menu-plane-mat")
      mat.diffuseTexture = advancedTexture
      mat.emissiveTexture = advancedTexture
      mat.specularColor = Color3.Black()
      this.screenMesh.material = mat
      this.screenMesh.position.set(0, VRSystem.xr.baseExperience.camera.position.y, -1)
      // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
      this.screenMesh.lookAt(VRSystem.xr.baseExperience.camera.position)
      // Rotate the plane 180 degrees around the Y-axis to flip it
      this.screenMesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
      this.gui = advancedTexture
    } else {
      const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("HUD")
      advancedTexture.idealWidth = 1920
      this.gui = advancedTexture
    }
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
    this.disposableBag.dispose()

    this.hud.dispose()
    if (!this.inWorld) {
      if (this.gameoverScreen != undefined) {
        debugLog("[spaceCombatHud] removing gameover textblock")
        if (this.gameOverText) {
          this.gameoverScreen.removeControl(this.gameOverText.textblock)
          this.gameOverText.dispose()
        }
        if (this.gameoverScreen) {
          this.gameoverScreen.dispose()
          this.gui.removeControl(this.gameoverScreen)
        }
      }
      if (this.getReadyText != undefined) {
        this.gui.removeControl(this.getReadyText.textblock)
        this.getReadyText.dispose()
      }
    }
    AppContainer.instance.scene.removeTexture(this.gui)
    this.gui.dispose()
  }

  deinit() {
    debugLog("[SpaceCombatHud] deinit")
  }

  fontSize = 15
  cellWidth = 15
  private styleVduButtonText = (tb: GUI.TextBlock, color: string) => {
    tb.fontFamily = "KongfaceRegular"
    tb.fontSize = `${this.fontSize}px`
    tb.color = color
    const tbe = TextBlockExtra.isExtra(tb)
    if (tbe) {
      tbe.letterWidthInPixels = this.cellWidth
    }
    tb.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    tb.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    tb.textVerticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
    tb.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER
  }

  setupMain() {
    this.hud = new GUI.Container("hud")
    this.hud.paddingBottomInPixels = 24
    this.hud.paddingTopInPixels = 24
    this.hud.paddingLeftInPixels = 24
    this.hud.paddingRightInPixels = 24
    this.gameoverScreen = new GUI.Container("gameoverScreen")
    if (!this.inWorld) {
      this.gui.addControl(this.hud)
    }

    this.targetingHUD = new TargetingHUD()
    this.disposableBag.add(this.targetingHUD)
    if (!this.inWorld) {
      this.hud.addControl(this.targetingHUD.mainComponent)
    }

    this.speedHUD = new SpeedHUD()
    this.disposableBag.add(this.speedHUD)
    if (!this.inWorld) {
      this.hud.addControl(this.speedHUD.mainComponent)
    }
    this.autoHUD = new AutoHUD()
    this.disposableBag.add(this.autoHUD)
    if (!this.inWorld) {
      this.hud.addControl(this.autoHUD.mainComponent)
    }

    this.enemyTarget = this.disposableBag.add(new TargetVDU())
    this.damageDisplay = this.disposableBag.add(new DamageVDU())
    this.destinationVDU = this.disposableBag.add(new DestinationVDU())
    this.objectivesVDU = this.disposableBag.add(new ObjectivesVDU())
    this.weapons = this.disposableBag.add(new WeaponsVDU())
    this.guns = this.disposableBag.add(new GunsVDU())
    this.radarDisplay = this.disposableBag.add(new RadarDisplay())
    this.statsVDU = this.disposableBag.add(new StatsHud())
    this.commsVDU = this.disposableBag.add(new CommunicationsVDU())
    this.debugAiVdu = this.disposableBag.add(new DebugAIVDU())
    this.debugInputVdu = this.disposableBag.add(new DebugInputVDU())

    const VDU1Container = new GUI.Container("VDU1")
    VDU1Container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    VDU1Container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    VDU1Container.width = "240px"
    VDU1Container.height = "240px"
    VDU1Container.background = "rgba(150,150,150,0.2)"
    this.vdu1Container = VDU1Container
    this.vdu1Container.addControl(this.weapons.mainComponent)
    this.vdu1 = this.weapons as any

    const VDU2Container = new GUI.Container("VDU2")
    VDU2Container.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
    VDU2Container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    VDU2Container.width = "240px"
    VDU2Container.height = "240px"
    VDU2Container.background = "rgba(150,150,150,0.2)"
    this.vdu2Container = VDU2Container
    this.vdu2Container.addControl(this.enemyTarget.mainComponent)
    this.vdu2 = this.enemyTarget as any

    const statsContainer = new GUI.Container("Stats")
    statsContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    statsContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    statsContainer.width = "240px"
    statsContainer.height = "240px"
    statsContainer.left = 264
    this.statsContainer = statsContainer
    if (!this.inWorld) {
      this.statsContainer.addControl(this.statsVDU.mainComponent)
    }

    const scorePanel = new GUI.StackPanel()
    scorePanel.isVertical = true
    scorePanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    scorePanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    scorePanel.width = "360px"

    const score = this.disposableBag.add(new GUI.TextBlock())
    this.score = score
    score.fontFamily = "monospace"
    score.text = "-=Score: 0000000=-"
    score.color = "gold"
    score.fontSize = 24
    score.height = "24px"
    score.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    score.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    if (!this.inWorld) {
      scorePanel.addControl(score)
    }

    const timeLeft = this.disposableBag.add(new GUI.TextBlock())
    this.timeLeft = timeLeft
    timeLeft.fontFamily = "monospace"
    timeLeft.text = "-=Time Left: 0000000=-"
    timeLeft.color = "gold"
    timeLeft.fontSize = 24
    timeLeft.height = "24px"
    timeLeft.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    timeLeft.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    if (!this.inWorld) {
      scorePanel.addControl(timeLeft)
    }

    const centerBottomPanel = new GUI.StackPanel()
    centerBottomPanel.isVertical = true
    centerBottomPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    centerBottomPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
    centerBottomPanel.width = "240px"

    if (!this.inWorld) {
      centerBottomPanel.addControl(this.radarDisplay.mainComponent)
    }

    const power = this.disposableBag.add(new GUI.TextBlock())
    this.power = power
    power.name = "power"
    power.fontFamily = "monospace"
    power.text = "⚡|▉▉▉"
    power.color = "blue"
    power.fontSize = 24
    power.height = "24px"
    power.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    power.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    if (!this.inWorld) {
      centerBottomPanel.addControl(power)
    }

    if (!this.inWorld) {
      this.hud.addControl(VDU1Container)
      this.hud.addControl(VDU2Container)
      this.hud.addControl(statsContainer)
      this.hud.addControl(centerBottomPanel)
      this.hud.addControl(scorePanel)
    }
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
    if (!this.inWorld) {
      if (this.gameover) {
        if (this.hud.isVisible == false) {
          this.hud.isVisible = true
        }
        this.hideAll()
        if (this.gameOverText == undefined) {
          const text = this.landed ? "LANDING" : "GAME OVER"
          this.gameOverText = new TextSizeAnimationComponent(text, "gold", 24, 128, 300, () => {
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
    }

    const playerEntity = AppContainer.instance.player.playerEntity
    if (this.inWorld) {
      const distanceToCamera = -0.45
      const verticalOffsetToCamera = -0.45
      if (playerEntity.node != undefined && this.vdu1Mesh == undefined) {
        // create the screen mesh
        this.vdu1Mesh = this.disposableBag.add(
          MeshBuilder.CreatePlane("vdu-plane", { size: 0.25, sideOrientation: Mesh.DOUBLESIDE })
        )
        // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
        // Rotate the plane 180 degrees around the Y-axis to flip it
        let vduNode = new TransformNode("vdu1-node")
        vduNode.position.set(0.25, verticalOffsetToCamera, distanceToCamera)
        vduNode.rotate(Axis.Y, Math.PI, Space.LOCAL)
        // vduNode.lookAt(VRSystem.xr.baseExperience.camera.position)
        vduNode.parent = AppContainer.instance.player.playerEntity.node
        this.vdu1Node = vduNode
        this.vdu1Mesh.isPickable = true
        this.vdu1Gui = AdvancedDynamicTexture.CreateForMeshTexture(this.vdu1Mesh, 240, 240)
        this.vdu1Gui.idealWidth = 240
        this.vdu1Gui.hasAlpha = true

        let mat = new StandardMaterial("vdu1-plane-mat")
        mat.diffuseTexture = this.vdu1Gui
        mat.emissiveTexture = this.vdu1Gui
        mat.specularColor = Color3.Black()
        mat.useAlphaFromDiffuseTexture = true
        this.vdu1Mesh.material = mat
        this.vdu1Mesh.parent = vduNode
        this.vdu1Gui.addControl(this.vdu1Container)
        /// debug testing, set button to random color
        // function getRandomHexColor(): string {
        //   const randomColor = Math.floor(Math.random() * 0xffffff)
        //   return `#${randomColor.toString(16).padStart(6, "0")}`
        // }
        // create vdu1 buttons
        for (let i = 0; i < 15; i += 1) {
          let button = this.disposableBag.add(
            MeshBuilder.CreatePlane("vdu1-plane-button-" + i, { size: 0.045, sideOrientation: Mesh.DOUBLESIDE })
          )
          let offset = -1
          let reset = 0
          if (i > 4) {
            offset = 1
            reset = 5
          }
          let label = `${i + 1}`
          if (i == 9) {
            label = `${0}`
          }
          // button.parent = this.vdu1Mesh
          button.parent = vduNode
          button.position.x = (0.25 / 2) * offset - (0.05 / 2) * -offset
          button.position.y = 0.25 / 2 - (i - reset) * 0.05 - 0.05 / 2
          if (i > 9) {
            let local = i - 10
            button.position.x = -(0.25 / 2 - 0.05 / 2) + local * 0.05 // - local * 0.05 - 0.05 / 2
            button.position.y = 0.25 / 2 + 0.05 / 2
            label = ["<", "G", "C", "W", ">"][local]
          }
          button.isPickable = false
          button.isNearPickable = false
          let buttonTexture = AdvancedDynamicTexture.CreateForMeshTexture(button, 20, 20)
          buttonTexture.idealWidth = 20
          buttonTexture.hasAlpha = true

          let mat = new StandardMaterial("vdu1-plane-button-mat-" + i)
          mat.diffuseTexture = buttonTexture
          mat.emissiveTexture = buttonTexture
          mat.specularColor = Color3.Black()
          mat.useAlphaFromDiffuseTexture = true
          button.material = mat

          this.vdu1Buttons.push(button)
          let buttonRef = new Ref<GUI.Container>()
          buttonTexture.addControl(
            new FluentContainer(
              "button-container" + i,
              new FluentTextBlock("button-" + i, label).modifyControl((c) =>
                this.styleVduButtonText(c, RetroGui.colors.foreground)
              )
            )
              .storeIn(buttonRef)
              .background(RetroGui.colors.shadow)
              .alpha(0.25)
              .build()
          )
          MotionHands.instance.addCollisionCheck(button, 0.025 / 2, (hit, state) => {
            if (state == MotionHandCollision.State.entering) {
              SoundEffects.Select()
              debugLog("[vdu button] entering", i)
              // buttonRef.get().background = getRandomHexColor()
              if (i < 10) {
                this.vdu1.vduButtonPressed(i)
              }
              let displayIdx = LeftDisplays.findIndex((d) => {
                return d == playerEntity.vduState.left
              })
              debugLog("[vdu button] current display", LeftDisplays[displayIdx])
              if (i == 10) {
                displayIdx = displayIdx - 1
                if (displayIdx < 0) {
                  displayIdx = LeftDisplays.length - 1
                }
                debugLog("[vdu button] new display", LeftDisplays[displayIdx])
                playerEntity.vduState.left = LeftDisplays[displayIdx]
              }
              if (i == 11) {
                // guns
                playerEntity.vduState.left = "guns"
              }
              if (i == 12) {
                // comms
                let comms = playerEntity.commsCommand
                if (comms && comms.open == true) {
                  comms.open = !comms.open
                } else {
                  world.addComponent(playerEntity, "openComms", playerEntity.id)
                  playerEntity.vduState.left = "comms"
                }
              }
              if (i == 13) {
                // weapons
                playerEntity.vduState.left = "weapons"
              }
              if (i == 14) {
                displayIdx = displayIdx + 1
                if (displayIdx >= LeftDisplays.length) {
                  displayIdx = 0
                }
                debugLog("[vdu button] new display", LeftDisplays[displayIdx])
                playerEntity.vduState.left = LeftDisplays[displayIdx]
              }
            }
          })
        }
      }
      if (playerEntity.node != undefined && this.vdu2Mesh == undefined) {
        // create the screen mesh
        this.vdu2Mesh = this.disposableBag.add(
          MeshBuilder.CreatePlane("vdu2-plane", { size: 0.25, sideOrientation: Mesh.DOUBLESIDE })
        )
        // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
        // Rotate the plane 180 degrees around the Y-axis to flip it
        let vduNode = new TransformNode("vdu2-node")
        // this.vdu2Mesh.position.set(-0.2, verticalOffsetToCamera, distanceToCamera)
        vduNode.position.set(-0.25, verticalOffsetToCamera, distanceToCamera)
        vduNode.rotate(Axis.Y, Math.PI, Space.LOCAL)
        // vduNode.lookAt(VRSystem.xr.baseExperience.camera.position)
        vduNode.parent = AppContainer.instance.player.playerEntity.node
        this.vdu2Node = vduNode
        this.vdu2Mesh.parent = vduNode
        this.vdu2Mesh.isPickable = false
        this.vdu2Mesh.isNearPickable = false
        this.vdu2Gui = AdvancedDynamicTexture.CreateForMeshTexture(this.vdu2Mesh, 240, 240)
        this.vdu2Gui.idealWidth = 240

        let mat = new StandardMaterial("vdu1-plane-mat")
        mat.diffuseTexture = this.vdu2Gui
        mat.emissiveTexture = this.vdu2Gui
        mat.specularColor = Color3.Black()
        mat.useAlphaFromDiffuseTexture = true
        this.vdu2Mesh.material = mat
        this.vdu2Gui.addControl(this.vdu2Container)

        this.vdu2Container.onPointerClickObservable.add(() => {
          if ((CombatXRControllerInput.current?.rightSqueeze ?? false) == false) {
            let displayIdx =
              RightDisplays.findIndex((d) => {
                return d == playerEntity.vduState.right
              }) + 1
            if (displayIdx >= RightDisplays.length) {
              displayIdx = 0
            }
            playerEntity.vduState.right = RightDisplays[displayIdx]
          }
        })

        // create vdu2 buttons
        for (let i = 0; i < 15; i += 1) {
          let button = this.disposableBag.add(
            MeshBuilder.CreatePlane("vdu1-plane-button-" + i, { size: 0.045, sideOrientation: Mesh.DOUBLESIDE })
          )
          let offset = -1
          let reset = 0
          if (i > 4) {
            offset = 1
            reset = 5
          }
          let label = `${i + 1}`
          if (i == 9) {
            label = `${0}`
          }
          // button.parent = this.vdu1Mesh
          button.parent = vduNode
          button.position.x = (0.25 / 2) * offset - (0.05 / 2) * -offset
          button.position.y = 0.25 / 2 - (i - reset) * 0.05 - 0.05 / 2
          if (i > 9) {
            let local = i - 10
            button.position.x = -(0.25 / 2 - 0.05 / 2) + local * 0.05 // - local * 0.05 - 0.05 / 2
            button.position.y = 0.25 / 2 + 0.05 / 2
            label = ["<", "D", "T", "O", ">"][local]
          }
          button.isPickable = false
          button.isNearPickable = false
          let buttonTexture = AdvancedDynamicTexture.CreateForMeshTexture(button, 20, 20)
          buttonTexture.idealWidth = 20
          buttonTexture.hasAlpha = true

          let mat = new StandardMaterial("vdu1-plane-button-mat-" + i)
          mat.diffuseTexture = buttonTexture
          mat.emissiveTexture = buttonTexture
          mat.specularColor = Color3.Black()
          mat.useAlphaFromDiffuseTexture = true
          button.material = mat

          this.vdu2Buttons.push(button)
          let buttonRef = new Ref<GUI.Container>()
          buttonTexture.addControl(
            new FluentContainer(
              "button-container" + i,
              new FluentTextBlock("button-" + i, label).modifyControl((c) =>
                this.styleVduButtonText(c, RetroGui.colors.foreground)
              )
            )
              .storeIn(buttonRef)
              .background(RetroGui.colors.shadow)
              .alpha(0.25)
              .build()
          )
          MotionHands.instance.addCollisionCheck(button, 0.025 / 2, (hit, state) => {
            if (state == MotionHandCollision.State.entering) {
              SoundEffects.Select()
              debugLog("[vdu button] entering", i)
              // buttonRef.get().background = getRandomHexColor()
              if (i < 10) {
                this.vdu2.vduButtonPressed(i)
              }
              let displayIdx = RightDisplays.findIndex((d) => {
                return d == playerEntity.vduState.right
              })
              debugLog("[vdu button] current display", RightDisplays[displayIdx])
              if (i == 10) {
                displayIdx = displayIdx - 1
                if (displayIdx < 0) {
                  displayIdx = RightDisplays.length - 1
                }
                debugLog("[vdu button] new display", RightDisplays[displayIdx])
                playerEntity.vduState.right = RightDisplays[displayIdx]
              }
              if (i == 11) {
                // destination
                playerEntity.vduState.right = "destination"
              }
              if (i == 12) {
                // target
                playerEntity.vduState.right = "target"
              }
              if (i == 13) {
                // objectives
                playerEntity.vduState.right = "objectives"
              }
              if (i == 14) {
                displayIdx = displayIdx + 1
                if (displayIdx >= LeftDisplays.length) {
                  displayIdx = 0
                }
                debugLog("[vdu button] new display", LeftDisplays[displayIdx])
                playerEntity.vduState.left = LeftDisplays[displayIdx]
              }
            }
          })
        }
      }
      /// RADAR
      if (playerEntity.node != undefined && this.radarMesh == undefined) {
        // create the screen mesh
        this.radarMesh = this.disposableBag.add(
          MeshBuilder.CreatePlane("radar-plane", { size: 0.1, sideOrientation: Mesh.DOUBLESIDE })
        )
        this.radarGui = AdvancedDynamicTexture.CreateForMeshTexture(this.radarMesh, 150, 150)
        this.radarGui.idealWidth = 150

        let mat = new StandardMaterial("radar-plane-mat")
        mat.diffuseTexture = this.radarGui
        mat.emissiveTexture = this.radarGui
        mat.specularColor = Color3.Black()
        mat.useAlphaFromDiffuseTexture = true
        this.radarMesh.material = mat
        this.radarMesh.position.set(0, -0.35, distanceToCamera)
        this.radarMesh.lookAt(Vector3.Zero())
        const background = new FluentContainer("background").background("black").alpha(0.2)
        this.radarGui.addControl(background.build())
        this.radarGui.addControl(this.radarDisplay.mainComponent)
        this.radarMesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
        this.radarMesh.parent = AppContainer.instance.player.playerEntity.node
      }
      /// POWER
      if (playerEntity.node != undefined && this.powerMesh == undefined) {
        // create the screen mesh
        this.powerMesh = this.disposableBag.add(
          MeshBuilder.CreatePlane("power-plane", {
            width: 0.25,
            height: (40 / 240) * 0.25,
            sideOrientation: Mesh.DOUBLESIDE,
          })
        )
        this.powerMesh.isPickable = false
        this.powerGui = AdvancedDynamicTexture.CreateForMeshTexture(this.powerMesh, 240, 40)
        this.powerGui.idealWidth = 240

        let mat = new StandardMaterial("vdu1-plane-mat")
        mat.diffuseTexture = this.powerGui
        mat.emissiveTexture = this.powerGui
        mat.specularColor = Color3.Black()
        this.powerMesh.material = mat
        this.powerMesh.position.set(0, -0.25, distanceToCamera)
        this.powerGui.addControl(this.power)
        this.powerMesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
        this.powerMesh.parent = AppContainer.instance.player.playerEntity.node
      }
      /// SPEED
      if (playerEntity.node != undefined && this.speedMesh == undefined) {
        // create the screen mesh
        this.speedMesh = this.disposableBag.add(
          MeshBuilder.CreatePlane("speed-plane", {
            width: 0.25,
            height: 0.25,
            sideOrientation: Mesh.DOUBLESIDE,
          })
        )
        this.speedMesh.isPickable = false
        this.speedGui = AdvancedDynamicTexture.CreateForMeshTexture(this.powerMesh, 240, 240)
        this.speedGui.idealWidth = 240

        let mat = new StandardMaterial("speed-plane-mat")
        mat.diffuseTexture = this.speedGui
        mat.emissiveTexture = this.speedGui
        mat.specularColor = Color3.Black()
        this.speedMesh.material = mat
        this.speedMesh.position.set(0.2, -0.27, distanceToCamera)
        this.speedGui.addControl(this.speedHUD.mainComponent)
        this.speedMesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
        this.speedMesh.parent = AppContainer.instance.player.playerEntity.node
      }
      /// AUTO
      if (playerEntity.node != undefined && this.autoMesh == undefined) {
        // create the screen mesh
        this.autoMesh = this.disposableBag.add(
          MeshBuilder.CreatePlane("auto-plane", {
            width: 0.25,
            height: 0.25,
            sideOrientation: Mesh.DOUBLESIDE,
          })
        )
        this.autoMesh.isPickable = false
        this.autoGui = AdvancedDynamicTexture.CreateForMeshTexture(this.autoMesh, 240, 240)
        this.autoGui.idealWidth = 240

        let mat = new StandardMaterial("auto-plane-mat")
        mat.diffuseTexture = this.autoGui
        mat.emissiveTexture = this.autoGui
        mat.specularColor = Color3.Black()
        this.autoMesh.material = mat
        this.autoMesh.position.set(-0.2, -0.27, distanceToCamera)
        this.autoGui.addControl(this.autoHUD.mainComponent)
        this.autoMesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
        this.autoMesh.parent = AppContainer.instance.player.playerEntity.node
      }
      /// STATS
      if (playerEntity.node != undefined && this.statsMesh == undefined) {
        // create the screen mesh
        this.statsMesh = this.disposableBag.add(
          MeshBuilder.CreatePlane("stats-plane", {
            width: 0.25,
            height: 0.25,
            sideOrientation: Mesh.DOUBLESIDE,
          })
        )
        this.statsMesh.isPickable = false
        this.statsGui = AdvancedDynamicTexture.CreateForMeshTexture(this.statsMesh, 240, 240)
        this.statsGui.idealWidth = 240

        let mat = new StandardMaterial("stats-plane-mat")
        mat.diffuseTexture = this.statsGui
        mat.emissiveTexture = this.statsGui
        mat.specularColor = Color3.Black()
        this.statsMesh.material = mat
        this.statsMesh.position.set(-0.085, -0.45, distanceToCamera)
        // this.powerMesh.lookAt(Vector3.Zero())
        // const background = new FluentContainer("background").background("black")
        // this.powerGui.addControl(background.build())
        this.statsGui.addControl(this.statsVDU.mainComponent)
        // By default, the lookAt method in Babylon.js aligns the negative Z-axis of the mesh to face the target. Since a plane in Babylon.js typically faces along its positive Z-axis, using lookAt will cause the back of the plane to face the target (in your case, the camera).
        // this.vduMesh.lookAt(VRSystem.xr.baseExperience.camera.position)
        // Rotate the plane 180 degrees around the Y-axis to flip it
        this.statsMesh.rotate(Axis.Y, Math.PI, Space.LOCAL)
        this.statsMesh.parent = AppContainer.instance.player.playerEntity.node
      }
    }

    this.flashTimer += dt

    if (playerEntity.vduState.left != this.leftVDU) {
      SoundEffects.Select()
      this.leftVDU = this.switchDisplay(1, this.vdu1Container, playerEntity.vduState.left)
    }
    if (playerEntity.vduState.right != this.rightVDU) {
      SoundEffects.Select()
      this.rightVDU = this.switchDisplay(2, this.vdu2Container, playerEntity.vduState.right)
    }
    this.power.text = `⚡${this.powerBar()} `
    this.score.text = `-=Score: ${Math.round(playerEntity.score.total).toString().padStart(8, "0")}=-`
    this.timeLeft.text = `-=Time Left: ${Math.round(playerEntity.score.timeLeft).toString().padStart(8, "0")}=-`

    // debugs
    this.debugAiVdu.update(playerEntity, dt)
    this.debugInputVdu.update(playerEntity, dt)

    // screens
    this.statsVDU.update(dt)
    this.speedHUD.update(dt)
    this.autoHUD.update(dt)
    this.damageDisplay.update()
    this.destinationVDU.update(playerEntity, dt)
    this.weapons.update()
    this.guns.update()
    this.enemyTarget.update(playerEntity, dt)
    this.radarDisplay.update(playerEntity, this.hitPlayer, dt)
    this.targetingHUD.update(playerEntity, dt)
    this.objectivesVDU.update(playerEntity, dt)
    if (playerEntity.openComms) {
      if (playerEntity.vduState.right == "comms" || playerEntity.vduState.left == "comms") {
        this.commsVDU.update(playerEntity, dt)
      } else {
        world.removeComponent(playerEntity, "openComms")
      }
    } else {
      if (playerEntity.vduState.right == "comms") {
        playerEntity.vduState.right = "target"
      }
      if (playerEntity.vduState.left == "comms") {
        playerEntity.vduState.left = "guns"
      }
    }
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
  setVdu(vduIdx: 1 | 2, vdu: VDU) {
    if (vduIdx == 1) {
      this.vdu1 = vdu
    } else {
      this.vdu2 = vdu
    }
  }
  switchDisplay(vdu: 1 | 2, vduContainer: GUI.Container, display: Display): Display {
    let oldVDU = vduContainer.children[0]

    if (oldVDU != undefined) {
      vduContainer.removeControl(oldVDU)
    }
    let control: GUI.Control
    let newVDU: VDU
    switch (display) {
      case "comms":
        control = this.commsVDU.mainComponent
        newVDU = this.commsVDU as any
        break
      case "debugAi":
        control = this.debugAiVdu.mainComponent
        newVDU = this.debugAiVdu as any
        break
      case "debugInput":
        control = this.debugInputVdu.mainComponent
        newVDU = this.debugInputVdu as any
        break
      case "damage":
        control = this.damageDisplay.mainComponent
        newVDU = this.damageDisplay as any
        break
      case "target":
        control = this.enemyTarget.mainComponent
        newVDU = this.enemyTarget as any
        break
      case "guns":
        control = this.guns.mainComponent
        newVDU = this.guns as any
        break
      case "weapons":
        control = this.weapons.mainComponent
        newVDU = this.weapons as any
        break
      case "destination":
        control = this.destinationVDU.mainComponent
        newVDU = this.destinationVDU as any
        break
      case "objectives":
        control = this.objectivesVDU.mainComponent
        newVDU = this.objectivesVDU as any
        break
    }
    vduContainer.addControl(control)
    this.setVdu(vdu, newVDU)
    return display
  }
}
