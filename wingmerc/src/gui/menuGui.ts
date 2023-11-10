import { AdvancedDynamicTexture, Button, InputText, TextBlock } from "@babylonjs/gui";
import mainContent from "./data/mainMenuGui.json"
import hostContent from "./data/hostMenuGui.json"
import joinContent from "./data/joinMenuGui.json"
import { Observer } from "@babylonjs/core";
import { net } from "../net";
export class MenuGui {
  gui: AdvancedDynamicTexture
  peerId: string
  connectedPeers: Set<string> = new Set()
  peerIdtextInputObserver: Observer<InputText>
  connectedPeersInterval: number
  onStart: () => void
  onConnected: (peerId: string) => void
  constructor() {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("myUI");
    this.gui = advancedTexture
    this.setupMain()
  }
  setPeerId(id) {
    this.peerId = id
    const textblock = this.gui.getControlByName("PeerIdTextBlock") as TextBlock
    if (textblock != undefined) {
      textblock.text = id
    }
  }
  peerConnected(id: string) {
    this.connectedPeers.add(id)
    this.updateConnectedPeers()
  }
  peerDisconnected(id: string) {
    this.connectedPeers.delete(id)
    this.updateConnectedPeers()
  }
  close() {
    if (this.connectedPeersInterval) {
      clearInterval(this.connectedPeersInterval)
    }
    if (this.peerIdtextInputObserver) {
      this.peerIdtextInputObserver.remove()
    }
    this.gui.dispose()
    this.onStart = undefined
    this.onConnected = undefined
  }
  setupMain() {
    this.clearConnectedPeers()
    this.gui.parseSerializedObject(mainContent)
    this.gui.getControlByName("SinglePlayerButton").onPointerClickObservable.add(() => {
      this.onStart()
    })
    this.gui.getControlByName("HostButton").onPointerClickObservable.add(() => {
      this.setupHost()
    })
    this.gui.getControlByName("JoinButton").onPointerClickObservable.add(() => {
      this.setupJoin()
    })
  }
  setupHost() {
    this.clearConnectedPeers()
    this.gui.parseSerializedObject(hostContent)
    const textblock = this.gui.getControlByName("PeerIdTextBlock") as TextBlock
    if (textblock != undefined) {
      textblock.text = this.peerId
    }
    this.gui.getControlByName("StartButton").onPointerClickObservable.add(() => {
      if (this.onStart) {
        this.onStart()
      }
    })
    this.gui.getControlByName("BackButton").onPointerClickObservable.add(() => {
      this.setupMain()
    })
    this.updateConnectedPeers()
  }
  setupJoin() {
    this.clearConnectedPeers()
    this.gui.parseSerializedObject(joinContent);
    if (this.peerIdtextInputObserver != undefined) {
      this.peerIdtextInputObserver.remove()
    }
    const peerIdInputSubscription = (this.gui.getControlByName("PeerIdInputText") as InputText).onTextChangedObservable.add((textInput, event) => {
      textInput.text = textInput.text.toUpperCase()
    })
    this.peerIdtextInputObserver = peerIdInputSubscription
    const textblock = this.gui.getControlByName("PeerIdTextBlock") as TextBlock
    if (textblock != undefined) {
      textblock.text = this.peerId
    }
    this.gui.getControlByName("JoinButton").onPointerClickObservable.add(() => {
      if (this.onConnected) {
        const peerId = (this.gui.getControlByName("PeerIdInputText") as InputText).text
        net.connect(peerId, (connected) => {
          if (connected) {
            this.onConnected(peerId);
          } else {
            (this.gui.getControlByName("PeerIdInputText") as InputText).isVisible = true;
            (this.gui.getControlByName("JoinButton") as Button).isVisible = true;
          }
        });
        (this.gui.getControlByName("PeerIdInputText") as InputText).isVisible = false;
        (this.gui.getControlByName("JoinButton") as Button).isVisible = false;
      }
    })
    this.gui.getControlByName("BackButton").onPointerClickObservable.add(() => {
      this.setupMain()
    })
    this.updateConnectedPeers()
  }
  updateConnectedPeers() {
    this.connectedPeersInterval = setInterval(() => {
      if (net.conn) {
        const textblock = this.gui.getControlByName("ConnectedPeersTextBlock") as TextBlock
        textblock.text = net.conn.peer.replace(net.namespace, "")
      } else {
        const textblock = this.gui.getControlByName("ConnectedPeersTextBlock") as TextBlock
        if (textblock.text == "|") {
          textblock.text = "-"
        } else {
          textblock.text = "|"
        }
      }
    }, 1000)
  }
  clearConnectedPeers() {
    if (this.connectedPeersInterval) {
      clearInterval(this.connectedPeersInterval)
      this.connectedPeersInterval = undefined
    }
  }
}