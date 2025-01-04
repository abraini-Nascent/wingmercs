import { SkyboxSystems } from "./../../../world/systems/visualsSystems/skyboxSystems"
import { MotionHands } from "./../../../world/systems/input/vr/motionHands"
import { IDisposable } from "@babylonjs/core"
import { GameScene } from "../../gameScene"
import { ShipSelectionScreen } from "../../shipCustomizer/shipSelection/shipSelectionScreen"
import { CreateEntity, Entity, NerdStats, queries, world } from "../../../world/world"
import { Broadsword, Dirk, Epee, Rapier, Saber } from "../../../data/ships"
import { generateMission } from "../../../world/missionFactory"
import { AppContainer } from "../../../app.container"
import { MeshedSystem } from "../../../world/systems/renderSystems/meshedSystem"
import { ShipTemplate } from "../../../data/ships/shipTemplate"
import { InstantActionScene } from "./instantAction.singlePlayer"
import { MissionSelectRetroScreen } from "../../missionSelectScene/missionSelectRetroScreen"
import { Mission } from "../../../data/missions/missionData"
import { ShipCustomizerRetroScreen } from "../../shipCustomizer/shipCustomizerRetroScreen"
import { MainMenuScene } from "../../mainMenu/mainMenuLoop"
import { debugLog } from "../../../utils/debuglog"

export class InstantActionSetupScene implements GameScene, IDisposable {
  missionSelectScreen: MissionSelectRetroScreen
  shipSelectScreen: ShipSelectionScreen
  shipCustomizationScreen: ShipCustomizerRetroScreen

  shipModels: { [name: string]: Entity } = {}

  campaignEntity: Entity

  meshedSystem: MeshedSystem
  skyboxSystems: SkyboxSystems
  motionHands: MotionHands

  currentLoop: (delta: number) => void

  constructor(skyboxSystems: SkyboxSystems) {
    this.skyboxSystems = skyboxSystems
    if (MotionHands.instance) {
      this.motionHands = MotionHands.instance
    } else {
      this.motionHands = new MotionHands()
    }
    this.setupMissionSelect()
  }

  dispose(): void {
    if (this.meshedSystem) {
      this.meshedSystem.dispose()
      this.meshedSystem = undefined
    }
    if (this.shipSelectScreen) {
      this.shipSelectScreen.dispose()
      this.shipSelectScreen = undefined
    }
    if (this.shipCustomizationScreen) {
      this.shipCustomizationScreen.dispose()
      this.shipCustomizationScreen = undefined
    }
    if (this.skyboxSystems) {
      this.skyboxSystems.dispose()
    }
    if (this.motionHands) {
      this.motionHands.dispose()
    }
    this.clearShipModels()
  }

  runLoop = (delta: number) => {
    this.skyboxSystems.update(delta)
    this.motionHands.update(delta)
    this.currentLoop(delta)
    const scene = AppContainer.instance.scene
    scene.render()
  }

  clearShipModels() {
    if (Object.keys(this.shipModels).length > 0) {
      Object.keys(this.shipModels).forEach((key) => {
        world.remove(this.shipModels[key])
      })
      this.shipModels = {}
    }
  }
  setupMissionSelect() {
    if (queries.campaign.first) {
      world.remove(queries.campaign.first)
    }
    if (!this.meshedSystem) {
      this.meshedSystem = new MeshedSystem()
    }
    this.campaignEntity = CreateEntity({
      campaign: {
        currentMission: undefined,
        pilots: [],
        salvage: {
          guns: [],
          hulls: [],
          shipParts: [],
          weapons: [],
        },
        score: {
          livesLeft: 1,
          timeLeft: 90,
          total: 0,
        },
        stats: {
          afterburnerFuelSpent: 0,
          armorDamageGiven: 0,
          armorDamageTaken: 0,
          missilesDodged: 0,
          missilesEaten: 0,
          missilesLaunched: 0,
          missilesHit: 0,
          roundsMissed: 0,
          roundsHit: 0,
          shieldDamageTaken: 0,
          shieldDamageGiven: 0,
          driftTime: 0,
          totalKills: 0,
        } as NerdStats,
        ships: [Dirk, Epee, Rapier, Saber, Broadsword],
      },
    })
    queries.campaign.onEntityRemoved.subscribe((entity) => {
      debugLog("removing", entity)
    })
    this.missionSelectScreen = new MissionSelectRetroScreen([
      generateMission(20),
      generateMission(40),
      generateMission(60),
    ])
    this.missionSelectScreen.onDone = (mission) => this.missionSelected(mission)
    this.missionSelectScreen.onBack = () => this.missionBackSelected()
    this.currentLoop = this.missionSelectLoop
  }

  missionBackSelected() {
    this.dispose()
    AppContainer.instance.gameScene = new MainMenuScene()
  }

  missionSelected(mission: Mission) {
    debugLog("mission selected")
    if (mission) {
      this.missionSelectScreen.dispose()
      this.campaignEntity.campaign.currentMission = mission
      debugLog("[Instance Action Setup] selected mission: ", this.campaignEntity.campaign.currentMission)

      this.setupShipSelect()
    }
  }

  setupShipSelect() {
    this.setupShipCustomization(structuredClone(Rapier))
    return
    this.shipSelectScreen = new ShipSelectionScreen()
    for (const shipData of this.campaignEntity.campaign.ships) {
      const ship = shipData.class
      this.shipModels[ship] = CreateEntity({
        meshName: shipData.modelDetails.base,
        shieldMeshName: shipData.modelDetails.shield,
        physicsMeshName: shipData.modelDetails.physics,
      })
    }
    this.shipSelectScreen.onSelect = (ship) => this.shipSelected(ship)
    queueMicrotask(() => {
      this.shipSelectScreen.setModels(this.shipModels)
    })
    queueMicrotask(() => {
      this.currentLoop = this.shipSelectLoop
    })
  }

  shipSelected(ship: ShipTemplate) {
    ship = structuredClone(ship)

    this.setupShipCustomization(ship)
    this.shipSelectScreen.dispose()
    this.shipSelectScreen = undefined

    this.clearShipModels()

    this.currentLoop = this.shipCustomizerLoop
  }

  setupShipCustomization(ship: ShipTemplate) {
    this.shipCustomizationScreen = new ShipCustomizerRetroScreen(ship)
    this.shipCustomizationScreen.onSelected = (ship) => this.shipCustomized(ship)
  }

  shipCustomized(ship: ShipTemplate) {
    // navigate to next screen
    let oldScene = AppContainer.instance.gameScene
    oldScene.dispose()
    let nextScene = new InstantActionScene(ship, this.campaignEntity)
    AppContainer.instance.gameScene = nextScene
  }

  /// LOOPS

  missionSelectLoop = (delta: number) => {
    this.missionSelectScreen.updateScreen(delta)
  }

  shipSelectLoop = (delta: number) => {
    this.shipSelectScreen.updateScreen(delta)
  }

  shipCustomizerLoop = (delta: number) => {
    this.shipCustomizationScreen.updateScreen(delta)
  }
}
