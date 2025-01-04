import { TmpVectors, Vector3 } from "@babylonjs/core"
import {
  Encounter,
  EncounterFormation,
  EncounterTeam,
  EncounterWave,
  Environment,
  EnvironmentHazard,
  LocationPoint,
  Mission,
  MissionDetails,
  MissionType,
  Objective,
  ObjectiveStep,
  ObjectiveType,
  Targets,
} from "../data/missions/missionData"
import { MissionTitles } from "../data/missions/missionTitles"
import { Vector3FromObj } from "../utils/math"
import { rand } from "../utils/random"

type DifficultyLevel = number // 10 to 100

/** -500,000:500,000 => -500:500 */
function scaleDownPosition(p: number): number {
  return p / 100000
}
function generateRandomLocations(id: number, total: number, existingLocations: LocationPoint[] = []): LocationPoint[] {
  const checkLocations = [...existingLocations]
  const locations: LocationPoint[] = []
  for (let i = 1; i <= total; i++) {
    let set = false
    let limit = 0
    do {
      let possibleLocation = generateRandomLocation(id + i)
      limit += 1
      if (locations.length == 0) {
        locations.push(possibleLocation)
        checkLocations.push(possibleLocation)
        break
      }
      if (
        possibleLocation.position.x < -40000000 ||
        possibleLocation.position.y < -40000000 ||
        possibleLocation.position.x > 40000000 ||
        possibleLocation.position.y > 40000000
      ) {
        console.log("too close to edge")
        break
      }
      for (const setLocation of checkLocations) {
        const distance = Vector3FromObj(setLocation.position, TmpVectors.Vector3[0])
          .subtractInPlace(Vector3FromObj(possibleLocation.position, TmpVectors.Vector3[1]))
          .length()
        if (distance > 150000) {
          locations.push(possibleLocation)
          checkLocations.push(possibleLocation)
          set = true
          break
        } else {
          console.log("too close to", setLocation.name, distance)
        }
      }
    } while (set == false && limit < 5)
  }
  return locations
}
function generateRandomLocation(id: number): LocationPoint {
  return {
    id,
    name: `Nav Point ${id}`,
    isNavPoint: true,
    position: {
      x: (Math.random() * 900 - 400) * 100000,
      y: (Math.random() * 900 - 400) * 100000,
      z: (Math.random() * 900 - 400) * 100000,
    },
  }
}
// const objectiveEncounterTeam = {
//   Escort: "Friendly",
//   // Repair: "Friendly",
//   Destroy: "Enemy",
//   Defend: "Friendly",
//   Navigate: "Enemy",
//   Patrol: "Enemy",
// }
const FriendlyFighterClasses = ["Dirk", "Epee", "Rapier", "Saber", "Broadsword"]
const EnemyFighterClasses = ["EnemyLight01", "EnemyMedium01", "EnemyMedium02", "EnemyHeavy01"]
/** 25% chance to go up or down a class, dice are exploding, going up or down gives you another chance to go up or down */
const FightClassForDifficulty = (ships: string[], difficulty: number): string => {
  const maxIndex = ships.length - 1
  const baseIndex = Math.floor((difficulty / 100) * maxIndex)

  let adjustedIndex = baseIndex
  let explode = false
  do {
    const randomAdjustment = Math.random()
    if (randomAdjustment < 0.25 && adjustedIndex > 0) {
      adjustedIndex = adjustedIndex - 1
      explode = true
    } else if (randomAdjustment > 0.75 && adjustedIndex < maxIndex) {
      adjustedIndex = adjustedIndex + 1
      explode = true
    } else {
      explode = false
    }
  } while (explode)

  return ships[adjustedIndex]
}
function generatePatrolEncounters(
  difficulty: DifficultyLevel,
  _prevLocation: LocationPoint,
  location: LocationPoint,
  _nextLocation: LocationPoint,
  _objectiveType: ObjectiveType
): Encounter[] {
  let encounters: Encounter[] = []

  let waves = Array.from({ length: Math.ceil(difficulty / 30) }, () => ({
    shipClass: FightClassForDifficulty(EnemyFighterClasses, difficulty),
    quantity: Math.ceil(Math.random() * (difficulty / 10)),
    formation: "V-Formation" as EncounterFormation,
    teamId: "Enemy" as EncounterTeam,
    missionDetails: { mission: "Patrol" as MissionType, missionLocations: [location] },
  }))
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location,
    waves,
  })
  return encounters
}
function generateDestroyEncounters(
  difficulty: DifficultyLevel,
  _prevLocation: LocationPoint,
  location: LocationPoint,
  _nextLocation: LocationPoint,
  _objectiveType: ObjectiveType
): Encounter[] {
  let encounters: Encounter[] = []

  // target encounter & wave
  let targetWave: EncounterWave = {
    shipClass: "CargoB",
    quantity: 1,
    formation: "V-Formation",
    teamId: "Enemy" as EncounterTeam,
    missionDetails: { mission: "Patrol", missionLocations: [location] },
  }
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location,
    waves: [targetWave],
  })

  // defender encounter & waves
  let defenderWaves = Array.from({ length: Math.ceil(difficulty / 30) }, () => ({
    shipClass: FightClassForDifficulty(EnemyFighterClasses, difficulty),
    quantity: Math.ceil(Math.random() * (difficulty / 10)),
    formation: "V-Formation" as EncounterFormation,
    teamId: "Enemy" as EncounterTeam,
    missionDetails: { mission: "Patrol" as MissionType, missionLocations: [location] },
  }))
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location,
    waves: defenderWaves,
  })
  return encounters
}
function generateDefendEncounters(
  difficulty: DifficultyLevel,
  _prevLocation: LocationPoint,
  location: LocationPoint,
  _nextLocation: LocationPoint,
  _objectiveType: ObjectiveType
): Encounter[] {
  let encounters: Encounter[] = []

  // target encounter & wave
  let targetWave: EncounterWave = {
    shipClass: "CargoA",
    quantity: 1,
    formation: "V-Formation",
    teamId: "Friendly" as EncounterTeam,
    missionDetails: { mission: "Patrol", missionLocations: [location] },
  }
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location,
    waves: [targetWave],
  })

  // friendly defender encounter & waves
  let defenderWaves = {
    shipClass: FightClassForDifficulty(FriendlyFighterClasses, difficulty),
    quantity: Math.ceil(Math.random() * (difficulty / 10)),
    formation: "V-Formation" as EncounterFormation,
    teamId: "Friendly" as EncounterTeam,
    missionDetails: { mission: "Patrol" as MissionType, missionLocations: [location] },
  }
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location,
    waves: [defenderWaves],
  })

  // attacker encounter & waves
  let attackerWaves = Array.from({ length: Math.ceil(difficulty / 30) }, () => ({
    shipClass: FightClassForDifficulty(EnemyFighterClasses, difficulty),
    quantity: Math.ceil(Math.random() * (difficulty / 10)),
    formation: "V-Formation" as EncounterFormation,
    teamId: "Enemy" as EncounterTeam,
    missionDetails: { mission: "Patrol" as MissionType, missionLocations: [location] },
  }))
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location,
    waves: attackerWaves,
  })
  return encounters
}

