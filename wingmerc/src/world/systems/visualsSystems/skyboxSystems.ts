import { StarfieldSystem } from "./starfieldSystem"
import { SkyboxPlanetSystem } from "./skyboxPlanetSystem"
import { SkyboxNebulaSystem } from "./skyboxNebulaSystem"
import { IDisposable, Scene } from "@babylonjs/core"

export class SkyboxSystems implements IDisposable {
  skyboxNebulaSystem: SkyboxNebulaSystem
  skyboxPlanetSystem: SkyboxPlanetSystem
  starfieldSystem: StarfieldSystem

  constructor(scene: Scene) {
    this.skyboxNebulaSystem = new SkyboxNebulaSystem(scene)
    this.skyboxPlanetSystem = new SkyboxPlanetSystem()
    this.starfieldSystem = new StarfieldSystem(scene)
  }

  dispose() {
    this.skyboxNebulaSystem.dispose()
    this.skyboxPlanetSystem.dispose()
    this.starfieldSystem.dispose()
  }

  update(dt: number) {
    this.skyboxNebulaSystem.update(dt)
  }
}
