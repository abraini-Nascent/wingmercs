import { debugLog } from "./../../utils/debugLog"
import { MissionHazardSystem } from "./missionSystems/missionHazards"
import { IDisposable } from "@babylonjs/core"
import { MissileEngineSoundSystem } from "./soundSystems/missileEngineSoundSystem"
import { DeathRattleSystem } from "./deathRattleSystem"
import { UpdatePhysicsSystem } from "./renderSystems/updatePhysicsSystem"
import { MeshedSystem } from "./renderSystems/meshedSystem"
import { TrailersSystem } from "./renderSystems/trailersSystem"
import { AfterburnerSoundSystem } from "./soundSystems/afterburnerSoundSystem"
import { DriftSoundSystem } from "./soundSystems/driftSoundSystem"
import { DriftTrailSystem } from "./renderSystems/driftTrailSystem"
import { AfterburnerTrailsSystem } from "./renderSystems/afterburnerTrailsSystem"
import { SystemsDamagedSpraySystem } from "./renderSystems/systemsDamagedSpraySystem"
import { HitTrackerSystem } from "./weaponsSystems/hitTrackerSystem"
import { TargetBoxesSystem } from "./renderSystems/targetBoxesSystem"
import { gunCooldownSystem } from "./shipSystems/gunCooldownSystem"
import { shieldRechargeSystem } from "./shipSystems/shieldRechargeSystem"
import { powerPlantRechargeSystem } from "./shipSystems/engineRechargeSystem"
import { fuelConsumptionSystem } from "./shipSystems/fuelConsumptionSystem"
import { aiSystem } from "./ai/aiSystem"
import { moveCommandSystem } from "./controlSystems/moveCommandSystem"
import { rotationalVelocitySystem } from "./rotationalVelocitySystem"
import { moveSystem } from "./moveSystem"
import { radarTargetingSystem } from "./shipSystems/radarTargetingSystem"
import { particleSystem } from "./weaponsSystems/particleSystem"
import { missileSteeringSystem } from "./weaponsSystems/missileSteeringSystem"
import { missileTargetingSystem } from "./weaponsSystems/missileTargetingSystem"
import { shieldPulserSystem } from "../damage"
import { combatKeyboardInput } from "./input/combatInput/combatKeyboardInput"
import { CombatControllerInput } from "./input/combatInput/combatControllerInput"
import { shipLandingSystem } from "./shipSystems/shipLandingSystem"
import { CombatXRControllerInput } from "./input/combatInput/combatXRControllerInput"
import { weaponCommandSystem } from "./controlSystems/weaponCommandSystem"
import { commsCommandSystem } from "./controlSystems/commsCommandSystem"
import { MotionHands } from "./input/vr/motionHands"
import { ObstacleDamageSystem } from "./weaponsSystems/obstacleDamageSystem"

export class CombatSystems implements IDisposable {
  controllerInput = new CombatControllerInput()
  xrControllerInput = new CombatXRControllerInput()
  handsSystem = new MotionHands()

  missionHazardSystem = new MissionHazardSystem()
  missileEngineSoundSystem = new MissileEngineSoundSystem()
  deathRattleSystem = new DeathRattleSystem()
  updatePhysicsSystem = new UpdatePhysicsSystem()
  meshedSystem = new MeshedSystem()
  trailersSystem = new TrailersSystem()
  obstacleDamageSystem = new ObstacleDamageSystem()
  afterburnerSoundsSystem = new AfterburnerSoundSystem()
  driftSoundSystem = new DriftSoundSystem()
  driftTrailSystem = new DriftTrailSystem()
  afterburnerTrailsSystem = new AfterburnerTrailsSystem()
  systemsDamagedSpraySystem = new SystemsDamagedSpraySystem()
  hitTrackerSystem = new HitTrackerSystem()
  targetBoxesSystem = new TargetBoxesSystem()

  constructor() {
    debugLog("[CombatSystem] constructed")
  }

  dispose(): void {
    debugLog("[CombatSystem] disposed")
    this.missionHazardSystem.dispose()
    this.missileEngineSoundSystem.dispose()
    this.deathRattleSystem.dispose()
    this.updatePhysicsSystem.dispose()
    this.meshedSystem.dispose()
    this.trailersSystem.dispose()
    this.obstacleDamageSystem.dispose()
    this.afterburnerSoundsSystem.dispose()
    this.driftSoundSystem.dispose()
    this.driftTrailSystem.dispose()
    this.afterburnerTrailsSystem.dispose()
    this.systemsDamagedSpraySystem.dispose()
    this.hitTrackerSystem.dispose()
    this.targetBoxesSystem.dispose()
    this.xrControllerInput.dispose()
    this.handsSystem.dispose()
  }

  update(delta: number) {
    // environment systems
    this.missionHazardSystem.update(delta)

    // recharge systems
    gunCooldownSystem(delta)
    shieldRechargeSystem(delta)
    powerPlantRechargeSystem(delta)
    fuelConsumptionSystem(delta)
    commsCommandSystem(delta)
    shipLandingSystem(delta)

    // get player input
    combatKeyboardInput(delta)
    this.controllerInput.checkInput(delta)
    this.xrControllerInput.update()
    this.handsSystem.update(delta)

    // get ai input
    aiSystem(delta)

    // apply input commands
    moveCommandSystem(delta)
    weaponCommandSystem()

    // update world
    rotationalVelocitySystem()
    moveSystem(delta)
    radarTargetingSystem(delta)
    particleSystem()
    missileSteeringSystem(delta)
    missileTargetingSystem(delta)
    this.hitTrackerSystem.update(delta)
    shieldPulserSystem.update(delta)
  }
}
