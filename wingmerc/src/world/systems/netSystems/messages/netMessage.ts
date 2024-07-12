export type NetMessageType = "ack" | "ready" | "frame" | "mission"
export interface NetMessage {
  type: NetMessageType
  data: unknown
}