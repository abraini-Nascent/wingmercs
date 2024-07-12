import { NetMessage, NetMessageType } from "./netMessage";

export interface GameFrameMessage extends NetMessage {
  type: "frame"
  data: { syn: number, entities: any, dead: string[] }
}