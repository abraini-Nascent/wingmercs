import { queries, world } from "../../world"
import { CommunicationsOptions } from "../ai/communications";

/**
 * 
 * @param dt delta time in milliseconds
 */
export function commsCommandSystem(dt: number) {
  for (const entity of queries.commsCommand) {
    const { commsCommand } = entity;
    if (!commsCommand.open || commsCommand.option == undefined) {
      queueMicrotask(() => world.removeComponent(entity, "commsCommand"))
      continue
    }
    const options = CommunicationsOptions(entity)
    const selectedOption = options[commsCommand.option]
    if (selectedOption != undefined) {
      selectedOption.action()
    }
    queueMicrotask(() => world.removeComponent(entity, "commsCommand"))
  }
}