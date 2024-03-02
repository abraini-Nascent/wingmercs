import { IDisposable } from "@babylonjs/core";

export interface GameScene {
  runLoop: (delta: number) => void
  dispose: () => void
}