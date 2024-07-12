import { IDisposable } from "@babylonjs/core"
import { InterceptorSubscription, interceptEvent } from "../../../app.pipeline"
import { AppContainer } from "../../../app.container"
import { EntityForId, EntityUUID, HitsTracked, queries, world } from "../../world"

const RECENT = 1000
export class HitTrackerSystem implements IDisposable {

  registerHitInterceptor: InterceptorSubscription

  constructor() {
    this.registerHitInterceptor = interceptEvent("registerHit", (input: { victim: EntityUUID, shooter: EntityUUID }) => {
      const victimEntity = EntityForId(input.victim)
      if (victimEntity == undefined) { return input }
      if (victimEntity.hitsTaken == undefined) {
        let hitsTaken = {
          hitCount: 1,
          hitCountRecent: 1,
          hits: [{ victim: input.victim, shooter: input.shooter }],
          recentResetCountdown: RECENT
        } as HitsTracked
        world.addComponent(victimEntity, "hitsTaken", hitsTaken)
      } else {
        victimEntity.hitsTaken.hitCount += 1
        victimEntity.hitsTaken.hitCountRecent += 1
        victimEntity.hitsTaken.hits.push()
        victimEntity.hitsTaken.recentResetCountdown = RECENT
      }
      return input
    })
  }

  update(dt: number) {
    for (let hitTracked of queries.hits) {
      if (hitTracked.hitsTaken.recentResetCountdown == 0) {
        continue
      }
      hitTracked.hitsTaken.recentResetCountdown = Math.max(0, hitTracked.hitsTaken.recentResetCountdown - dt)
      if (hitTracked.hitsTaken.recentResetCountdown == 0) {
        hitTracked.hitsTaken.hitCount = 0
      }
    }
  }

  dispose(): void {
    this.registerHitInterceptor.unsubscribe()
  }
}