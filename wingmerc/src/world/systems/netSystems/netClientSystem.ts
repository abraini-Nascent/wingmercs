import { decode, encode } from "@msgpack/msgpack"
import { CreateEntity, Entity, EntityForId, GFrame, world } from "../../world"
import { net } from "./net"
import { GameFrameMessage } from "./messages/gameFrameMessage"
/**
 * client receives the world state from the server and sends the state of the local entities
 * it's not true client/server since we don't send commands, we send state.  the server is not authoritative of client objects
 * we could relinquish controll of entities that are spawned by the client such as bullets
 * but the client maintains controll of it's ship
 * 
 * TODO: we are missing a way to rend deletion of entities
 */

const DEBUG = false
const PERFTEST = false

let acc = 0
const NetTik = 10
const NetTikMili = 1000/NetTik
let onIncData
let lastSync = 0
let lastSend = 0
// foo
export function netSyncClientSystem(dt: number) {
  if (net.connected && onIncData == undefined) {
    onIncData = (_peer, data) => {
      DEBUG && console.log("[net] client dencoding frame")
      PERFTEST && console.time("[net] client frame decode")
      const frame = data as GameFrameMessage
      if (frame.type != "frame") {
        // not a game frame message
        return
      }
      const payload = frame.data
      if (payload.dead != undefined) {
        for (const deadid of payload.dead) {
          const entity = EntityForId(deadid)
          world.remove(entity)
        }
      }
      if (payload.syn < lastSync) { DEBUG && console.log("[net] out of order frame"); return }
      lastSync = payload.syn
      for (const entityData of payload.entities) {
        if (entityData.owner == net.id) {
          // if i own this entity, i am authoritative and i ignore the server state
          continue;
        }
        const entity = EntityForId(entityData.id)
        if (entity != undefined) {
          world.update(entity, entityData)
        } else {
          const _newEntity = CreateEntity(entityData as Entity)
          console.log(`[net client] new entity created`, _newEntity)
        }
      }
      PERFTEST && console.timeEnd("[net] client frame decode")
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
  if (net.connected == false) {
    return
  }
  DEBUG && console.log("[net] client encoding frame")
  PERFTEST && console.time("net frame encode")
  const frame = new GFrame(true)
  const message = {
    type: "frame",
    data: { syn: ++lastSend, entities: frame.payload }
  } as GameFrameMessage
  net.send(message)
  PERFTEST && console.timeEnd("net frame encode")
}