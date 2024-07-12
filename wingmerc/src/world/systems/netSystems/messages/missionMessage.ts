import { NetMessage } from "./netMessage";

export interface MissionMessage extends NetMessage {
  type: "mission"
  data: {
    entities: any
  }
}