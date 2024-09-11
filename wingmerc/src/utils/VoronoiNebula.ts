import {
  Color3,
  IDisposable,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  VertexData,
} from "@babylonjs/core"
import Voronoi from "voronoi"
import earcut from "earcut"
import { geoVoronoi } from "d3-geo-voronoi"
import { randFloat, random } from "./random"

export class VoronoiNebula {
  private scene: Scene
  private voronoi: Voronoi
  private sites: any[]
  private cells: Mesh[]
  private luminanceMap: Map<Mesh, number>
  private animationProgress: number
  private animationSpeed: number

  constructor(
    scene: Scene,
    numCells: number,
    siteMap: (x: number, y: number) => number,
    densityMap: (x: number, y: number) => number
  ) {
    this.scene = scene
    this.voronoi = new Voronoi()
    this.sites = this.generateSites(numCells, siteMap)
    console.log("sites", this.sites)
    this.cells = this.createVoronoiMesh(densityMap)
    this.luminanceMap = new Map()
    this.animationProgress = 0
    this.animationSpeed = 0.001 // Speed of the luminance change

    this.initializeLuminanceMap()
  }

  private generateSites(
    numCells: number,
    densityMap: (x: number, y: number) => number
  ): any[] {
    const sites = []
    const threshold = 0.5 // Threshold to decide if a site should be included
    for (let i = 0; i < numCells; i++) {
      const x = Math.random()
      const y = Math.random()
      const density = Math.abs(densityMap(x, y))
      if (density < threshold) {
        sites.push({ x, y })
      }
    }
    return sites
  }

  private createVoronoiMesh(
    densityMap: (x: number, y: number) => number
  ): Mesh[] {
    const bbox = { xl: 0, xr: 1, yt: 0, yb: 1 }
    const diagram = this.voronoi.compute(this.sites, bbox)
    const cells: Mesh[] = []
    diagram.cells.forEach((cell) => {
      // Remove cells near the edges to create a more organic shape
      if (
        cell.site.x < 0.1 ||
        cell.site.x > 0.9 ||
        cell.site.y < 0.1 ||
        cell.site.y > 0.9
      ) {
        return
      }
      const points = cell.halfedges.map((edge) => {
        return new Vector3(
          edge.getStartpoint().x - cell.site.x,
          0,
          edge.getStartpoint().y - cell.site.y
        )
      })
      console.log(points)

      const mesh = MeshBuilder.CreatePolygon(
        "voronoiCell",
        { shape: points },
        this.scene
      )
      mesh.scaling.setAll(100)
      mesh.bakeCurrentTransformIntoVertices()
      mesh.convertToFlatShadedMesh()
      mesh.material = new StandardMaterial("cellMat", this.scene)
      ;(mesh.material as StandardMaterial).emissiveColor = new Color3(0, 0, 0)
      // Apply density map for coloring
      const densityValue = Math.abs(densityMap(cell.site.x, cell.site.y)) // Ensure no negative values
      const colorFactor = densityValue

      const baseColor = new Color3(0.2, 0.2, 0.5) // Example base color
      ;(mesh.material as StandardMaterial).diffuseColor =
        baseColor.scale(colorFactor)
      ;(mesh.material as StandardMaterial).emissiveColor =
        baseColor.scale(colorFactor)
      mesh.position.x = cell.site.x * 100.5
      mesh.position.z = cell.site.y * 100.5
      cells.push(mesh)
    })

    return cells
  }

  private initializeLuminanceMap(): void {
    this.cells.forEach((cell) => {
      this.luminanceMap.set(cell, 0) // Start with no luminance
    })
  }

  public update(deltaTime: number): void {
    this.animationProgress += deltaTime * this.animationSpeed

    if (this.animationProgress >= 1) {
      this.animateLuminance()
      this.animationProgress = 0
    }

    this.updateLuminance(deltaTime)
  }

