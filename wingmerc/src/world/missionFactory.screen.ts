import { Mission } from "../data/missions/missionData"

const DEBUG = true
// Define types for points and encounters within the mission
type MapPointType = "navPoint" | "asteroids" | "radiation" | "nebula"
type MapEncounterType = "friendly" | "enemy"

/**
 * Generates a Wing Commander 1-style mission screen on a Canvas2D based on a mission object.
 * @param mission - The mission object containing an array of points and encounters.
 * @param width - Width of the canvas.
 * @param height - Height of the canvas.
 * @returns The canvas with the drawn mission map.
 */
export function generateMissionScreen(mission: Mission, width: number = 500, height: number = 500): HTMLCanvasElement {
  // Create canvas and set dimensions
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) throw new Error("Canvas rendering context not available")

  // Fill background with black
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, width, height)

  // Set line width for all drawings
  ctx.lineWidth = 4

  // Colors and styles for elements
  const colors: { [key in MapPointType | MapEncounterType]: string } = {
    navPoint: "#008000", // blue
    asteroids: "#CD7F32", // white
    radiation: "#FFFF00", // yellow
    nebula: "#800080", // purple
    friendly: "#FFFFFF", // white
    enemy: "#FF0000", // red
  }

  // Sizes for different types of objects
  const sizes: { [key in MapPointType | "triangle"]: number } = {
    navPoint: 12,
    asteroids: 34,
    radiation: 36,
    nebula: 38,
    triangle: 8,
  }

  // Utility function to reduce the location position to something that will fit on the map
  function plotPosition({ x, y }: { x: number; y: number }): {
    x: number
    y: number
  } {
    return {
      x: (x / 100000 + 500) / 2,
      y: (y / 100000 + 500) / 2,
    }
  }

  // Utility function to draw centered label
  function drawLabel(x: number, y: number, text: string): void {
    ctx.font = "10px KongfaceRegular"
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.fillText(text.toUpperCase(), x, y)
  }

  // Helper function to draw a circle
  function drawCircle(x: number, y: number, color: string, radius: number, label?: string): void {
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.stroke()
    if (label) {
      drawLabel(x, y + radius + 12, label)
    }
  }

  // Utility function to draw square for nav points
  function drawSquare(x: number, y: number, color: string, size: number, label?: string) {
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.strokeRect(x - size / 2, y - size / 2, size, size)

    if (label) {
      drawLabel(x, y + size / 2 + 12, label)
    }
  }

  // Helper function to draw a triangle for encounters
  function drawTriangle(
    x: number,
    y: number,
    color: string,
    size: number,
    direction: "up" | "down" = "up",
    label?: string
  ): void {
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.beginPath()
    if (direction === "up") {
      ctx.moveTo(x, y - size)
      ctx.lineTo(x - size, y + size)
      ctx.lineTo(x + size, y + size)
    } else if (direction === "down") {
      ctx.moveTo(x, y + size)
      ctx.lineTo(x - size, y - size)
      ctx.lineTo(x + size, y - size)
    }
    ctx.closePath()
    ctx.stroke()

    if (label) {
      drawLabel(x, y - size / 2 - 12, label)
    }
  }

  const urlParams = new URLSearchParams(window.location.search)
  const debug = urlParams.get("debug")
  // create the points
  const points: {
    x: number
    y: number
    type: MapPointType
    label: string
  }[] = []
  mission.locations.forEach((n) => {
    if (n.isNavPoint) {
      points.push({
        ...plotPosition(n.position),
        type: "navPoint",
        label: n.name.replace("Point ", ""),
      })
    } else if (debug) {
      points.push({
        ...plotPosition(n.position),
        type: "navPoint",
        label: n.name.replace("Point ", ""),
      })
    }
  })
  mission.environment.forEach((e) => {
    points.push({
      ...plotPosition(e.location.position),
      type: e.hazards[0].toLowerCase() as MapPointType,
      label: e.hazards[0],
    })
  })

  const encounters: {
    x: number
    y: number
    type: MapEncounterType
    label: string
  }[] = []
  const FriendlyLabels = {
    ESCORTED: "ESCORT",
  }
  mission.encounters.forEach((e) => {
    if (DEBUG || (e.waves[0].teamId == "Friendly" && !e.meta?.carrier)) {
      encounters.push({
        ...plotPosition(e.location.position),
        type: e.waves[0].teamId.toLowerCase() as "friendly",
        label: FriendlyLabels[e.waves[0].missionDetails.mission] ?? e.waves[0].missionDetails.mission,
      })
    }
  })
  mission.objectives.forEach((o) => {
    o.steps.forEach((o) => {
      if (o.type == "Destroy" && o.location) {
        encounters.push({
          ...plotPosition(o.location.position),
          type: "enemy",
          label: undefined,
        })
      }
    })
  })

  // Loop through mission points and draw on the canvas
  points.forEach((point) => {
    const { type, x, y, label } = point
    switch (type) {
      case "navPoint":
        drawSquare(x, y, colors.navPoint, sizes.navPoint, label)
        break
      case "asteroids":
        drawCircle(x, y, colors.asteroids, sizes.asteroids, "Asteroids")
        break
      case "radiation":
        drawCircle(x, y, colors.radiation, sizes.radiation, "Radiation")
        break
      case "nebula":
        drawCircle(x, y, colors.nebula, sizes.nebula, "Nebula")
        break
    }
  })

  // Loop through mission encounters and draw encounters
  encounters.forEach((encounter) => {
    const { type, x, y, label } = encounter
    if (type === "friendly") {
      drawTriangle(x, y, colors.friendly, sizes.triangle, "up", label)
    } else if (type === "enemy") {
      drawTriangle(x, y, colors.enemy, sizes.triangle, "down", label)
    }
  })

  // console.log(points, encounters)
  return canvas
}
