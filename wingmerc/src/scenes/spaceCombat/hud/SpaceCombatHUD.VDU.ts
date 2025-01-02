import { IDisposable } from "@babylonjs/core"

export interface VDU extends IDisposable {
  vduButtonPressed: (button: number) => void
}
