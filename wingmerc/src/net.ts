import { DataConnection, Peer } from "peerjs"

class Net {
  peer: Peer
  id: string = makeid(6)
  conn: DataConnection
  static Namespace = "wingmercs-0_0-"
  get namespace() { return Net.Namespace }
  constructor() {
    var peer = new Peer(Net.Namespace+this.id);
    console.log("[net] peer id:", peer.id)
    
    peer.on('open', (id) => {
      console.log('[net] My peer ID is: ' + id);
    });
    
    peer.on('connection', (conn) => {
      this.conn = conn
    });
    this.peer = peer
  }
  connect(destination, cb: (boolean) => void) {
    var conn = this.peer.connect(Net.Namespace+destination);
    const timeout = setTimeout(() => {
      conn.close()
      cb(false)
    }, 1000);
    conn.on('open', () => {
      clearTimeout(timeout);
      this.conn = conn
      cb(true);
    });
  }
  send(data: unknown) {
    this.conn.send(data)
  }
  onData(cb: (data: unknown) => void) {
    this.conn.on('data', (data) => cb(data))
  }
  onClose(cb: () => void) {
    this.conn.on('close', () => cb)
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