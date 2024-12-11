import { MeshedSystem } from "./../world/systems/renderSystems/meshedSystem"
import { Entity, NerdStats, Score, world } from "../world/world"
import { net } from "../world/systems/netSystems/net"
import { Dirk } from "../data/ships"
import { createCustomShip } from "../world/factories"
import { ShipTemplate } from "../data/ships/shipTemplate"
import { generateUUIDv4 } from "../utils/random"
import { Vector3 } from "@babylonjs/core"
import { MercStorage } from "../utils/storage"

export const Player_Name_Key = "merc_playerName"
export class PlayerAgent {
  playerEntity: Entity
  static _playerName: string = "Player"
  static get playerName(): string {
    return PlayerAgent._playerName
  }
  static set playerName(value: string) {
    MercStorage.instance.setValue(Player_Name_Key, value)
    PlayerAgent._playerName = value
  }
  static playerId: string = generateUUIDv4()

  constructor(private planeTemplate?: ShipTemplate, x: number = 0, y: number = 0, z: number = 0) {
    this.createPlayerShip(x, y, z)
  }

  revivePlayer() {
    this.restorePlayerShip()
  }

  restorePlayerShip() {
    const shipTemplate = this.planeTemplate ?? Dirk
    this.playerEntity.health = {
      current: shipTemplate.structure.core.health,
      base: shipTemplate.structure.core.health,
    }
    this.playerEntity.systems.state = { ...this.playerEntity.systems.base }
    this.playerEntity.armor.back = shipTemplate.structure.back.armor
    this.playerEntity.armor.front = shipTemplate.structure.front.armor
    this.playerEntity.armor.left = shipTemplate.structure.left.armor
    this.playerEntity.armor.right = shipTemplate.structure.right.armor
    this.playerEntity.shields.currentAft = this.playerEntity.shields.maxAft
    this.playerEntity.shields.currentFore = this.playerEntity.shields.maxFore
    this.playerEntity.weapons.mounts.forEach((mount, index) => {
      mount.count = mount.baseCount
    })
    if (this.playerEntity.gunAmmo != undefined) {
      Object.keys(this.playerEntity.gunAmmo).forEach((ammoType) => {
        this.playerEntity.gunAmmo[ammoType].current = this.playerEntity.gunAmmo[ammoType].base
      })
    }
  }

  private createPlayerShip(x: number = 0, y: number = 0, z: number = 0) {
    // use the factory to create the player ship
    let ship = this.planeTemplate ?? Dirk
    // add player specific components
    const stats: NerdStats = {
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
    }

    const playerEntity = createCustomShip(ship, x, y, z, 1, 1, true, {
      nerdStats: stats,
      targetName: PlayerAgent.playerName,
      local: true,
      owner: net.id,
      playerId: PlayerAgent.playerId,
      totalScore: 0,
      // visible: false,
      floatingOrigin: true,
      camera: "cockpit",
      linemeshName: ship.modelDetails.base,
      cameraDirection: Vector3.Forward(),
      cameraMovement: { x: 0, y: 0 },
      // setSpeed: 0,
      score: { livesLeft: 0, timeLeft: 0, total: 0 } as Score,
      vduState: {
        left: "weapons",
        right: "target",
      },
      isTargetable: "player",
      meshName: null,
    } as Partial<Entity>)

    // MeshedSystem.addEntityMesh(playerEntity, ship.modelDetails.base)
    MeshedSystem.addLineMesh(playerEntity, ship.modelDetails.base, playerEntity.node)
    MeshedSystem.addShieldMesh(playerEntity, ship.modelDetails.shield, playerEntity.node)
    // MeshedSystem.addCockpitMesh(playerEntity, ship.modelDetails.cockpit, playerEntity.node)
    // MeshedSystem.addWireframeMesh(playerEntity, ship.modelDetails.base, playerEntity.node)

    // world.addComponent(ship, "nerdStats", stats)
    // world.addComponent(ship, "targetName", "player")
    // world.addComponent(ship, "local", true)
    // world.addComponent(ship, "owner", net.id)
    // world.addComponent(ship, "totalScore", 0)
    // world.addComponent(ship, "score", { livesLeft: 0, timeLeft: 0, total: 0 } as Score)
    // world.addComponent(ship, "playerId", net.id)
    // world.update(playerEntity, {
    //   nerdStats: stats,
    //   targetName: PlayerAgent.playerName,
    //   local: true,
    //   owner: net.id,
    //   playerId: PlayerAgent.playerId,
    //   totalScore: 0,
    //   visible: false,
    //   floatingOrigin: true,
    //   camera: "cockpit",
    //   linemeshName: playerEntity.meshName,
    //   cameraDirection: Vector3.Forward(),
    //   cameraMovement: { x: 0, y: 0 },
    //   // setSpeed: 0,
    //   score: { livesLeft: 0, timeLeft: 0, total: 0 } as Score,
    //   vduState: {
    //     left: "weapons",
    //     right: "target",
    //   },
    //   isTargetable: "player",
    // } as Partial<Entity>)

    // remove ai components
    world.removeComponent(playerEntity, "ai") // do friendly ai wingmen need to player to have this?

    this.playerEntity = playerEntity
  }
}

if (MercStorage.instance.isLocalStorageAvailable()) {
  PlayerAgent._playerName = MercStorage.instance.getValue(Player_Name_Key)
  console.log("[Player Agent] player name", PlayerAgent._playerName)
}
