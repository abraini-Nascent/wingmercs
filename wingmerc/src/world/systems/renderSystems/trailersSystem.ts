import { Color3, IDisposable, StandardMaterial, TrailMesh, TransformNode } from "@babylonjs/core";
import { AppContainer } from "../../../app.container";
import { queries, world } from "../../world";

let i = 0
/**
 * creates the meshes and transform nodes for trails for an entity based on it's "trail" component
 */
export class TrailersSystem implements IDisposable {
  constructor() {
    queries.trailers.onEntityAdded.subscribe(this.trailersOnEntityAdded)
    queries.trailers.onEntityRemoved.subscribe(this.trailersOnEntityRemoved)
  }
  
  dispose(): void {
    queries.trailers.onEntityAdded.unsubscribe(this.trailersOnEntityAdded)
    queries.trailers.onEntityRemoved.unsubscribe(this.trailersOnEntityRemoved)
  }

  trailersOnEntityAdded = (entity) => {
    let node = entity.node
    let nodeCreated = false
    let disposables: IDisposable[] = []
    if (node == undefined) {
      nodeCreated = true
      node = new TransformNode(`trail-${i}-parent`)
      const { position } = entity
      node.position.x = position.x
      node.position.y = position.y
      node.position.z = position.z
      disposables.push(node)
    }
    const scene = AppContainer.instance.scene
    let trails: TrailMesh[] = []
    for (const trailOption of entity.trailOptions) {
      let trailNode = node
      if (trailOption.start) {
        trailNode = new TransformNode(`trail-${i}-transform`)
        trailNode.position.x = trailOption.start.x
        trailNode.position.y = trailOption.start.y
        trailNode.position.z = trailOption.start.z
        trailNode.parent = node
        if (!nodeCreated) {
          disposables.push(trailNode)
        }
      }
      const width = trailOption?.width ?? 0.2
      const length = trailOption?.length ?? 100
      const color = trailOption?.color ? new Color3(trailOption?.color.r, trailOption?.color.g, trailOption?.color.b) : Color3.Blue()
      const newTrail = new TrailMesh(`trail-${i}`, trailNode, scene, width, length, false)
      disposables.push(newTrail)
      setTimeout(() => { newTrail.start() }, 16)
      const entityMaterial = new StandardMaterial(`trailMat-${i}`)
      entityMaterial.emissiveColor = color.clone()
      entityMaterial.diffuseColor = color.clone()
      entityMaterial.specularColor = Color3.Black()
      newTrail.material = entityMaterial
      disposables.push(entityMaterial)
      trails.push(newTrail)
    }
    world.update(entity, {
      trailMeshs: {trails, disposables},
      node
    })
    i += 1
  }

  trailersOnEntityRemoved = (entity) => {
    if (entity.trailMeshs != undefined && entity.trailMeshs.disposables.length > 0) {
      for (const disposable of entity.trailMeshs.disposables) {
          disposable.dispose()
      }
      queueMicrotask(() => {
        world.removeComponent(entity, "trailMeshs")
      })
    }
  }
}