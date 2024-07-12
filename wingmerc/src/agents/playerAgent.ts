import { Entity, FuelTank, NerdStats, Score, ShipArmor, ShipGuns, ShipShields, ShipSystems, world } from "../world/world";
import { net } from "../world/systems/netSystems/net";
import { Dirk } from "../data/ships";
import * as Guns from "../data/guns";
import { Gun } from "../data/guns/gun";
import { createCustomShip } from "../world/factories";
import { ShipTemplate } from "../data/ships/shipTemplate";

export class PlayerAgent {
  playerEntity: Entity
  static playerName: string = "Player"

  constructor(planeTemplate?: ShipTemplate) {

    // use the factory to create the player ship
    let ship = planeTemplate ?? Dirk
    const playerEntity = createCustomShip(ship, 0, 0, 0, 1, 1)
    
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
      totalKills: 0
    }
    // world.addComponent(ship, "nerdStats", stats)
    // world.addComponent(ship, "targetName", "player")
    // world.addComponent(ship, "local", true)
    // world.addComponent(ship, "owner", net.id)
    // world.addComponent(ship, "totalScore", 0)
    // world.addComponent(ship, "score", { livesLeft: 0, timeLeft: 0, total: 0 } as Score)
    // world.addComponent(ship, "playerId", net.id)
    world.update(playerEntity, {
      nerdStats: stats,
      targetName: PlayerAgent.playerName,
      local: true,
      owner: net.id,
      totalScore: 0,
      visible: false,
      score: { livesLeft: 0, timeLeft: 0, total: 0 } as Score,
      vduState: {
        left: "weapons",
        right: "target"
      },
      isTargetable: "player",
    })

    // remove ai components
    world.removeComponent(playerEntity, "ai") // do friendly ai wingmen need to player to have this?
    
    this.playerEntity = playerEntity
  }
}