  private animateLuminance(): void {
    const randomCell = this.cells[Math.floor(Math.random() * this.cells.length)]
    const baseLuminance = 1 // Peak luminance value for the central cell
    this.luminanceMap.set(randomCell, baseLuminance)

    // Apply falloff to neighboring cells
    this.cells.forEach((cell) => {
      const distance = Vector3.Distance(randomCell.position, cell.position)
      const falloff = Math.max(0, baseLuminance - (distance / 100) * 0.5)
      this.luminanceMap.set(
        cell,
        Math.max(this.luminanceMap.get(cell)!, falloff)
      )
    })
  }

  private updateLuminance(deltaTime: number): void {
    this.luminanceMap.forEach((luminance, cell) => {
      const material = cell.material as StandardMaterial
      const currentLuminance = Math.max(luminance - deltaTime * 0.001, 0)
      this.luminanceMap.set(cell, Math.max(0, currentLuminance))
      if (currentLuminance <= 0) {
        material.emissiveColor = material.diffuseColor.clone()
      } else {
        material.emissiveColor = new Color3(
          material.diffuseColor.r + currentLuminance,
          material.diffuseColor.g + currentLuminance,
          material.diffuseColor.b + currentLuminance
        )
      }
    })
  }
}

export class VoronoiCircleNebula {
  private scene: Scene
  private voronoi: Voronoi
  private sites: any[]
  private cells: Mesh[]
  private luminanceMap: Map<Mesh, number>
  private animationProgress: number
  private animationSpeed: number
  private sphereRadius: number

  constructor(
    scene: Scene,
    numCells: number,
    siteMap: (x: number, y: number) => number,
    densityMap: (x: number, y: number) => number,
    sphereRadius: number = 100
  ) {
    this.scene = scene
    this.voronoi = new Voronoi()
    this.sites = this.generateSites(numCells, siteMap)
    this.sphereRadius = sphereRadius
    this.cells = this.createVoronoiMesh(densityMap)
    this.luminanceMap = new Map()
    this.animationProgress = 0
    this.animationSpeed = 0.001 // Speed of the luminance change

    this.initializeLuminanceMap()
  }

  private generateSites(
    numCells: number,
    densityMap: (x: number, y: number) => number
  ): any[] {
    const sites = []
    const threshold = 0.5 // Threshold to decide if a site should be included
    for (let i = 0; i < numCells; i++) {
      const x = Math.random()
      const y = Math.random()
      const density = Math.abs(densityMap(x, y))
      if (density < threshold) {
        sites.push({ x, y })
      }
    }
    return sites
  }

  private createVoronoiMesh(
    densityMap: (x: number, y: number) => number
  ): Mesh[] {
    const bbox = { xl: 0, xr: 1, yt: 0, yb: 1 }
    const diagram = this.voronoi.compute(this.sites, bbox)
    const cells: Mesh[] = []

    diagram.cells.forEach((cell) => {
      // Remove cells near the edges to create a more organic shape
      // if (
      //   cell.site.x < 0.1 ||
      //   cell.site.x > 0.9 ||
      //   cell.site.y < 0.1 ||
      //   cell.site.y > 0.9
      // ) {
      //   return
      // }
      
      // Convert 2D Voronoi points to 3D spherical coordinates
      const points = cell.halfedges.map((edge) => {
        const p2D = edge.getStartpoint()
        const theta = p2D.x * 2 * Math.PI
        const phi = p2D.y * Math.PI
        const x = this.sphereRadius * Math.sin(phi) * Math.cos(theta)
        const y = ((this.sphereRadius * Math.cos(phi)) - 99) * 100
        const z = this.sphereRadius * Math.sin(phi) * Math.sin(theta)
        return new Vector3(x, y, z)
      })
      
      // Create the mesh and wrap it onto the sphere
      const mesh = MeshBuilder.CreatePolygon(
        "voronoiCell",
        { shape: points, sideOrientation: Mesh.DOUBLESIDE },
        this.scene
      )
      mesh.scaling.setAll(1)
      mesh.bakeCurrentTransformIntoVertices()
      mesh.convertToFlatShadedMesh()
      mesh.material = new StandardMaterial("cellMat", this.scene)
      ;(mesh.material as StandardMaterial).emissiveColor = new Color3(0, 0, 0)
      // Apply density map for coloring
      const densityValue = Math.abs(densityMap(cell.site.x, cell.site.y)) // Ensure no negative values
      const colorFactor = densityValue

      const baseColor = new Color3(0.2, 0.2, 0.5) // Example base color
      ;(mesh.material as StandardMaterial).diffuseColor =
        baseColor.scale(colorFactor)
      ;(mesh.material as StandardMaterial).emissiveColor =
        baseColor.scale(colorFactor)

      cells.push(mesh)
    })

    return cells
  }

