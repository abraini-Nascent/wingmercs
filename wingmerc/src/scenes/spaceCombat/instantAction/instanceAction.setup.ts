import { MissionSelectScreen } from "./../../missionSelectScene/missionSelectScreen"
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
import { SkyboxSystems } from "../../../world/systems/visualsSystems/skyboxSystems"
import { MissionSelectRetroScreen } from "../../missionSelectScene/missionSelectRetroScreen"
import { Mission } from "../../../data/missions/missionData"
import { ShipCustomizerRetroScreen } from "../../shipCustomizer/shipCustomizerRetroScreen"

export class InstantActionSetupScene implements GameScene, IDisposable {
  missionSelectScreen: MissionSelectRetroScreen
  shipSelectScreen: ShipSelectionScreen
  shipCustomizationScreen: ShipCustomizerRetroScreen

  shipModels: { [name: string]: Entity } = {}

  campaignEntity: Entity

  meshedSystem: MeshedSystem
  skyboxSystems: SkyboxSystems

  constructor(skyboxSystems: SkyboxSystems) {
    this.skyboxSystems = skyboxSystems
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
    this.clearShipModels()
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
      console.log("removing", entity)
      debugger
    })
    this.missionSelectScreen = new MissionSelectRetroScreen([
      generateMission(20),
      generateMission(40),
      generateMission(60),
    ])
    this.missionSelectScreen.onDone = (mission) => this.missionSelected(mission)
    this.runLoop = this.missionSelectLoop
  }

  missionSelected(mission: Mission) {
    console.log("mission selected")
    if (mission) {
      this.missionSelectScreen.dispose()
      this.campaignEntity.campaign.currentMission = mission
      console.log("[Instance Action Setup] selected mission: ", this.campaignEntity.campaign.currentMission)

      this.setupShipSelect()

      queueMicrotask(() => {
        this.runLoop = this.shipSelectLoop
      })
    }
  }

  setupShipSelect() {
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
  }

  shipSelected(ship: ShipTemplate) {
    ship = structuredClone(ship)

    this.setupShipCustomization(ship)
    this.shipSelectScreen.dispose()
    this.shipSelectScreen = undefined

    this.clearShipModels()

    this.runLoop = this.shipCustomizerLoop
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

  runLoop = (_delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    scene.render()
  }

  missionSelectLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.missionSelectScreen.updateScreen(delta)
    scene.render()
  }

  shipSelectLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.shipSelectScreen.updateScreen(delta)
    scene.render()
  }

  shipCustomizerLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.shipCustomizationScreen.updateScreen(delta)
    scene.render()
  }
}
