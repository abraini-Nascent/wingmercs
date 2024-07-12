import { NetMessage } from "./netMessage"

export interface ReadyMessage extends NetMessage {
  type: "ready"
  data: {
    ready: boolean
    peerId: string
    name: string
  }
}