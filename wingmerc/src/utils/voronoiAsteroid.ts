import { Color3, CSG, Mesh, MeshBuilder, Space, StandardMaterial, Vector3, VertexData } from "@babylonjs/core"
import voronoiDiagram from "voronoi-diagram"
import hull from "convex-hull"
import { pointInSphere } from "./math"
import * as SimplexNoise from "simplex-noise"

export async function generateVoronoiAsteroid(seeds, iterations, radius) {
  // Start with an icosphere
  const baseMesh = MeshBuilder.CreateIcoSphere("icosphere", { subdivisions: 4, radius })

  let finalAsteroidCSG = CSG.FromMesh(baseMesh)

  for (let i = 0; i < iterations; i++) {
    // Generate Voronoi cells from seeds
    const voronoiCells = generateVoronoiCells(seeds)

    // Remove outer fractures and apply translations
    const innerCells = voronoiCells.filter((cell) => cell.centroid.length() < radius * 0.9)
    innerCells.forEach((cell) => {
      const translation = new Vector3(
        Math.random() * 0.1 - 0.05,
        Math.random() * 0.1 - 0.05,
        Math.random() * 0.1 - 0.05
      )
      cell.translate(translation, Space.LOCAL)
    })

    // Merge the cells into a final asteroid
    innerCells.forEach((cell) => {
      const cellCSG = CSG.FromMesh(cell)
      finalAsteroidCSG = finalAsteroidCSG.union(cellCSG)
    })
  }

  const asteroidMesh = finalAsteroidCSG.toMesh("asteroid", null, null)
  return asteroidMesh
}

export function generateVoronoiSeeds(numSeeds: number, radius: number): Vector3[] {
  const seeds = []
  for (let i = 0; i < numSeeds; i++) {
    // const randomPoint = pointInSphere(radius)
    const randomPoint = pointInSphere(radius)
    seeds.push(randomPoint)
  }
  return seeds
}

export function generateVoronoiCells(seeds) {
  let mat = new StandardMaterial("cell")
  mat.wireframe = true
  mat.emissiveColor = Color3.White()
  const pointsArray = seeds.map((p) => [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)])
  const voronoi = voronoiDiagram(pointsArray)
  const positionsList = []
  const meshes = voronoi.cells.reduce((acc, cell) => {
    const positions = cell.reduce((acc, v) => {
      if (v == -1) {
        return acc
      }
      // acc.push(new Vector3(voronoi.positions[v][0], voronoi.positions[v][1], voronoi.positions[v][2]))
      acc.push([voronoi.positions[v][0], voronoi.positions[v][1], voronoi.positions[v][2]])
      return acc
    }, [])
    if (positions.length == 0) {
      return acc
    }
    positionsList.push(positions)

    // Use Babylon.js Convex Hull generation
    // Generate the convex hull
    const hullFaces = hull(positions)

    // Convert hull faces into Babylon.js compatible data
    const vertexData = new VertexData()
    vertexData.positions = positions.flat()
    vertexData.indices = hullFaces.flat().reverse()

    const mesh = new Mesh("asteroid cell")
    mesh.material = mat
    vertexData.applyToMesh(mesh)
    acc.push(mesh)
    return acc
  }, [])
  meshes.positions = positionsList
  return meshes
}

// Helper function to triangulate a lexicographically sorted cell
function triangulateLexicographically(vertices: Vector3[]): number[] {
  const indices: number[] = []
  for (let i = 1; i < vertices.length - 1; i++) {
    indices.push(0, i, i + 1) // Simple fan triangulation
  }
  return indices
}

export function generateNoiseAsteroid(points: Vector3[]): Mesh {
  const positions = points.map((p) => [p.x, p.y, p.z]).flat()
  const hullFaces = hull(points.map((p) => [p.x, p.y, p.z])) // Convex hull faces

  const indices = hullFaces.flat().reverse()
  const vertexData = new VertexData()
  vertexData.positions = positions
  vertexData.indices = indices

  const mesh = new Mesh("asteroid")
  vertexData.applyToMesh(mesh)
  return mesh
}

// Generate random clusters of points using noise
export function generateClusteredPoints(numPoints: number, radius: number): Vector3[] {
  const noise3D = SimplexNoise.createNoise3D()
  const points: Vector3[] = []

  for (let i = 0; i < numPoints; i++) {
    const theta = Math.random() * 2 * Math.PI // Angle around the sphere
    const phi = Math.acos(2 * Math.random() - 1) // Polar angle

    const baseX = Math.sin(phi) * Math.cos(theta)
    const baseY = Math.sin(phi) * Math.sin(theta)
    const baseZ = Math.cos(phi)

    // Perturb point with noise
    const scale = 1 + noise3D(baseX, baseY, baseZ) * 0.5 // Adjust the range as needed
    points.push(new Vector3(baseX * radius * scale, baseY * radius * scale, baseZ * radius * scale))
  }

  return points
}
