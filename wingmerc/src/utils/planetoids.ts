import {
  Color3,
  Color4,
  CSG,
  IDisposable,
  Matrix,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  VertexBuffer,
} from "@babylonjs/core"
import { pointOnSphere } from "./math"

export class Planetoids implements IDisposable {
  planet: Mesh
  ocean: Mesh
  atmo: Mesh

  constructor(options: { atmosphere?: true; ocean?: true; rings?: true }) {
    const { atmosphere, ocean, rings } = options

    this.planet = this.planetSphere(0)
    this.planet.isPickable = false

    if (ocean) {
      this.ocean = this.planetSphere()
      this.ocean.isPickable = false
      let csgIonosphere1 = CSG.FromMesh(this.planet)
      let csgIonosphere2 = CSG.FromMesh(this.ocean)
      let subtractedOcean = csgIonosphere2.subtract(csgIonosphere1)
      let subtractedPlanet = csgIonosphere1.subtract(csgIonosphere2)

      // Convert the result back to a Babylon.js mesh
      let newOcean = subtractedOcean.toMesh("resultingMesh", this.ocean.material)
      this.ocean.dispose()
      this.ocean = newOcean
      this.ocean.isPickable = false
      let newPlanet = subtractedPlanet.toMesh("resultingMesh", this.planet.material)
      this.planet.dispose()
      this.planet = newPlanet
      this.planet.isPickable = false
      // this.ocean.visibility = 0
    }

    // random point
    pointOnSphere(9000, Matrix.Identity(), this.planet.position)
    this.planet.infiniteDistance = true
    if (ocean) {
      this.ocean.position.copyFrom(this.planet.position)
      this.ocean.infiniteDistance = true
    }
  }

  dispose(): void {
    this.planet.dispose(false, true)
    if (this.atmo) {
      this.atmo.dispose(false, true)
    }
    if (this.ocean) {
      this.ocean.dispose(false, true)
    }
  }

  private planetSphere(zOffset: number = 0): Mesh {
    const sphere = MeshBuilder.CreateIcoSphere("geodesicSphere", { radius: 2, subdivisions: 4 })

    let positions = sphere.getVerticesData(VertexBuffer.PositionKind)
    const vertexCount = positions.length / 3

    // Use a map to keep track of displaced positions
    const displacedVertices = new Map<string, Vector3>()

    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3]
      const y = positions[i * 3 + 1]
      const z = positions[i * 3 + 2]

      // Create a key based on the original vertex position
      const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`

      let displacedVertex
      if (displacedVertices.has(key)) {
        // If this position has already been displaced, reuse the same displacement
        displacedVertex = displacedVertices.get(key)
      } else {
        // Displace the vertex and store the displacement
        const displacementFactor = 0.15 // Example displacement factor
        displacedVertex = new Vector3(
          x + (Math.random() - 0.5) * displacementFactor,
          y + (Math.random() - 0.5) * displacementFactor,
          z + (Math.random() - 0.5) * displacementFactor
        )
        displacedVertices.set(key, displacedVertex)
      }

      // Update each vertex's position
      positions[i * 3] = displacedVertex.x
      positions[i * 3 + 1] = displacedVertex.y
      positions[i * 3 + 2] = displacedVertex.z
    }

    // Update the mesh with the displaced vertices
    sphere.updateVerticesData(VertexBuffer.PositionKind, positions)
    sphere.convertToFlatShadedMesh()
    sphere.scaling.setAll(500)

    const color = new Color4(Math.random(), Math.random(), Math.random(), 1.0)
    const displacementFactor = 0.15
    const colors = []
    for (let i = 0; i < positions.length; i += 3) {
      const vcolor = new Color4(
        color.r + (Math.random() - 0.5) * displacementFactor,
        color.g + (Math.random() - 0.5) * displacementFactor,
        color.b + (Math.random() - 0.5) * displacementFactor,
        1.0
      )
      colors.push(vcolor.r, vcolor.g, vcolor.b, vcolor.a)
      colors.push(vcolor.r, vcolor.g, vcolor.b, vcolor.a)
      colors.push(vcolor.r, vcolor.g, vcolor.b, vcolor.a)
    }

    sphere.setVerticesData(VertexBuffer.ColorKind, colors)
    const material = new StandardMaterial("planetoidMaterial")
    material.diffuseColor = new Color3(1, 1, 1) // White to allow vertex colors to show through
    material.specularColor = Color3.Black()
    material.zOffset = zOffset
    sphere.material = material
    return sphere
  }
}
