import { decode, encode } from "@msgpack/msgpack"
import { Entity, GFrame, world } from "../world"
import { net } from "../../net"

let acc = 0
const NetTik = 10
const NetTikMili = 1000/NetTik
let onIncData
// oof
let netId2worldId = []
let lastSync = 0
// foo
export function netSyncSystem(dt: number, server: boolean) {

  if (server == false && net.conn != undefined && onIncData == undefined) {
    onIncData = (data) => {
      console.time("net frame decode")
      const payload = decode(data) as { syn: number, entities: Partial<Entity>[] }
      if (payload.syn < lastSync) { console.log("[net] out of order frame"); return }
      lastSync = payload.syn
      for (const entityData of payload.entities) {
        const id = entityData["_id"]
        delete entityData["_id"]
        let localId = netId2worldId[id]
        if (localId != undefined) {
          const entity = world.entity(localId)
          world.update(entity, entityData)
        } else {
          const newEntity = world.add(entityData as Entity)
          const newId = world.id(newEntity)
          netId2worldId[id] = newId
        }
      }
      console.timeEnd("net frame decode")
    }
    net.onData(onIncData)
  }
  acc += dt
  if (acc < NetTikMili) {
    return
  }
  acc -= NetTikMili
  if (acc > NetTikMili * 0.5) {
    acc = 0
  }
  if (net.conn == undefined || server == false) {
    return
  }
  console.time("net frame encode")
  const frame = new GFrame()
  const message = encode({syn: ++lastSync, entities: frame.payload})
  net.send(message)
  console.timeEnd("net frame encode")
}