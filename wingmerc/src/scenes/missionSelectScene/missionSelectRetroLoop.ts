import { SkyboxSystems } from "../../world/systems/visualsSystems/skyboxSystems"
import { GameScene } from "../gameScene"
import { AppContainer } from "../../app.container"
import { generateMission } from "../../world/missionFactory"
import { CreateEntity, Entity, NerdStats, queries, world } from "../../world/world"
import { Broadsword, Dirk, Epee, Rapier, Saber } from "../../data/ships"
import { MissionSelectRetroScreen } from "./missionSelectRetroScreen"

const divFps = document.getElementById("fps")
const radius = 5000
export class MissionSelectRetroScene implements GameScene {
  screen: MissionSelectRetroScreen
  campaignEntity: Entity
  skyboxSystems: SkyboxSystems

  constructor() {
    const appContainer = AppContainer.instance
    if (queries.campaign.first) {
      world.remove(queries.campaign.first)
    }
    this.skyboxSystems = new SkyboxSystems(appContainer.scene)
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
    this.screen = new MissionSelectRetroScreen([generateMission(20), generateMission(40), generateMission(60)])
    this.screen.onDone = () => {
      if (this.screen.activeMission.getValue()) {
        this.campaignEntity.campaign.currentMission = this.screen.activeMission.getValue()
      }
    }
  }

  dispose() {
    this.screen.dispose()
  }

  runLoop = (delta: number) => {
    const appContainer = AppContainer.instance
    const engine = AppContainer.instance.engine
    const scene = AppContainer.instance.scene
    this.skyboxSystems.update(delta)
    this.screen.updateScreen(delta)
    scene.render()
    divFps.innerHTML = engine.getFps().toFixed() + " fps"
  }
}
