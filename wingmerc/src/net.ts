import { DataConnection, Peer } from "peerjs"



class Net {
  peer: Peer
  id: string = makeid(6)
  conn: DataConnection
  constructor() {
    var peer = new Peer("wingmercs-0_0-"+this.id);
    console.log("[net] peer id:", peer.id)
    
    peer.on('open', (id) => {
      console.log('[net] My peer ID is: ' + id);
    });
    
    peer.on('connection', (conn) => {
      this.conn = conn
      // Receive messages
      conn.on('data', () => {
        // console.log('Received', data);
      });
    });
    this.peer = peer
  }
  connect(destination) {
    var conn = this.peer.connect("wingmercs-0_0-"+destination);
  
    conn.on('open', () => {
      this.conn = conn

      // Receive messages
      conn.on('data', () => {
        // console.log('Received', data);
      });
    });
  }
  send(data: unknown) {
    this.conn.send(data)
  }
  onData(cb: (data: unknown) => void) {
    this.conn.on('data', (data) => cb(data))
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