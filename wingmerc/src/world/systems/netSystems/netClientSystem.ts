import { decode, encode } from "@msgpack/msgpack"
import { Entity, GFrame, world } from "../../world"
import { net } from "../../../net"
/**
 * client receives the world state from the server and sends the state of the local entities
 * it's not true client/server since we don't send commands, we send state.  the server is not authoritative of client objects
 * we could relinquish controll of entities that are spawned by the client such as bullets
 * but the client maintains controll of it's ship
 * 
 * TODO: we are missing a way to rend deletion of entities
 */
let acc = 0
const NetTik = 10
const NetTikMili = 1000/NetTik
let onIncData
// oof
let netId2worldId = []
let lastSync = 0
let lastSend = 0
// foo
export function netSyncClientSystem(dt: number) {
  if (net.conn != undefined && onIncData == undefined) {
    onIncData = (data) => {
      console.time("net frame decode")
      const payload = decode(data) as { syn: number, entities: Partial<Entity>[], dead: number[] }
      if (payload.dead != undefined) {
        for (const deadid of payload.dead) {
          let localId = netId2worldId[deadid]
          const entity = world.entity(localId)
          world.remove(entity)
        }
      }
      if (payload.syn < lastSync) { console.log("[net] out of order frame"); return }
      lastSync = payload.syn
      for (const entityData of payload.entities) {
        if (entityData.owner == net.id) {
          // if i own this entity, i am authoritative and i ignore the server state
          continue;
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
  const frame = new GFrame(true)
  const message = encode({ id: net.id, syn: ++lastSend, entities: frame.payload })
  net.send(message)
  console.timeEnd("net frame encode")
}