  private initializeLuminanceMap(): void {
    this.cells.forEach((cell) => {
      this.luminanceMap.set(cell, 0) // Start with no luminance
    })
  }

  public update(deltaTime: number): void {
    this.animationProgress += deltaTime * this.animationSpeed

    if (this.animationProgress >= 1) {
      this.animateLuminance()
      this.animationProgress = 0
    }

    this.updateLuminance(deltaTime)
  }

  private animateLuminance(): void {
    const randomCell = this.cells[Math.floor(Math.random() * this.cells.length)]
    const baseLuminance = 1 // Peak luminance value for the central cell
    this.luminanceMap.set(randomCell, baseLuminance)

    // Apply falloff to neighboring cells
    this.cells.forEach((cell) => {
      const distance = Vector3.Distance(randomCell.position, cell.position)
      const falloff = Math.max(0, baseLuminance - (distance / this.sphereRadius) * 0.5)
      this.luminanceMap.set(
        cell,
        Math.max(this.luminanceMap.get(cell)!, falloff)
      )
    })
  }

  private updateLuminance(deltaTime: number): void {
    this.luminanceMap.forEach((luminance, cell) => {
      const material = cell.material as StandardMaterial
      const currentLuminance = Math.max(luminance - deltaTime * 0.001, 0)
      this.luminanceMap.set(cell, Math.max(0, currentLuminance))
      if (currentLuminance <= 0) {
        material.emissiveColor = material.diffuseColor.clone()
      } else {
        material.emissiveColor = new Color3(
          material.diffuseColor.r + currentLuminance,
          material.diffuseColor.g + currentLuminance,
          material.diffuseColor.b + currentLuminance
        )
      }
    })
  }
}

export class VoronoiSphereFromPlaneNebula {
  private scene: Scene
  private voronoi: Voronoi
  private sites: any[]
  private cells: Mesh[]
  private luminanceMap: Map<Mesh, number>
  private animationProgress: number
  private animationSpeed: number
  private sphereRadius: number

  constructor(
    scene: Scene,
    numCells: number,
    siteMap: (x: number, y: number) => number,
    densityMap: (x: number, y: number) => number,
    sphereRadius: number = 100
  ) {
    this.scene = scene
    this.voronoi = new Voronoi()
    this.sites = this.generateSites(numCells, siteMap)
    this.sphereRadius = sphereRadius
    this.cells = this.createVoronoiMesh(densityMap)
    this.luminanceMap = new Map()
    this.animationProgress = 0
    this.animationSpeed = 0.001 // Speed of the luminance change

    this.initializeLuminanceMap()
  }

  private generateSites(
    numCells: number,
    densityMap: (x: number, y: number) => number
  ): any[] {
    const sites = []
    const threshold = 0.5 // Threshold to decide if a site should be included
    for (let i = 0; i < numCells; i++) {
      const x = Math.random()
      const y = Math.random()
      const density = Math.abs(densityMap(x, y))
      if (density < threshold) {
        sites.push({ x, y })
      }
    }
    return sites
  }

