import { TmpVectors } from "@babylonjs/core"
import {
  Encounter,
  EncounterFormation,
  EncounterTeam,
  Environment,
  EnvironmentHazard,
  LocationPoint,
  Mission,
  Objective,
  ObjectiveStep,
  SubObjectiveTypes,
  Targets,
} from "../data/missions/missionData"
import { MissionTitles } from "../data/missions/missionTitles"
import { Vector3FromObj } from "../utils/math"

type DifficultyLevel = number // 10 to 100

/** -500,000:500,000 => -500:500 */
function scaleDownPosition(p: number): number {
  return p / 100000
}
function generateRandomLocation(id: number): LocationPoint {
  return {
    id,
    name: `Nav Point ${id}`,
    isNavPoint: true,
    position: {
      x: (Math.random() * 950 - 475) * 100000,
      y: (Math.random() * 950 - 475) * 100000,
      z: (Math.random() * 950 - 475) * 100000,
    },
  }
}

function generateEncountersForObjective(
  difficulty: DifficultyLevel,
  prevLocation: LocationPoint,
  location: LocationPoint,
  nextLocation: LocationPoint,
  subObjectiveType: SubObjectiveTypes,
  objectiveEncounterTeam: string
): Encounter[] {
  let encounters: Encounter[] = []
  const encounterTypes = ["Fighter", "Bomber", "Capital Ship", "Cargo"]
  /** Destroy, Patrol, Wingman, Escorted */
  const missionForObjective = {
    Escort: "Escorted",
    // Repair: "Escorted",
    Destroy: "Patrol",
    Defend: "Patrol",
    Navigate: "Escorted",
    Patrol: "Patrol",
  }
  const formations: EncounterFormation[] = ["V-Formation", "Line", "Random"]

  // Map subObjective to encounter type
  const relevantEncounterTypes = encounterTypes.filter((type) =>
    subObjectiveType === "Escort" ? type !== "Fighter" : true
  ) // Escorting usually doesn't involve Fighters, for example

  let waves = []
  if (
    (objectiveEncounterTeam == "Enemy" && (subObjectiveType == "Destroy" || subObjectiveType == "Patrol")) ||
    (objectiveEncounterTeam == "Friendly" && subObjectiveType == "Defend")
  ) {
    waves = Array.from({ length: Math.ceil(difficulty / 30) }, () => ({
      shipClass: "Cargo",
      quantity: Math.ceil(Math.random() * (difficulty / 10)),
      formation: formations[Math.floor(Math.random() * formations.length)],
      teamId: objectiveEncounterTeam as EncounterTeam, // Assign based on objective
      missionDetails: { mission: "Patrol", missionLocations: [location] }, // Could customize more if needed
    }))
    encounters.push({
      id: Math.floor(Math.random() * 1000), // Unique encounter ID
      location,
      waves,
    })
  }
  if (objectiveEncounterTeam == "Friendly" && subObjectiveType == "Escort") {
    // generate the ship to escort, and the ambush encounter
    encounters.push({
      id: Math.floor(Math.random() * 1000), // Unique encounter ID
      location,
      waves: [
        {
          teamId: "Friendly",
          shipClass: "Cargo",
          quantity: Math.ceil(difficulty / 33),
          formation: "Line",
          missionDetails: {
            mission: "Escorted",
            missionLocations: [location, nextLocation],
          },
        },
      ],
    })
    // generate the ambush between the two locations
    const pos1 = Vector3FromObj(location.position, TmpVectors.Vector3[0])
    const pos2 = Vector3FromObj(nextLocation.position, TmpVectors.Vector3[1])
    const direction = pos2.subtractToRef(pos1, TmpVectors.Vector3[2])
    const halfLength = direction.length() / 2
    const middle = direction.normalize().multiplyByFloats(halfLength, halfLength, halfLength)
    const enemyWaves = Array.from({ length: Math.ceil(difficulty / 30) }, () => ({
      shipClass: relevantEncounterTypes[Math.floor(Math.random() * relevantEncounterTypes.length)],
      quantity: Math.ceil(Math.random() * (difficulty / 10)),
      formation: formations[Math.floor(Math.random() * formations.length)],
      teamId: "Enemy", // Assign based on objective
      missionDetails: {
        mission: "Patrol",
        missionLocations: [location],
      },
    }))
    encounters.push({
      id: Math.floor(Math.random() * 1000), // Unique encounter ID
      location: {
        id: Math.floor(Math.random() * 1000), // Unique location ID
        isNavPoint: false,
        name: "Ambush",
        position: { x: middle.x, y: middle.y, z: middle.z },
      },
      waves: enemyWaves,
    })
  }
  if (objectiveEncounterTeam == "Friendly" && subObjectiveType == "Defend") {
    // generate the ship to defend, and the ambush encounter
    encounters.push({
      id: Math.floor(Math.random() * 1000), // Unique encounter ID
      location,
      waves: [
        {
          teamId: "Friendly",
          shipClass: "Cargo",
          quantity: Math.ceil(difficulty / 33),
          formation: "Line",
          missionDetails: {
            mission: "Escorted",
            missionLocations: [location],
          },
        },
      ],
    })
    // generate the ambush between the two locations if difficulty is high
    if (difficulty > 50 && difficulty - 50 / 50 > Math.random()) {
      const pos1 = Vector3FromObj(location.position, TmpVectors.Vector3[0])
      const pos2 = Vector3FromObj(prevLocation.position, TmpVectors.Vector3[1])
      const direction = pos2.subtractToRef(pos1, TmpVectors.Vector3[2])
      const halfLength = direction.length() / 2
      const middle = direction.normalize().multiplyByFloats(halfLength, halfLength, halfLength)
      const enemyWaves = Array.from({ length: Math.ceil(difficulty / 30) }, () => ({
        shipClass: relevantEncounterTypes[Math.floor(Math.random() * relevantEncounterTypes.length)],
        quantity: Math.ceil(Math.random() * (difficulty / 10)),
        formation: formations[Math.floor(Math.random() * formations.length)],
        teamId: "Enemy", // Assign based on objective
        missionDetails: {
          mission: "Patrol",
          missionLocations: [location],
        },
      }))
      encounters.push({
        id: Math.floor(Math.random() * 1000), // Unique encounter ID
        location: {
          id: Math.floor(Math.random() * 1000), // Unique location ID
          isNavPoint: false,
          name: "Ambush",
          position: { x: middle.x, y: middle.y, z: middle.z },
        },
        waves: enemyWaves,
      })
    }
  }
  return encounters
}