function generateEscortEncounters(
  difficulty: DifficultyLevel,
  _prevLocation: LocationPoint,
  location: LocationPoint,
  nextLocation: LocationPoint,
  _objectiveType: ObjectiveType
): Encounter[] {
  let encounters: Encounter[] = []

  // target encounter & wave
  let targetWave: EncounterWave = {
    shipClass: "CargoA",
    quantity: 1,
    formation: "V-Formation",
    teamId: "Friendly" as EncounterTeam,
    missionDetails: { mission: "Escorted", missionLocations: [location, nextLocation] },
  }
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location,
    waves: [targetWave],
  })

  // friendly defender encounter & waves
  let defenderWaves = {
    shipClass: FightClassForDifficulty(FriendlyFighterClasses, difficulty),
    quantity: Math.ceil(Math.random() * (difficulty / 10)),
    formation: "V-Formation" as EncounterFormation,
    teamId: "Friendly" as EncounterTeam,
    missionDetails: { mission: "Patrol" as MissionType, missionLocations: [location] },
  }
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location,
    waves: [defenderWaves],
  })

  // generate the ambush between the two locations
  if (Math.random() < difficulty / 100) {
    const pos1 = Vector3FromObj(location.position, TmpVectors.Vector3[0])
    const pos2 = Vector3FromObj(nextLocation.position, TmpVectors.Vector3[1])
    const middle = Vector3.LerpToRef(pos1, pos2, 0.5, TmpVectors.Vector3[3])
    const enemyWaves = Array.from({ length: Math.ceil(difficulty / 30) }, () => ({
      id: Math.floor(Math.random() * 1000),
      shipClass: FightClassForDifficulty(EnemyFighterClasses, difficulty),
      quantity: Math.ceil(Math.random() * (difficulty / 10)),
      formation: "V-Formation" as EncounterFormation,
      teamId: "Enemy" as EncounterTeam,
      missionDetails: {
        mission: "Patrol" as MissionType,
        missionLocations: [
          {
            id: Math.floor(Math.random() * 1000),
            name: "Ambush",
            isNavPoint: false,
            position: middle,
          } as LocationPoint,
        ],
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
  const enemyWaves = Array.from({ length: Math.ceil(difficulty / 30) }, () => ({
    id: Math.floor(Math.random() * 1000),
    shipClass: FightClassForDifficulty(EnemyFighterClasses, difficulty),
    quantity: Math.ceil(Math.random() * (difficulty / 10)),
    formation: "V-Formation" as EncounterFormation,
    teamId: "Enemy" as EncounterTeam,
    missionDetails: {
      mission: "Patrol" as MissionType,
      missionLocations: [nextLocation],
    },
  }))
  encounters.push({
    id: Math.floor(Math.random() * 1000), // Unique encounter ID
    location: nextLocation,
    waves: enemyWaves,
  })
  return encounters
}

function generateEncountersForObjective(
  difficulty: DifficultyLevel,
  prevLocation: LocationPoint,
  location: LocationPoint,
  nextLocation: LocationPoint,
  objectiveType: ObjectiveType
): Encounter[] {
  switch (objectiveType) {
    case "Patrol": {
      return generatePatrolEncounters(difficulty, prevLocation, location, nextLocation, objectiveType)
    }
    case "Destroy": {
      return generateDestroyEncounters(difficulty, prevLocation, location, nextLocation, objectiveType)
    }
    case "Defend": {
      return generateDefendEncounters(difficulty, prevLocation, location, nextLocation, objectiveType)
    }
    case "Escort": {
      return generateEscortEncounters(difficulty, prevLocation, location, nextLocation, objectiveType)
    }
  }
  return []
}

function generateObjectivesAndEncounters(
  difficulty: DifficultyLevel,
  briefing: string[],
  locations: LocationPoint[],
  bloackboard: any
): { objectives: Objective[]; encounters: Encounter[] } {
  const numObjectives = Math.max(1, Math.floor(difficulty / 50)) // More objectives with higher difficulty
  const subObjectiveTypes: ObjectiveType[] = [
    "Escort",
    // "Repair",
    "Destroy",
    "Defend",
    // "Navigate",
    "Patrol",
  ]

  const possibleLocations = [...locations]
  const objectives: Objective[] = []
  const encounters: Encounter[] = []

  for (let i = 0; i < numObjectives; i++) {
    const subObjectives: ObjectiveStep[] = []

    // Generate steps for the objective
    for (let stepId = 0; stepId < Math.ceil(difficulty / 30); stepId++) {
      if (possibleLocations.length == 0) {
        break
      }
      const subObjectiveType = subObjectiveTypes[Math.floor(Math.random() * subObjectiveTypes.length)]

      const locationIdx = Math.floor(Math.random() * possibleLocations.length)
      const location = possibleLocations.splice(locationIdx, 1)[0]
      const locationId = location.id
      const nextLocation = locations[(locationId + 1) % locations.length]
      const prevLocation = locations.at((locationId - 1) % locations.length)
      const value = Math.ceil(Math.random() * (difficulty / 10)) * 10000

      // Generate encounters for this sub-objective
      const generatedEncounters = generateEncountersForObjective(
        difficulty,
        prevLocation,
        location,
        nextLocation,
        subObjectiveType
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
        value,
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
  const possibleLocations = [...locations]
  const possibleHazards: EnvironmentHazard[] = ["Asteroids", "Nebula", "Radiation"]
  const numHazards = Math.floor(difficulty / 30) // More hazards with higher difficulty
  const setHazards: Environment[] = []
  for (let i = 0; i < numHazards; i += 1) {
    let possibleLocationId = rand(0, possibleLocations.length - 1)
    let location = possibleLocations.splice(possibleLocationId, 1)[0]
    const hazard = {
      location,
      hazards: [possibleHazards[Math.floor(Math.random() * possibleHazards.length)]],
    }
    setHazards.push(hazard)
  }
  return setHazards
}

function spawnCarrierEncounter(location: LocationPoint, id: number) {
  return {
    id,
    location,
    meta: { carrier: true },
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
  const numLocations = Math.max(2, rand(Math.floor(difficulty / 12), Math.ceil(difficulty / 8)))
  const briefing: string[] = [`Threat level ${difficulty}.`]
  const locations = generateRandomLocations(0, numLocations)
  const spawnLocation = generateRandomLocations(numLocations + 1, 1, locations)[0]
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
