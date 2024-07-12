import { NetMessage } from "./netMessage"

export interface JoinMessage extends NetMessage {
  type: "ack"
  data: { 
    ack: true
    metadata: {
      name: string
    }
  }
}