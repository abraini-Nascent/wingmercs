import { Quaternion, Vector3 } from "@babylonjs/core"

export type HeadingManeuverData = {
  headings: Vector3[]
  timings: number[]
}

export const LoopData: HeadingManeuverData = {
  headings: [
    new Vector3(0, -1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, -1, 2.5),
  ],
  timings: [0,0,0,0,0]
}

export const SmallWaggleData: HeadingManeuverData = {
  headings: [
    new Vector3(-1, 0, 1),
    new Vector3(1, 0, 1),
    new Vector3(1, 0, 1),
    new Vector3(-1, 0, 1),
    new Vector3(-1, 0, 1),
    new Vector3(1, 0, 1),
    new Vector3(1, 0, 1),
    new Vector3(-1, 0, 1),
  ],
  timings: [
    0,0,
    0,0,
    0,0,
    0,0
  ]
}

export const BigWaveData: HeadingManeuverData = {
  headings: [
    new Vector3(0, +1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, +1, 0),
    new Vector3(0, +1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, +1, 0),
  ],
  timings: [
    0,0,
    0,0,
    0,0,
    0,0
  ]
}

export const SmallWaveData: HeadingManeuverData = {
  headings: [
    new Vector3(0, +0.7071067811865476, +0.7071067811865476),
    new Vector3(0, -0.7071067811865476, +0.7071067811865476),
    new Vector3(0, -0.7071067811865476, +0.7071067811865476),
    new Vector3(0, +0.7071067811865476, +0.7071067811865476),
    new Vector3(0, +0.7071067811865476, +0.7071067811865476),
    new Vector3(0, -0.7071067811865476, +0.7071067811865476),
    new Vector3(0, -0.7071067811865476, +0.7071067811865476),
    new Vector3(0, +0.7071067811865476, +0.7071067811865476),
  ],
  timings: [
    // 1000,
    // 1000,
    0,0,
    0,0,
    0,0,
    0,0,
    0,0
  ]
}

/** veer forward up right for 1.5 seconds */
export const VeerOffData: HeadingManeuverData = {
  headings: [
    new Vector3(2, -1, 2)
  ],
  timings: [
    1500
  ]
}

/** break left for 1.5 seconds */
export const BreakLeftData: HeadingManeuverData = {
  headings: [
    new Vector3(1, 0, 0)
  ],
  timings: [
    1500
  ]
}

/** break right for 1.5 seconds */
export const BreakRightData: HeadingManeuverData = {
  headings: [
    new Vector3(-1, 0, 0)
  ],
  timings: [
    1500
  ]
}

export const FlipData: HeadingManeuverData = {
  headings: [
    new Vector3(0, 0, -1)
  ],
  timings: [
    0
  ]
}

/** fishHook */
export const FishHookData: HeadingManeuverData = {
  headings: [
    new Vector3(-1, 0, 0),
    new Vector3(1, 0, 0),
    new Vector3(1, 0, 0)
  ],
  timings: [0,0,0]
}