function generateObjectivesAndEncounters(
  difficulty: DifficultyLevel,
  briefing: string[],
  locations: LocationPoint[],
  bloackboard: any
): { objectives: Objective[]; encounters: Encounter[] } {
  const numObjectives = Math.max(1, Math.floor(difficulty / 50)) // More objectives with higher difficulty
  const subObjectiveTypes: SubObjectiveTypes[] = [
    "Escort",
    // "Repair",
    "Destroy",
    "Defend",
    // "Navigate",
    "Patrol",
  ]
  const targets: Targets[] = [
    "Waypoints",
    // "Repair Ship",
    "Capital Ship",
    "Enemy Fighters",
  ]

  const objectiveTargets = {
    Escort: ["Repair Ship", "Capital Ship"],
    // Repair: ["Capital Ship"],
    Destroy: ["Capital Ship", "Enemy Fighters"],
    Defend: ["Capital Ship"], //, "Repair Ship"],
    Navigate: ["Waypoints"],
    Patrol: ["Waypoints"],
  }

  const objectiveEncounterTeam = {
    Escort: "Friendly",
    // Repair: "Friendly",
    Destroy: "Enemy",
    Defend: "Friendly",
    Navigate: "Enemy",
    Patrol: "Enemy",
  }

  const objectives: Objective[] = []
  const encounters: Encounter[] = []

  for (let i = 0; i < numObjectives; i++) {
    const subObjectives: ObjectiveStep[] = []

    // Generate steps for the objective
    for (let stepId = 0; stepId < Math.ceil(difficulty / 30); stepId++) {
      const subObjectiveType = subObjectiveTypes[Math.floor(Math.random() * subObjectiveTypes.length)]
      const targetOptions = objectiveTargets[subObjectiveType]
      const target = targetOptions[Math.floor(Math.random() * targetOptions.length)]

      const locationId = Math.floor(Math.random() * locations.length)
      const location = locations[locationId]
      const nextLocation = locations[(locationId + 1) % locations.length]
      const prevLocation = locations.at((locationId - 1) % locations.length)
      const amount = Math.ceil(Math.random() * (difficulty / 10))

      const encounterTeam = objectiveEncounterTeam[subObjectiveType]

      // Generate encounters for this sub-objective
      const generatedEncounters = generateEncountersForObjective(
        difficulty,
        prevLocation,
        location,
        nextLocation,
        subObjectiveType,
        encounterTeam
      )
      let missionText = `${subObjectiveType} at ${location.name}`
      if (subObjectiveType == "Escort") {
        missionText += ` to ${nextLocation.name}`
      }
      briefing.push(missionText)

      // Append the encounters to the main encounter list
      encounters.push(...generatedEncounters)

      // Create subObjective with reference to its generated encounters
      subObjectives.push({
        id: stepId,
        type: subObjectiveType,
        target,
        amount,
        location,
        encounters: generatedEncounters.map((encounter) => encounter.id), // Link subObjective to encounters
      })
    }

    // Create the objective with its sub-objectives
    objectives.push({
      id: i,
      description: `Objective ${i + 1}`,
      steps: subObjectives,
    })
  }

  return { objectives, encounters }
}