  private createVoronoiMesh(
    densityMap: (x: number, y: number) => number
  ): Mesh[] {
    const bbox = { xl: 0, xr: 1, yt: 0, yb: 1 }
    const diagram = this.voronoi.compute(this.sites, bbox)
    const cells: Mesh[] = []

    diagram.cells.forEach((cell) => {
      // Remove cells near the edges to create a more organic shape
      // if (
      //   cell.site.x < 0.1 ||
      //   cell.site.x > 0.9 ||
      //   cell.site.y < 0.1 ||
      //   cell.site.y > 0.9
      // ) {
      //   return
      // }
      
      const points2D = cell.halfedges.map((edge) => {
        const p2D = edge.getStartpoint()
        const theta = p2D.x * 2 * Math.PI
        const phi = p2D.y * Math.PI
        const x = this.sphereRadius * Math.sin(phi) * Math.cos(theta)
        const y = this.sphereRadius * Math.cos(phi)
        const z = this.sphereRadius * Math.sin(phi) * Math.sin(theta)
        return { x, y, z }
      })

      const positions: number[] = []
      const indices: number[] = []

      // Triangulate the polygon using earcut
      const vertexArray = points2D.map(p => [p.x, p.y, p.z]).flat()
      const indicesArray = earcut(vertexArray, [], 3)

      // Create mesh from triangulated data
      points2D.forEach(p => {
        positions.push(p.x, p.y, p.z)
      })
      indicesArray.forEach(index => {
        indices.push(index)
      })

      const vertexData = new VertexData()
      vertexData.positions = positions
      vertexData.indices = indices

      const customMesh = new Mesh("voronoiCell", this.scene)
      vertexData.applyToMesh(customMesh)
      // customMesh.convertToFlatShadedMesh()

      const mat = new StandardMaterial("cellMat", this.scene)
      mat.sideOrientation = Mesh.DOUBLESIDE
      customMesh.material = mat
      ;(customMesh.material as StandardMaterial).emissiveColor = new Color3(0, 0, 0)
      // Apply density map for coloring
      const densityValue = Math.abs(densityMap(cell.site.x, cell.site.y)) // Ensure no negative values
      const colorFactor = densityValue

      const baseColor = new Color3(0.2, 0.2, 0.5) // Example base color
      ;(customMesh.material as StandardMaterial).specularColor =
        Color3.Black()
      ;(customMesh.material as StandardMaterial).diffuseColor =
        baseColor.scale(colorFactor)
      ;(customMesh.material as StandardMaterial).emissiveColor =
        baseColor.scale(colorFactor)

      cells.push(customMesh)
    })

    return cells
  }

  private initializeLuminanceMap(): void {
    this.cells.forEach((cell) => {
      this.luminanceMap.set(cell, 0) // Start with no luminance
    })
  }

  public update(deltaTime: number): void {
    this.animationProgress += deltaTime * this.animationSpeed

    if (this.animationProgress >= 1) {
      this.animateLuminance()
      this.animationProgress = 0
    }

    this.updateLuminance(deltaTime)
  }

  private animateLuminance(): void {
    const randomCell = this.cells[Math.floor(Math.random() * this.cells.length)]
    const baseLuminance = 1 // Peak luminance value for the central cell
    this.luminanceMap.set(randomCell, baseLuminance)

    // Apply falloff to neighboring cells
    this.cells.forEach((cell) => {
      const distance = Vector3.Distance(randomCell.position, cell.position)
      const falloff = Math.max(0, baseLuminance - (distance / this.sphereRadius) * 0.5)
      this.luminanceMap.set(
        cell,
        Math.max(this.luminanceMap.get(cell)!, falloff)
      )
    })
  }

