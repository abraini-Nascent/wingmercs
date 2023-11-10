import { decode, encode } from "@msgpack/msgpack"
import { Entity, GFrame, world } from "../world"
import { net } from "../../net"

let acc = 0
const NetTik = 10
const NetTikMili = 1000/NetTik
let onIncData
let onDeadEntity
let dead: number[] = []
// oof
let netId2worldId = []
let lastSync = 0
let clientSync: { [peerId: string]: number } = {}
// foo
export function netSyncServerSystem(dt: number) {
  if (net.conn != undefined && onDeadEntity == undefined) {
    world.onEntityRemoved.subscribe((entity) => {
      dead.push(world.id(entity))
    })
  }
  if (net.conn != undefined && onIncData == undefined) {
    onIncData = (data) => {
      console.time("net frame decode")
      const payload = decode(data) as {id: string, syn: number, entities: Partial<Entity>[] }
      let lastSync = clientSync[payload.id] ?? 0
      if (payload.syn < lastSync) { console.log("[net] out of order frame"); return }
      clientSync[payload.id] = payload.syn
      for (const entityData of payload.entities) {
        if (entityData.owner != undefined && entityData.relinquish) {
          // if a client sent me an entity that they controller
          // and ask to relinquish control, we remove their owner id from it
          delete entityData.owner
          delete entityData.relinquish
        }
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
  if (net.conn == undefined) {
    return
  }
  console.time("net frame encode")
  const frame = new GFrame()
  const deadEntities = dead.splice(0, dead.length)
  const message = encode({ syn: ++lastSync, entities: frame.payload, dead: deadEntities })
  net.send(message)
  console.timeEnd("net frame encode")
}