function generateEnvironment(difficulty: DifficultyLevel, locations: LocationPoint[]): Environment[] {
  const hazards: EnvironmentHazard[] = ["Asteroids", "Nebula", "Radiation"]
  const numHazards = Math.floor(difficulty / 30) // More hazards with higher difficulty

  return Array.from({ length: numHazards }, (_, index) => ({
    location: locations[Math.floor(Math.random() * locations.length)],
    hazards: [hazards[Math.floor(Math.random() * hazards.length)]],
  }))
}

function spawnCarrierEncounter(location: LocationPoint, id: number) {
  return {
    id,
    location,
    waves: [
      {
        shipClass: "LiteCarrier",
        quantity: 1,
        formation: "Line",
        teamId: "Friendly",
        missionDetails: {
          mission: "Patrol",
          missionLocations: [location],
        },
      },
    ],
  } as Encounter
}

const tags = {
  "[LOCATION]": ({ objectives }: Mission) => {
    const primaryObjective = objectives.find((obj) => obj.steps[0]?.location)
    const location = primaryObjective.steps[0].location
    return location.name
  },
  "[HAZARD]": (mission: Mission) => {
    const { environment } = mission
    const hazardEnv = environment.find((env) => env.hazards.length > 0)
    return hazardEnv ? hazardEnv.hazards[0] : "Unknown"
  },
  "[DESTINATION]": (mission: Mission) => {
    const { locations } = mission
    return locations.slice(-1)[0].name
  },
  "[OBJECTIVE]": ({ objectives }: Mission) => {
    const primaryObjective = objectives[Math.floor(Math.random() * objectives.length)]
    return primaryObjective.steps[0].type // Use the type of the first sub-objective as a descriptor
  },
}

// Function to replace tags in the selected title template
export function generateMissionTitle(mission: Mission, titles: string[]): string {
  const template = titles[Math.floor(Math.random() * titles.length)]

  const replacedTitle = template.replace(/\[(\w+)\]/g, (match, tag) => {
    // console.log("match, tag", match, tag)
    if (match in tags) {
      return tags[match](mission)
    }
    return match
  })

  return replacedTitle
}

export function generateMission(difficulty: DifficultyLevel): Mission {
  const numLocations = Math.floor(difficulty / 10)
  const briefing: string[] = [`Threat level ${difficulty}.`]
  const locations = Array.from({ length: numLocations }, (_, id) => generateRandomLocation(id + 1))
  const spawnLocation = generateRandomLocation(numLocations)
  spawnLocation.isEntryPoint = true
  spawnLocation.isExitPoint = true
  spawnLocation.isNavPoint = true
  spawnLocation.name = "Jump Point"
  const bloackboard: any = {}
  const { encounters, objectives } = generateObjectivesAndEncounters(difficulty, briefing, locations, bloackboard)
  const spawnEncounter = spawnCarrierEncounter(spawnLocation, encounters.length)
  encounters.push(spawnEncounter)
  const navigationOrder = locations.slice() // Could be shuffled if needed
  const environment = generateEnvironment(difficulty, locations)
  for (const env of environment) {
    for (const hazard of env?.hazards) {
      let details = `Beware of ${hazard}`
      if (env.location.isNavPoint) {
        details += ` near ${env.location.name}`
      }
      briefing.push(details)
    }
  }

  const mission: { title?: string } & Omit<Mission, "title"> = {
    briefing: briefing.join("\r\n"),
    locations,
    navigationOrder,
    encounters: encounters,
    objectives: objectives,
    environment: environment,
    reward: difficulty * 100, // Higher difficulty yields more rewards
  }
  mission.title = generateMissionTitle(mission as Mission, MissionTitles)
  locations.push(spawnLocation)

  return mission as Mission
}

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
  mission.encounters.forEach((e) => {
    if (e.waves[0].teamId == "Friendly") {
      encounters.push({
        ...plotPosition(e.location.position),
        type: "friendly",
        label: e.waves[0].missionDetails.mission,
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
