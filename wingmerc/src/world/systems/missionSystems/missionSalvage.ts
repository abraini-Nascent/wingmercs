import { PowerPlantModifierDetails, StructureSections } from "./../../../data/ships/shipTemplate"
import { SalvageClaims } from "./../../world"
import { IDisposable } from "@babylonjs/core"
import { Entity, queries } from "../../world"
import { AppContainer } from "../../../app.container"
import { debugLog } from "../../../utils/debuglog"
import { debugDir } from "../../../utils/debugDir"

export class MissionSalvageSystem implements IDisposable {
  unsubscribeDeathComesSubsction: () => void

  constructor() {
    this.unsubscribeDeathComesSubsction = queries.deathComes.onEntityAdded.subscribe(this.deadShip)
  }

  dispose(): void {
    if (this.unsubscribeDeathComesSubsction) {
      this.unsubscribeDeathComesSubsction()
      this.unsubscribeDeathComesSubsction = undefined
    }
  }

  deadShip = (entity: Entity) => {
    const playerEntity = AppContainer.instance.player.playerEntity
    if (playerEntity == undefined) {
      // nothing to do if there is no player
      return
    }
    if (entity.id == playerEntity.id) {
      // nothing to do if the player dies
      return
    }
    const salvageClaims = playerEntity.salvageClaims
    if (salvageClaims == undefined) {
      // nothing to do if we aren't tracking claims
      return
    }
    // itterate through components, weapons, and guns and see if we have any left to add to claims
    Object.values(entity.guns.mounts).forEach((mount) => {
      if (mount.currentHealth <= 0) {
        return
      }
      salvageClaims.guns.push({
        ammo: mount.ammo,
        class: mount.class,
        currentHealth: mount.currentHealth,
        modifier: mount.modifier,
        name: mount.name,
        stats: mount.stats,
      })
    })

    Object.values(entity.weapons.mounts).forEach((mount) => {
      for (let i = 0; i > mount.count; i++) {
        salvageClaims.weapons.push({
          type: mount.type,
        })
      }
    })

    for (const modifier of entity.shipModifiers) {
      let location: StructureSections = "core"
      let health = 15
      switch (modifier.type) {
        case "Engine": {
          location = entity.engine.location
          health = entity.systems.state.engines
          break
        }
        case "Afterburner": {
          location = entity.thrusters.location
          health = entity.systems.state.afterburners
          break
        }
        case "Thruster": {
          location = entity.thrusters.location
          health = entity.systems.state.thrusters
          break
        }
        case "PowerPlant": {
          location = entity.powerPlant.location
          health = entity.systems.state.power
          break
        }
        case "Shields": {
          location = entity.shields.location
          health = entity.systems.state.shield
        }
      }
      if (health > 0 && (location == "core" || (entity.armor[location] != undefined && entity.armor[location] > 0))) {
        salvageClaims.shipParts.push({ health, modifier })
      }
    }

    // how much of the hull is left?
    if (entity.armor.back > 0 || entity.armor.left > 0 || entity.armor.front || entity.armor.right) {
      const hull = {
        shipClass: entity.planeTemplate,
        front: entity.armor.front > 0,
        back: entity.armor.back > 0,
        left: entity.armor.left > 0,
        right: entity.armor.right > 0,
      }
      salvageClaims.hulls.push(hull)
    }

    debugLog("[mission salvage] new salvage")
    debugDir(salvageClaims)
  }
}
