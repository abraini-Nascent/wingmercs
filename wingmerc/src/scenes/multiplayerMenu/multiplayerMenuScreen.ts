import { IDisposable } from '@babylonjs/core';
import { MainMenuScene } from '../mainMenu/mainMenuLoop';
import * as GUI from '@babylonjs/gui';
import { MercScreen } from "../screen"
import { AppContainer } from '../../app.container';
import { Engine, Observer } from '@babylonjs/core';
import { MainMenuButton, TextBlock, TextItem, clearSection } from '../components';
import { Align, Edge, FlexContainer, FlexDirection, FlexItem, Gutter, Justify } from '../../utils/guiHelpers';
import { PlayerAgent } from '../../agents/playerAgent';
import { net } from '../../world/systems/netSystems/net';
import { ReadyMessage } from '../../world/systems/netSystems/messages/readyMessage';
import { MissionMessage } from '../../world/systems/netSystems/messages/missionMessage';
import { TrainSimSceneMultiplayer } from '../spaceCombat/trainSim/trainSimLoop.multiPlayer';

class GameRoom implements IDisposable {
  connected = false
  host = false
  joined = false
  ready = false
  /** peerId to Player Name */
  others = new Map<string, {name: string, ready: boolean}>()

  onEvent: () => void
  onStart: () => void

  constructor() {
    net.onData(this.onData)
    net.onConnected(this.onConnected)
    net.onClose(this.onClose)
  }

  dispose(): void {
    net.removeOnData(this.onData)
    net.removeOnConnected(this.onConnected)
    net.removeOnClose(this.onClose)
  }

  private onData = (peer: string, data: unknown) => {
    const readyMessage = data as ReadyMessage
    if (readyMessage.type == "ready") {
      console.log("[net multiplayer] ready message", readyMessage.data.peerId, readyMessage.data.name, readyMessage.data.ready)
      this.others.set(readyMessage.data.peerId, { name: readyMessage.data.name, ready: readyMessage.data.ready })
      if (this.host) {
        // send the ready states to everyone when user updates ready state
        net.send({
          type: "ready",
          data: {
            name: net.metadata.get(peer)?.name ?? "Player",
            ready: readyMessage.data.ready,
            peerId: peer
          }
        } as ReadyMessage)
      }
      if (this.onEvent) {
        this.onEvent()
      }
    }
    const missionMessage = data as MissionMessage
    if (missionMessage.type == "mission") {
      // TODO: start the mission
      if (this.onStart) {
        this.onStart()
      }
    }
  }

  private onConnected = (peer: string) => {
    this.others.set(peer, { name: net.metadata.get(peer)?.name ?? "Player", ready: false })
    if (this.host) {
      // send the ready states to everyone when user connects
      console.log("[net multiplayer] sending states because peer connected", peer)
      for (let [peerId, state] of this.others.entries()) {
        console.log("[net multiplayer] sending state for", peerId, state)
        net.send({
          type: "ready",
          data: {
            name: state.name,
            ready: state.ready,
            peerId: peerId
          }
        } as ReadyMessage)
      }
    }
    if (this.onEvent) {
      this.onEvent()
    }
  }

  private onClose = (peer: string) => {
    this.others.delete(peer)
    if (this.onEvent) {
      this.onEvent()
    }
  }

  get everyoneReady(): boolean {
    let othersReady = true
    this.others.forEach((other) => { othersReady = (other.ready && othersReady) })
    return this.ready && othersReady
  }

  hostRoom(roomId: string, cb: (success: boolean) => void ) {
    // TODO: handle multiple people hosting with the same room name
    net.updatePeerId(roomId, PlayerAgent.playerName)
    this.host = true
    this.others.set(net.peer.id, {
      name: PlayerAgent.playerName,
      ready: false
    })
    cb(true)
    if (this.onEvent) {
      this.onEvent()
    }
  }

  joinRoom(roomId: string, cb: (success: boolean, connectedId: string) => void ) {
    net.connect(roomId, PlayerAgent.playerName, (success, peerId) => {
      if (success) {
        this.joined = true
        console.log("[net multiplayer] net.metadata.get(peerId)?.name ?? \"Host\"", net.metadata.get(peerId).name)
        // me
        this.others.set(net.peer.id, {
          name: PlayerAgent.playerName,
          ready: false
        })
        // them
        this.others.set(peerId, { name: net.metadata.get(peerId)?.name ?? "Host", ready: false }) // tho we should be getting updated data soon
      } else {
        this.joined = false
      }
      cb(success, peerId)
      if (this.onEvent) {
        this.onEvent()
      }
    })
  }