  private updateLuminance(deltaTime: number): void {
    this.luminanceMap.forEach((luminance, cell) => {
      const material = cell.material as StandardMaterial
      const currentLuminance = Math.max(luminance - deltaTime * 0.001, 0)
      this.luminanceMap.set(cell, Math.max(0, currentLuminance))
      if (currentLuminance <= 0) {
        material.emissiveColor = material.diffuseColor.clone()
      } else {
        material.emissiveColor = new Color3(
          material.diffuseColor.r + currentLuminance,
          material.diffuseColor.g + currentLuminance,
          material.diffuseColor.b + currentLuminance
        )
      }
    })
  }
}

export class VoronoiSphereNebula implements IDisposable {
  private scene: Scene;
  private sites: number[][];
  private cells: Mesh[];
  private luminanceMap: Map<Mesh, number>;
  private animationProgress: number;
  private animationTarget: number;
  private animationSpeed: number;
  private animatedMesh: Mesh;
  private baseColor: Color3

  scale = 20000
  constructor(
    scene: Scene,
    numCells: number,
    densityMap: (x: number, y: number) => number
  ) {
    this.baseColor = new Color3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
    this.scene = scene;
    this.sites = this.generateSites(numCells);
    console.log("sites", this.sites);
    this.cells = this.createVoronoiMesh(densityMap);
    this.luminanceMap = new Map();
    this.animationProgress = 0;
    this.animationTarget = 1;
    this.animationSpeed = 0.005; // Speed of the luminance change

    this.initializeLuminanceMap();
  }

  dispose(): void {
    for (const mesh of this.cells) {
      mesh.dispose()
    }
  }

  private generateSites(numCells: number): number[][] {
    const sites: number[][] = [];
    for (let i = 0; i < numCells; i++) {
      const longitude = Math.random() * 360 - 180; // Longitude [-180, 180]
      const latitude = Math.random() * 180 - 90; // Latitude [-90, 90]
      sites.push([longitude, latitude]);
    }
    return sites;
  }

  private latLonToCart(longitude: number, latitude: number): Vector3 {
    const phi = (longitude * Math.PI) / 180;
    const theta = (latitude * Math.PI) / 180;

    // Convert spherical coordinates to Cartesian coordinates
    const x = Math.cos(theta) * Math.cos(phi);
    const y = Math.cos(theta) * Math.sin(phi);
    const z = Math.sin(theta);

    return new Vector3(x, y, z)
  }

  private createVoronoiMesh(
    densityMap: (longitude: number, latitude: number) => number
  ): Mesh[] {
    const voronoi = geoVoronoi(this.sites);
    const polygons = voronoi.polygons();
    const cells: Mesh[] = [];

    polygons.features.forEach((polygon) => {
      const vertices: Vector3[] = [];
      const indices: number[] = [];
      const normals: Vector3[] = [];
      const site: Vector3 = this.latLonToCart(polygon.properties.site[0], polygon.properties.site[1])
      
      polygon.geometry.coordinates[0].forEach((coord, index) => {
        const [longitude, latitude] = coord;
        const adjustedPosition = this.latLonToCart(longitude, latitude)

        vertices.push(adjustedPosition);

        // Create indices for the triangle fan
        if (index > 1) {
          indices.push(0, index - 1, index);

          // Calculate normals
          const p0 = vertices[0];
          const p1 = vertices[index - 1];
          const p2 = vertices[index];
          const edge1 = p1.subtract(p0);
          const edge2 = p2.subtract(p0);
          const normal = Vector3.Cross(edge1, edge2).normalize();
          
          // Apply the normal to each vertex of the triangle
          normals.push(normal, normal, normal);
        }
      });

      const vertexData = new VertexData();
      vertexData.positions = vertices.flatMap((v) => [v.x, v.y, v.z]);
      vertexData.indices = indices;
      vertexData.normals = normals.flatMap((n) => [n.x, n.y, n.z]);
      
      const mesh = new Mesh("voronoiCell", this.scene);

      const mat = new StandardMaterial("cellMat", this.scene);
      mat.sideOrientation = Mesh.DOUBLESIDE
      mat.backFaceCulling = false
      vertexData.applyToMesh(mesh);
      // mesh.position.subtract(site.multiplyByFloats(-1, -1, -1))
      // mesh.bakeCurrentTransformIntoVertices()
      // mesh.position.copyFrom(site)
      mesh.material = mat
      mesh.infiniteDistance = true
      // mesh.position = site.multiplyByFloats(-1, -1, -1)
      // mesh.bakeCurrentTransformIntoVertices()
      mesh.scaling.setAll(this.scale)
      mesh.metadata = {
        site
      }
      
      // const sphere = MeshBuilder.CreateSphere("sitePosition", { segments: 2, diameter: 1, })
      // sphere.position.copyFrom(site.scale(10000))
      // mesh.position = site.multiplyByFloats(-1, -1, -1)
      

      const densityValue = Math.abs(
        densityMap((polygon.properties.site[0] + 180) / 360, (polygon.properties.site[1] + 90) / 180)
      ); // Ensure no negative values
      const colorFactor = densityValue;

      // const baseColor = new Color3(0.2, 0.2, 0.5); // Example base color
      
      (mesh.material as StandardMaterial).specularColor = Color3.Black();
      (mesh.material as StandardMaterial).diffuseColor = this.baseColor.scale(
        colorFactor
      );
      (mesh.material as StandardMaterial).emissiveColor = this.baseColor.scale(
        colorFactor
      );

      cells.push(mesh);
    });

    return cells;
  }

