import { decode, encode } from "@msgpack/msgpack"
import { CreateEntity, Entity, EntityForId, EntityUUID, GFrame, world } from "../../world"
import { net } from "./net"
import { GameFrameMessage } from "./messages/gameFrameMessage"

const DEBUG = false
const PERFTEST = false

let acc = 0
const NetTik = 10
const NetTikMili = 1000/NetTik
let onIncData
let onDeadEntity
let dead: EntityUUID[] = []
let lastSync = 0
let clientSync: { [peerId: string]: number } = {}
// foo
export function netSyncServerSystem(dt: number) {
  if (net.connected && onDeadEntity == undefined) {
    world.onEntityRemoved.subscribe((entity) => {
      dead.push(entity.id)
    })
  }
  if (net.connected && onIncData == undefined) {
    onIncData = (peer, data) => {
      DEBUG && console.log("[net] server dencoding frame")
      PERFTEST && console.time("net frame decode")
      const frame = data as GameFrameMessage
      if (frame.type != "frame") {
        // not a game frame mission
        return
      }
      const payload = frame.data
      let lastSync = clientSync[peer] ?? 0
      if (payload.syn < lastSync) { DEBUG && console.log("[net] out of order frame"); return }
      clientSync[peer] = payload.syn
      for (const entityData of payload.entities) {
        if (entityData.owner != undefined && entityData.relinquish) {
          // if a client sent me an entity that they controller
          // and ask to relinquish control, we remove their owner id from it
          delete entityData.owner
          delete entityData.relinquish
        }
        const entity = EntityForId(entityData.id)
        if (entity != undefined) {
          world.update(entity, entityData)
        } else {
          const _newEntity = CreateEntity(entityData as Entity)
          console.log(`[net server] new entity created`, _newEntity)
        }
      }
      PERFTEST && console.timeEnd("net frame decode")
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
  DEBUG && console.log("[net] server encoding frame")
  PERFTEST && console.time("net frame encode")
  const frame = new GFrame()
  const deadEntities = dead.splice(0, dead.length)
  const message = {
    type: "frame",
    data: { syn: ++lastSync, entities: frame.payload, dead: deadEntities }
  } as GameFrameMessage
  net.send(message)
  PERFTEST && console.timeEnd("net frame encode")
}