  leaveRoom() {
    net.updatePeerId(undefined, PlayerAgent.playerName)
    this.host = false
    this.joined = false
  }

  readyUp(name: string, ready: boolean) {
    this.ready = ready
    this.others.set(net.peer.id, {
      name: PlayerAgent.playerName,
      ready: ready
    })
    net.send({
      type: "ready",
      data: {
        peerId: net.peer.id,
        name,
        ready: ready
      }
    } as ReadyMessage)
    if (this.onEvent) {
      this.onEvent()
    }
  }

  start(): boolean {
    // maybe auto start when everyone is ready?
    if (this.host == false) {
      // only host can start
      return false
    }
    if (this.everyoneReady == false) {
      // only start when everyone is ready
      return false
    }
    net.send({
      type: "mission",
      data: {}
    } as MissionMessage)
    if (this.onStart) {
      this.onStart()
    }
    return true
  }
}

export class MultiplayerMenuScreen extends MercScreen {
  fullscreen: Observer<GUI.Vector2WithInfo>
  roomName: string = "bazinga"
  host: boolean = false
  ready: boolean = false
  gameroom = new GameRoom()
  constructor() {
    super("MultiplayerMenuScreen")
    this.setupMain()
  }
  dispose() {
    super.dispose()
    this.gameroom.dispose()
  }
  setupMain(): void {
    const mainPanel = new FlexContainer("main panel", this.gui)
    const mainScrollView = FlexContainer.CreateScrollView("Multiplayer Menu", mainPanel)
    mainScrollView.style.setJustifyContent(Justify.Center)
    mainScrollView.style.setAlignContent(Align.Center)
    
    const title = new GUI.TextBlock()
    title.name = "title"
    title.fontFamily = "Regular5"
    title.text = "-=Multiplayer=-"
    title.color = "gold"
    title.fontSizeInPixels = 60
    title.heightInPixels = 128
    title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    title.textHorizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    title.verticalAlignment = GUI.TextBlock.VERTICAL_ALIGNMENT_TOP
    title.paddingTopInPixels = 24
    mainScrollView.addControl(title)

    const label = this.createLabel("player name label", "Player Name: ")
    const input = new GUI.InputText("player name", "player")
    input.heightInPixels = 40
    input.widthInPixels = 255
    input.fontFamily  = "Regular5"
    input.color = "gold"
    input.onTextChangedObservable.add((event) => {
      console.log("[multiplayer] name event change", event.text)
      PlayerAgent.playerName = event.text
    })
    const nameRow = this.createCenteredRow("player name", label, input)
    nameRow.style.setMargin(Edge.Bottom, 15)
    mainScrollView.addControl(nameRow)

    const roomLabel = this.createLabel("room name label", "Room: ")
    const roomInput = new GUI.InputText("room name", this.roomName)
    roomInput.heightInPixels = 40
    roomInput.widthInPixels = 255
    roomInput.fontFamily  = "Regular5"
    roomInput.color = "gold"
    roomInput.onTextChangedObservable.add((event) => {
      console.log("[multiplayer] room event change", event.text)
      this.roomName = event.text
    })
    const roomRow = this.createCenteredRow("player name", roomLabel, roomInput)
    roomRow.style.setMargin(Edge.Bottom, 15)
    mainScrollView.addControl(roomRow)
    
    const playerListContainer = new FlexContainer("playerListContainer")
    playerListContainer.style.setAlignItems(Align.Center)
    playerListContainer.style.setFlex(1)
    mainScrollView.addControl(playerListContainer)

    const buttonContainer = new FlexContainer("button container")
    buttonContainer.style.setAlignItems(Align.Center)
    mainScrollView.addControl(buttonContainer)

    const hostButton = MainMenuButton("back", "Host");
    hostButton.onPointerClickObservable.add(() => {
      setTimeout(() => {
        if (this.gameroom.host == false && this.gameroom.joined == false) {
          hostButton.isEnabled = false
          joinButton.isEnabled = false
          this.gameroom.hostRoom(this.roomName, (success) => {
            hostButton.isEnabled = true
            joinButton.isEnabled = true
            if (success) {
              joinButton.isVisible = false
              hostButton.textBlock.text = "Leave"
              readyButton.isVisible = true
            } else {
              joinButton.isVisible = true
              readyButton.isVisible = false
              hostButton.textBlock.text = "Host"
            }
          })
          return
        }
        if (this.gameroom.host) {
          this.gameroom.leaveRoom()
          readyButton.isVisible = false
          joinButton.isVisible = true
          hostButton.textBlock.text = "Host"
        }
      }, 333)
    })
    buttonContainer.addControl(hostButton)

    const joinButton = MainMenuButton("join", "Join");
    joinButton.onPointerClickObservable.add(() => {
      setTimeout(() => {
        if (this.gameroom.host == false && this.gameroom.joined == false) {
          hostButton.isEnabled = false
          joinButton.isEnabled = false
          this.gameroom.joinRoom(this.roomName, (success) => {
            hostButton.isEnabled = true
            joinButton.isEnabled = true
            if (success) {
              hostButton.isVisible = false
              readyButton.isVisible = true
              joinButton.textBlock.text = "Leave"
            } else {
              hostButton.isVisible = true
              readyButton.isVisible = false
              joinButton.textBlock.text = "Join"
            }
          })
          return
        }
        if (this.gameroom.host) {
          this.gameroom.leaveRoom()
          readyButton.isVisible = false
          hostButton.isVisible = true
          joinButton.textBlock.text = "Join"
        }
      }, 333)
    })
    buttonContainer.addControl(joinButton)

    const readyButton = MainMenuButton("ready", "Ready");
    readyButton.onPointerClickObservable.add(() => {
      this.ready = !this.ready
      this.gameroom.readyUp(PlayerAgent.playerName, this.ready)
    })
    readyButton.isVisible = false
    buttonContainer.addControl(readyButton)

    const startButton = MainMenuButton("start", "Start");
    startButton.onPointerClickObservable.add(() => {
      this.gameroom.start()
    })
    startButton.isVisible = false
    buttonContainer.addControl(startButton)

    const backButton = MainMenuButton("back", "Back");
    backButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        AppContainer.instance.gameScene.dispose()
        AppContainer.instance.gameScene = new MainMenuScene()
      }, 333)
    })
    buttonContainer.addControl(backButton)

    this.gameroom.onEvent = () => {
      console.log("[net multiplayer] onEvent")
      clearSection(playerListContainer)
      for (let [id, other] of this.gameroom.others.entries()) {
        console.log("[net multiplayer] player:", other.name, other.ready)
        let nameLabel = this.createLabel(`other-${other.name}`, other.name)
        let readyLabel = this.createLabel(`other-${other.name}-ready`, other.ready ? "Ready" : "Waiting")
        let row = this.createRow(`other-${other.name}-row`, nameLabel, readyLabel)
        playerListContainer.addControl(row)
      }
      if (this.gameroom.everyoneReady && this.gameroom.host) {
        startButton.isVisible = true
      } else {
        startButton.isVisible = false
      }
    }

    this.gameroom.onStart = () => {
      const appContainer = AppContainer.instance
      appContainer.multiplayer = true
      if (this.gameroom.host) {
        appContainer.server = true
      } else {
        appContainer.server = false
      }
      appContainer.gameScene.dispose()
      appContainer.gameScene = new TrainSimSceneMultiplayer()
      this.dispose()
    }
  }

  private createCenteredRow(name: string, leftItem: GUI.Control | FlexItem, rightItem: GUI.Control | FlexItem): FlexContainer {
    const row = new FlexContainer("row_"+name)
    row.style.setFlexDirection(FlexDirection.Row)
    // row.style.setFlex(1)
    const left = new FlexContainer("left")
    left.style.setFlex(1)
    left.style.setAlignItems(Align.FlexEnd)
    left.style.setJustifyContent(Justify.Center)
    left.style.setMargin(Edge.Right, 15)
    const right = new FlexContainer("right")
    right.style.setAlignItems(Align.FlexStart)
    right.style.setFlex(1)
    row.addControl(left)
    row.addControl(right)
    left.addControl(leftItem)
    right.addControl(rightItem)
    return row
  }

  private createRow(name: string, label: GUI.Control | FlexItem, item: GUI.Control | FlexItem): FlexContainer {
    const row = new FlexContainer(name)
    row.style.setFlexDirection(FlexDirection.Row)
    // row.style.setFlex(1)
    row.style.setJustifyContent(Justify.Center)
    row.style.setGap(Gutter.All, 15)
    row.addControl(label)
    row.addControl(item)
    return row
  }

  private createLabel(name: string, text: string): FlexItem {
    return TextItem(TextBlock(name, text, true))
  }
}