  private initializeLuminanceMap(): void {
    this.cells.forEach((cell) => {
      this.luminanceMap.set(cell, 0); // Start with no luminance
    });
  }

  public update(deltaTime: number): void {
    this.animationProgress += deltaTime * this.animationSpeed;

    if (this.animationProgress >= this.animationTarget) {
      this.animateLuminance();
      this.animationProgress = 0;
      this.animationTarget = randFloat(1, 3)
    }

    this.updateLuminance(deltaTime);
  }

  private animateLuminance(): void {
    const randomCell = this.cells[Math.floor(Math.random() * this.cells.length)];
    this.animatedMesh = randomCell
    this.spreadLuminance(randomCell)
  }

  private spreadLuminance(baseCell: Mesh, baseLuminance: number = 1): void {
    this.luminanceMap.set(baseCell, baseLuminance);

    // Apply falloff to neighboring cells
    this.cells.forEach((cell) => {
      const distance = Vector3.Distance(baseCell.metadata.site, cell.metadata.site) * 0.9;
      const falloff = Math.max(0, baseLuminance - distance);
      this.luminanceMap.set(
        cell,
        Math.max(this.luminanceMap.get(cell)!, falloff)
      );
    });
  }

  private updateLuminance(deltaTime: number): void {
    if (this.animatedMesh) {
      // 30% chance bump up luminance
      if (random() < 0.003) {
        const bumpedLuminance = Math.max(this.luminanceMap.get(this.animatedMesh) + 0.3, 1)
        this.spreadLuminance(this.animatedMesh, bumpedLuminance)
      }
    }
    this.luminanceMap.forEach((luminance, cell) => {
      const material = cell.material as StandardMaterial;
      const currentLuminance = Math.max(luminance - deltaTime * 0.001, 0);
      this.luminanceMap.set(cell, Math.max(0, currentLuminance));
      if (currentLuminance <= 0) {
        material.emissiveColor = material.diffuseColor.clone();
        if (cell == this.animatedMesh) {
          this.animatedMesh = undefined
        }
      } else {
        material.emissiveColor = new Color3(
          material.diffuseColor.r + (material.diffuseColor.r * currentLuminance),
          material.diffuseColor.g + (material.diffuseColor.g * currentLuminance),
          material.diffuseColor.b + (material.diffuseColor.b * currentLuminance)
        );
      }
    });
  }
}