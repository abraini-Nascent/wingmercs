import { IDisposable } from "@babylonjs/core";
import { MissileEngineSoundSystem } from "./soundSystems/missileEngineSoundSystem";
import { DeathRattleSystem } from "./deathRattleSystem";
import { UpdatePhysicsSystem } from "./renderSystems/updatePhysicsSystem";
import { WeaponCommandSystem } from "./controlSystems/weaponCommandSystem";
import { MeshedSystem } from "./renderSystems/meshedSystem";
import { TrailersSystem } from "./renderSystems/trailersSystem";
import { AfterburnerSoundSystem } from "./soundSystems/afterburnerSoundSystem";
import { DriftSoundSystem } from "./soundSystems/driftSoundSystem";
import { DriftTrailSystem } from "./renderSystems/driftTrailSystem";
import { AfterburnerTrailsSystem } from "./renderSystems/afterburnerTrailsSystem";
import { SystemsDamagedSpraySystem } from "./renderSystems/systemsDamagedSpraySystem";
import { HitTrackerSystem } from "./weaponsSystems/hitTrackerSystem";
import { TargetBoxesSystem } from "./renderSystems/targetBoxesSystem";
import { gunCooldownSystem } from "./shipSystems/gunCooldownSystem";
import { shieldRechargeSystem } from "./shipSystems/shieldRechargeSystem";
import { powerPlantRechargeSystem } from "./shipSystems/engineRechargeSystem";
import { fuelConsumptionSystem } from "./shipSystems/fuelConsumptionSystem";
import { aiSystem } from "./ai/aiSystem";
import { moveCommandSystem } from "./controlSystems/moveCommandSystem";
import { rotationalVelocitySystem } from "./rotationalVelocitySystem";
import { moveSystem } from "./moveSystem";
import { radarTargetingSystem } from "./shipSystems/radarTargetingSystem";
import { particleSystem } from "./weaponsSystems/particleSystem";
import { missileSteeringSystem } from "./weaponsSystems/missileSteeringSystem";
import { missileTargetingSystem } from "./weaponsSystems/missileTargetingSystem";
import { shieldPulserSystem } from "../damage";
import { combatKeyboardInput } from "./input/combatInput/combatKeyboardInput";
import { CombatControllerInput } from "./input/combatInput/combatControllerInput";

export class CombatSystems implements IDisposable {

  controllerInput = new CombatControllerInput()

  missileEngineSoundSystem = new MissileEngineSoundSystem()
  deathRattleSystem = new DeathRattleSystem()
  updatePhysicsSystem = new UpdatePhysicsSystem()
  weaponCommandSystem = new WeaponCommandSystem()
  meshedSystem = new MeshedSystem()
  trailersSystem = new TrailersSystem()
  afterburnerSoundsSystem = new AfterburnerSoundSystem()
  driftSoundSystem = new DriftSoundSystem()
  driftTrailSystem = new DriftTrailSystem()
  afterburnerTrailsSystem = new AfterburnerTrailsSystem()
  systemsDamagedSpraySystem = new SystemsDamagedSpraySystem()
  hitTrackerSystem = new HitTrackerSystem()
  targetBoxesSystem = new TargetBoxesSystem()

  constructor() {
    
  }

  dispose(): void {
    this.missileEngineSoundSystem.dispose()
    this.deathRattleSystem.dispose()
    this.updatePhysicsSystem.dispose()
    this.weaponCommandSystem.dispose()
    this.meshedSystem.dispose()
    this.trailersSystem.dispose()
    this.afterburnerSoundsSystem.dispose()
    this.driftSoundSystem.dispose()
    this.driftTrailSystem.dispose()
    this.afterburnerTrailsSystem.dispose()
    this.systemsDamagedSpraySystem.dispose()
    this.hitTrackerSystem.dispose()
    this.targetBoxesSystem.dispose()
  }

  update(delta: number) {
    // recharge systems
    gunCooldownSystem(delta)
    shieldRechargeSystem(delta)
    powerPlantRechargeSystem(delta)
    fuelConsumptionSystem(delta)

    // get player input
    combatKeyboardInput(delta)
    this.controllerInput.checkInput(delta)

    // get ai input
    aiSystem(delta)

    // apply input commands
    moveCommandSystem(delta)

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