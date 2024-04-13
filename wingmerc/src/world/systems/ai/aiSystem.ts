import { queries } from "../../world"
import { basicCombatAI } from './basicCombatAI';
import { demoLeaderAI } from './demoLeaderAI';
import { demoWingmanAI } from './demoWingmanAI';
import { deathRattleAI } from './deathRattleAI';
import { shipIntelligence } from "./shipIntelligence";

/**
 * 
 * @param dt delta time in milliseconds
 */
export function aiSystem(dt: number) {
  for (const entity of queries.ai) {
    const { ai } = entity
    // update delta time in blackboard
    ai.blackboard.dt = dt
    switch (ai.type) {
      case "basicCombat":
        basicCombatAI(entity, dt)
        break;
      case "demoLeader":
        demoLeaderAI(entity, dt)
        break;
      case "demoWingman":
        demoWingmanAI(entity, dt)
        break;
      case "shipIntelegence":
        shipIntelligence(entity)
        break;
      case "deathRattle":
        deathRattleAI(entity, dt)
        break;
    }
  }
}
export type AIType = "basicCombat" | "deathRattle" | "demoLeader" | "demoWingman" | "shipIntelegence"

/* 
  Simple AI so we can test guns, weapons, shields, and damage
  the basic ai is to try to fly towards the playerp
*/