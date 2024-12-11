/**
 * from: https://playground.babylonjs.com/#BVFJEB
 * created by: https://forum.babylonjs.com/u/Leon
 * from the forum thread: https://forum.babylonjs.com/t/is-greaselines-more-performant-than-edgerenderer/49722/7
 * modifications by ABraini to make the code reusable across multiple models
 */

import * as BABYLON from "@babylonjs/core"

class Triangle {
  a: BABYLON.Vector3
  b: BABYLON.Vector3
  c: BABYLON.Vector3

  constructor(
    a: BABYLON.Vector3 = BABYLON.Vector3.Zero(),
    b: BABYLON.Vector3 = BABYLON.Vector3.Zero(),
    c: BABYLON.Vector3 = BABYLON.Vector3.Zero()
  ) {
    this.a = a
    this.b = b
    this.c = c
  }

  // Add methods as needed, for example:
  normalToRef(normal: BABYLON.Vector3) {
    const edge1 = this.b.subtract(this.a)
    const edge2 = this.c.subtract(this.a)
    BABYLON.Vector3.CrossToRef(edge1, edge2, normal)
    BABYLON.Vector3.NormalizeToRef(normal, normal)
  }
}

const _v0 = new BABYLON.Vector3()
const _v1 = new BABYLON.Vector3()
const _normal = new BABYLON.Vector3()
const _triangle = new Triangle()

export class GreasedLineModel {
  static fromMesh(
    mesh: BABYLON.AbstractMesh,
    { thresholdAngle = 10, color = "#ffffff" }: { thresholdAngle: number; color: string }
  ) {
    const edgeData = this.calculateEdges(mesh, thresholdAngle)
    const edges = BABYLON.CreateGreasedLine(
      "edges",
      {
        points: edgeData,
        updatable: false,
      },
      {
        materialType: BABYLON.GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE,
        color: BABYLON.Color3.FromHexString(color),
        cameraFacing: true,
        sizeAttenuation: true,
        width: 5,
      }
    )
    // set parent to mesh, so that inverted scaling of __root__ is taken into account, otherwise it won't fit
    // edges.parent = mesh

    // disable backface culling of edges, or else edges get hidden
    edges.material.backFaceCulling = false

    // remove mesh from scene, leaving only edges, if you wanna try
    // mesh.dispose()
    return edges
  }
  // My port of three.js EdgesGeometry class, made as an functional helper instead
  // https://github.com/mrdoob/three.js/blob/2f55b3553be988ca7666896e300557957b534a45/src/geometries/EdgesGeometry.js
  private static calculateEdges(mesh: BABYLON.AbstractMesh, thresholdAngle = 10) {
    console.time("calculateEdges")
    const precisionPoints = 4
    const precision = Math.pow(10, precisionPoints)
    const thresholdDot = Math.cos(BABYLON.Angle.FromDegrees(thresholdAngle).radians())

    const indexAttr = mesh.getIndices()!
    const indexCount = mesh.getTotalIndices()

    const indexArr = [0, 0, 0]
    const vertKeys = ["a", "b", "c"] as const
    const hashes = new Array(3)

    const edgeData: Record<string, { index0: number; index1: number; normal: BABYLON.Vector3 } | null> = {}
    const vertices: [number, number, number, number, number, number][] = []

    const positionAttr = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)!

    for (let i = 0; i < indexCount; i += 3) {
      const indexA = indexAttr[i] * 3
      const indexB = indexAttr[i + 1] * 3
      const indexC = indexAttr[i + 2] * 3

      const { a, b, c } = _triangle
      a.copyFromFloats(positionAttr[indexA], positionAttr[indexA + 1], positionAttr[indexA + 2])
      b.copyFromFloats(positionAttr[indexB], positionAttr[indexB + 1], positionAttr[indexB + 2])
      c.copyFromFloats(positionAttr[indexC], positionAttr[indexC + 1], positionAttr[indexC + 2])

      _triangle.normalToRef(_normal)

      // create hashes for the edge from the vertices
      hashes[0] = `${Math.round(a.x * precision)},${Math.round(a.y * precision)},${Math.round(a.z * precision)}`
      hashes[1] = `${Math.round(b.x * precision)},${Math.round(b.y * precision)},${Math.round(b.z * precision)}`
      hashes[2] = `${Math.round(c.x * precision)},${Math.round(c.y * precision)},${Math.round(c.z * precision)}`

      // skip degenerate triangles
      if (hashes[0] === hashes[1] || hashes[1] === hashes[2] || hashes[2] === hashes[0]) {
        continue
      }

      // iterate over every edge
      for (let j = 0; j < 3; j++) {
        // get the first and next vertex making up the edge
        const jNext = (j + 1) % 3
        const vecHash0 = hashes[j]
        const vecHash1 = hashes[jNext]
        const v0 = _triangle[vertKeys[j]]
        const v1 = _triangle[vertKeys[jNext]]

        const hash = `${vecHash0}_${vecHash1}`
        const reverseHash = `${vecHash1}_${vecHash0}`

        if (reverseHash in edgeData && edgeData[reverseHash]) {
          // if we found a sibling edge add it into the vertex array if
          // it meets the angle threshold and delete the edge from the map.
          if (edgeData[reverseHash]?.normal && _normal.dot(edgeData[reverseHash]!.normal) <= thresholdDot) {
            vertices.push([v0.x, v0.y, v0.z, v1.x, v1.y, v1.z])
          }

          edgeData[reverseHash] = null
        } else if (!(hash in edgeData)) {
          // if we've already got an edge here then skip adding a new one
          edgeData[hash] = {
            index0: indexArr[j],
            index1: indexArr[jNext],
            normal: _normal.clone(),
          }
        }
      }
    }

    // iterate over all remaining, unmatched edges and add them to the vertex array
    for (const key in edgeData) {
      if (edgeData[key]) {
        const { index0, index1 } = edgeData[key]!
        _v0.copyFromFloats(positionAttr[index0], positionAttr[index0 + 1], positionAttr[index0 + 2])
        _v1.copyFromFloats(positionAttr[index1], positionAttr[index1 + 1], positionAttr[index1 + 2])

        vertices.push([_v0.x, _v0.y, _v0.z, _v1.x, _v1.y, _v1.z])
      }
    }

    console.timeEnd("calculateEdges")

    return vertices
  }
}
