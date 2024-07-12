import { decode, encode } from "@msgpack/msgpack"
import { DataConnection, Peer } from "peerjs"

const DEBUG = false

class Net {
  peer: Peer
  id: string = makeid(6)
  connections: Map<string, DataConnection> = new Map()
  metadata: Map<string, any> = new Map()
  connected: boolean = false
  attempt: boolean = false
  name: string = "player"

  private _onData = new Set<((peer: string, data: unknown) => void)>()
  private _onClose = new Set<((peer: string) => void)>()
  private _onConnected = new Set<((peer: string) => void)>()
  static Namespace = "wingmercs-0_0-"
  get namespace() { return Net.Namespace }
  constructor() {
    this.createPeer()
  }
  onData(cb: ((peer: string, data: unknown) => void)) {
    this._onData.add(cb)
  }
  removeOnData(cb: ((peer: string, data: unknown) => void)) {
    this._onData.delete(cb)
  }
  onClose(cb: ((peer: string) => void)) {
    this._onClose.add(cb)
  }
  removeOnClose(cb: ((peer: string) => void)) {
    this._onClose.delete(cb)
  }
  onConnected(cb: ((peer: string) => void)) {
    this._onConnected.add(cb)
  }
  removeOnConnected(cb: ((peer: string) => void)) {
    this._onConnected.delete(cb)
  }
  updatePeerId(id: string | undefined, name: string) {
    this.peer.destroy()
    this.connections.clear()
    this.connected = false
    this.attempt = false
    this.id = id ?? makeid(6)
    if (name) {
      this.name = name
    }
    this.createPeer()
  }
  private createPeer() {
    var peer = new Peer(Net.Namespace+this.id);
    DEBUG || console.log("[net] my peer id:", peer.id)
    
    peer.on('open', (id) => {
      DEBUG || console.log('[net] My server peer ID is: ' + id);
    });
    peer.on('connection', (conn) => {
      DEBUG || console.log(`[net] Peer connected: ${conn.peer}`, conn.metadata)
      this.connected = true
      this.connections.set(conn.peer, conn)
      this.metadata.set(conn.peer, conn.metadata)

      conn.on("data", (data) => {
        const decoded: unknown = decode(data as any)
        DEBUG || console.log(`[net] data from ${conn.peer}`, decoded)
        const handshake = decoded as any as { ack: true, metadata: any }
        if (handshake.ack) {
          // send back out name since the host doesn't provide metadata :s
          queueMicrotask(() => {
            conn.send(encode({ ack: true, metadata: {
              name: this.name
            }}))
          })
          this._onConnected.forEach(cb => cb(conn.peer))
          return
        }
        this._onData.forEach(cb => cb(conn.peer, decoded))
      })
    });
    peer.on('disconnected', (peer) => {
      DEBUG || console.log(`[net] Peer disconnected: ${peer}`)
      this.connections.delete(peer)
      this.metadata.delete(peer)
      if (this.connections.size == 0) {
        this.connected = false
      }
    })
    this.peer = peer
  }
  connect(destination: string, playerName: string, cb: (success: boolean, peerId: string | undefined) => void) {
    DEBUG || console.log("[net] connecting to destination:", Net.Namespace+destination)
    var conn = this.peer.connect(Net.Namespace+destination, {
      metadata: {
        name: playerName
      }
    });
    this.attempt = true
    let waitingAck = true
    const timeout = setTimeout(() => {
      DEBUG || console.log("[net] connection timed out")
      conn.close()
      this.attempt = false
      cb(false, undefined)
    }, 10000);
    conn.on('open', () => {
      DEBUG || console.log("[net] opened")
      clearTimeout(timeout);
      this.attempt = false
      this.connected = true
      this.connections.set(conn.peer, conn)
      // send back ack with our name
      conn.send(encode({ ack: true, metadata: {
        name: playerName
      }}))
    });
    conn.on("data", (data: unknown) => {
      const decoded: unknown = decode(data as any)
      DEBUG || console.log(`[net] data from ${conn.peer}`, decoded)
      const handshake = decoded as any as { ack: true, metadata: any }
      if (handshake.ack) {
        if (waitingAck) {
          DEBUG || console.log("[net] connected")
          waitingAck = false
          this.metadata.set(conn.peer, { name: handshake.metadata.name })
          // wait for handshake before considering it a success
          cb(true, conn.peer);
        }
        return
      }
      this._onData.forEach(cb => cb(conn.peer, decoded))
    })
    conn.on("close", () => {
      DEBUG || console.log("[net] closed", conn.peer)
      this.connections.delete(conn.peer)
      this._onClose.forEach(cb => cb(conn.peer))
    })
  }
  send(data: any) {
    this.connections.forEach((connection) => {
      connection.send(encode(data))
    })
  }
}

export const net = new Net()
;(window as any).connect = net.connect

function makeid(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}