import { MainMenuScene } from "./../mainMenu/mainMenuLoop"
import { AppContainer } from "./../../app.container"
import { IDisposable } from "@babylonjs/core"
import * as GUI from "@babylonjs/gui"
import { MercScreen } from "../screen"
import { Engine, Observer } from "@babylonjs/core"
import {
  MainMenuButton,
  TextBlock,
  TextItem,
  clearSection,
} from "../components"
import {
  Align,
  Edge,
  FlexContainer,
  FlexDirection,
  FlexItem,
  Gutter,
  Justify,
} from "../../utils/guiHelpers"
import { PlayerAgent } from "../../agents/playerAgent"
import { net } from "../../world/systems/netSystems/net"
import { ReadyMessage } from "../../world/systems/netSystems/messages/readyMessage"
import { MissionMessage } from "../../world/systems/netSystems/messages/missionMessage"
import { TrainSimSceneMultiplayer } from "../spaceCombat/trainSim/trainSimLoop.multiPlayer"
import { MercStorage } from "../../utils/storage"
import { DisposeBag, fg, FluentContainer, FluentInputText, FluentScrollViewer, FluentSimpleButton, FluentStackPanel, FluentTextBlock, Ref } from "../../utils/fluentGui"

class GameRoom implements IDisposable {
  connected = false
  host = false
  joined = false
  ready = false
  /** peerId to Player Name */
  others = new Map<string, { name: string; ready: boolean }>()

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
      console.log(
        "[net multiplayer] ready message",
        readyMessage.data.peerId,
        readyMessage.data.name,
        readyMessage.data.ready
      )
      this.others.set(readyMessage.data.peerId, {
        name: readyMessage.data.name,
        ready: readyMessage.data.ready,
      })
      if (this.host) {
        // send the ready states to everyone when user updates ready state
        net.send({
          type: "ready",
          data: {
            name: net.metadata.get(peer)?.name ?? "Player",
            ready: readyMessage.data.ready,
            peerId: peer,
          },
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
    this.others.set(peer, {
      name: net.metadata.get(peer)?.name ?? "Player",
      ready: false,
    })
    if (this.host) {
      // send the ready states to everyone when user connects
      console.log(
        "[net multiplayer] sending states because peer connected",
        peer
      )
      for (let [peerId, state] of this.others.entries()) {
        console.log("[net multiplayer] sending state for", peerId, state)
        net.send({
          type: "ready",
          data: {
            name: state.name,
            ready: state.ready,
            peerId: peerId,
          },
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
    this.others.forEach((other) => {
      othersReady = other.ready && othersReady
    })
    return this.ready && othersReady
  }

  hostRoom(roomId: string, cb: (success: boolean) => void) {
    // TODO: handle multiple people hosting with the same room name
    net.updatePeerId(roomId, PlayerAgent.playerName)
    this.host = true
    this.others.set(net.peer.id, {
      name: PlayerAgent.playerName,
      ready: false,
    })
    cb(true)
    if (this.onEvent) {
      this.onEvent()
    }
  }

  joinRoom(
    roomId: string,
    cb: (success: boolean, connectedId: string) => void
  ) {
    net.connect(roomId, PlayerAgent.playerName, (success, peerId) => {
      if (success) {
        this.joined = true
        console.log(
          '[net multiplayer] net.metadata.get(peerId)?.name ?? "Host"',
          net.metadata.get(peerId).name
        )
        // me
        this.others.set(net.peer.id, {
          name: PlayerAgent.playerName,
          ready: false,
        })
        // them
        this.others.set(peerId, {
          name: net.metadata.get(peerId)?.name ?? "Host",
          ready: false,
        }) // tho we should be getting updated data soon
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
    this.others.clear()
    if (this.onEvent) {
      this.onEvent()
    }
  }

  readyUp(name: string, ready: boolean) {
    this.ready = ready
    this.others.set(net.peer.id, {
      name: PlayerAgent.playerName,
      ready: ready,
    })
    net.send({
      type: "ready",
      data: {
        peerId: net.peer.id,
        name,
        ready: ready,
      },
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
      data: {},
    } as MissionMessage)
    if (this.onStart) {
      this.onStart()
    }
    return true
  }
}

const LAST_ROOM_NAME_KEY = "merc_mp_room_name"
export class MultiplayerMenuScreen extends MercScreen {
  fullscreen: Observer<GUI.Vector2WithInfo>
  roomName: string = "boosh"
  host: boolean = false
  ready: boolean = false
  gameroom = new GameRoom()
  private disposeBag: DisposeBag = new DisposeBag()
  constructor() {
    super("MultiplayerMenuScreen")
    if (MercStorage.instance.isLocalStorageAvailable()) {
      this.roomName =
        MercStorage.instance.getValue(LAST_ROOM_NAME_KEY) ?? "boosh"
    }
    this.setupMainFluent()
  }
  dispose() {
    super.dispose()
    this.gameroom.dispose()
  }
  setupMainFluent(): void {
    /// Inputs
    const nameInput = new Ref<any>()
    const roomInput = new Ref<any>()

    /// Buttons
    const hostBtnRef = new Ref<GUI.Button>()
    const joinBtnRef = new Ref<GUI.Button>()
    const readyBtnRef = new Ref<GUI.Button>()
    const startBtnRef = new Ref<GUI.Button>()
    /// Sections
    const playersSectionRef = new Ref<GUI.StackPanel>()
    const styleButton = (button: GUI.Button) => {
      button.textBlock.fontFamily = "Regular5"
      button.textBlock.color = "gold"
      button.textBlock.fontSizeInPixels = 15
      // button.color = "blue"
      button.heightInPixels = 40
      button.widthInPixels = 280
      button.background = "black"
      return button
    }
    const styleText = <C extends GUI.Control>(tb: C) => {
      // tb.heightInPixels = 40
      tb.fontFamily = "Regular5"
      tb.color = "gold"
      tb.fontSizeInPixels = 15
      return tb
    }
    this.gameroom.onEvent = () => {
      console.log("[net multiplayer] onEvent")
      if (playersSectionRef.isValid()) {
        new FluentStackPanel(playersSectionRef.get()).updateControls([
          new FluentTextBlock(`players-heading`, `[${this.roomName}] Players List:`)
            .resizeToFit(true)
            .modifyControl(styleText)
            .fontSize(20)
            .boxPadding(15),
          ...Array.from(this.gameroom.others.values()).map(
            ({ name, ready }) => {
              return new fg.StackPanel(`players-${name}-row`,
                new FluentTextBlock(`players-${name}-name`, name)
                  .resizeToFit(true)
                  .modifyControl(styleText)
                  .boxPadding(15),
                new FluentTextBlock(
                  `players-${name}-ready`,
                  ready ? "Ready" : "Waiting"
                )
                  .resizeToFit(true)
                  .modifyControl(styleText)
                  .boxPadding(15)
              )
                .height(40)
                .setHorizontal()
            }
          ),
        ])
      }

      if (this.gameroom.everyoneReady && this.gameroom.host) {
        startBtnRef.get().isVisible = true
      } else {
        startBtnRef.get().isVisible = false
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

    const hideInputs = () => {
      nameInput.get().isVisible = false
      roomInput.get().isVisible = false
    }
    const showInputs = () => {
      nameInput.get().isVisible = true
      roomInput.get().isVisible = true
    }

    const mainPanel = new FluentContainer("main")
      .hostIn(this.gui)
      .verticalAlignment("top")
      .horizontalAlignment("center")
      .modifyControl(styleText)
      .addControl(
        new FluentScrollViewer("main-scroller",
          fg.VStack("main-stack",
            new FluentTextBlock("multiplayer-menue", "-=Multiplayer=-")
              .fontFamily("Regular5")
              .fontSize(25)
              .color("gold")
              .horizontalAlignment("center")
              .resizeToFit()
              .padding(24, 0, 0, 0),
            // player row
            fg.HStack("player-row",
              new FluentTextBlock("player-label", "Player Name: ")
                .resizeToFit()
                .boxPadding(0, 30, 0, 0),
              new FluentInputText("player-input", PlayerAgent.playerName)
                .width(255)
                .height(40)
                .fontFamily("Regular5")
                .color("gold")
                .onTextChanged(
                  (event) => (PlayerAgent.playerName = event.text), // Handling text change
                  this.disposeBag
                )
              )
              .boxPadding(15, 0, 15, 0)
              .storeIn(nameInput),
            // room row
            fg.HStack(
              "room-row",
              new FluentTextBlock("room-label", "Room Name: ")
                .resizeToFit(true)
                .boxPadding(0, 30, 0, 0),
              new FluentInputText("room-input", this.roomName)
                .width(255)
                .height(40)
                .fontFamily("Regular5")
                .color("gold")
                .onTextChanged((event) => {
                  this.roomName = event.text
                  MercStorage.instance.setValue(LAST_ROOM_NAME_KEY, event.text)
                }, this.disposeBag) // Handling text change
              )
              .boxPadding(15, 0, 15, 0)
              .storeIn(roomInput),
            fg.VStack("players-list-container")
              .adaptHeightToChildren()
              .adaptWidthToChildren()
              .storeIn(playersSectionRef),
            // buttons container
            fg.VStack("buttons-container",
              new FluentSimpleButton("host-button", "Host")
                .modifyControl(styleButton)
                .onClick(() => {
                  hostBtnRef.get().isEnabled = false
                  joinBtnRef.get().isEnabled = false
                  if (this.gameroom.host) {
                    this.gameroom.leaveRoom()
                    readyBtnRef.get().isVisible = false
                    joinBtnRef.get().isVisible = true
                    hostBtnRef.get().textBlock.text = "Host"
                    hostBtnRef.get().isEnabled = true
                    joinBtnRef.get().isEnabled = true
                    showInputs()
                  } else {
                    this.gameroom.hostRoom(this.roomName, (success) => {
                      hostBtnRef.get().isEnabled = true
                      joinBtnRef.get().isEnabled = true
                      if (success) {
                        joinBtnRef.get().isVisible = false
                        hostBtnRef.get().textBlock.text = "Leave"
                        readyBtnRef.get().isVisible = true
                        hideInputs()
                      } else {
                        joinBtnRef.get().isVisible = true
                        readyBtnRef.get().isVisible = false
                        hostBtnRef.get().textBlock.text = "Host"
                      }
                    })
                  }
                }, this.disposeBag)
                .storeIn(hostBtnRef),
              new FluentSimpleButton("join-button", "Join")
                .modifyControl(styleButton)
                .onClick(() => {
                  setTimeout(() => {
                    if (
                      this.gameroom.host == false &&
                      this.gameroom.joined == false
                    ) {
                      hostBtnRef.get().isEnabled = false
                      joinBtnRef.get().isEnabled = false
                      this.gameroom.joinRoom(this.roomName, (success) => {
                        hostBtnRef.get().isEnabled = true
                        joinBtnRef.get().isEnabled = true
                        if (success) {
                          hostBtnRef.get().isVisible = false
                          readyBtnRef.get().isVisible = true
                          joinBtnRef.get().textBlock.text = "Leave"
                          hideInputs()
                        } else {
                          hostBtnRef.get().isVisible = true
                          readyBtnRef.get().isVisible = false
                          joinBtnRef.get().textBlock.text = "Join"
                        }
                      })
                      return
                    }
                    if (this.gameroom.host) {
                      this.gameroom.leaveRoom()
                      readyBtnRef.get().isVisible = false
                      hostBtnRef.get().isVisible = true
                      joinBtnRef.get().textBlock.text = "Join"
                      showInputs()
                    }
                  }, 333)
                }, this.disposeBag)
                .storeIn(joinBtnRef),
              new FluentSimpleButton("ready-button", "Ready")
                .modifyControl(styleButton)
                .onClick(() => {
                  this.ready = !this.ready
                  readyBtnRef.get().textBlock.text = this.ready
                    ? "Unready"
                    : "Ready"
                  this.gameroom.readyUp(PlayerAgent.playerName, this.ready)
                }, this.disposeBag)
                .hide()
                .storeIn(readyBtnRef),
              new FluentSimpleButton("start-button", "Start")
                .modifyControl(styleButton)
                .onClick(() => {
                  this.gameroom.start()
                }, this.disposeBag)
                .hide()
                .storeIn(startBtnRef),
              new FluentSimpleButton("exit-button", "Exit")
                .modifyControl(styleButton)
                .onClick(() => {
                  const appContainer = AppContainer.instance
                  appContainer.gameScene.dispose()
                  appContainer.gameScene = new MainMenuScene()
                  this.dispose()
                }, this.disposeBag)
              )
              .horizontalAlignment("center")
          )
          .verticalAlignment("top")
        )
        .verticalAlignment("top")
        .horizontalAlignment("center")
      )
  }

  setupMain(): void {
    const mainPanel = new FlexContainer("main panel", this.gui)
    mainPanel.style.setFlex(1)
    mainPanel.style.setFlexDirection(FlexDirection.Column)
    const mainScrollView = FlexContainer.CreateScrollView(
      "Multiplayer Menu",
      mainPanel
    )
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
    mainPanel.addControl(title)

    const label = this.createLabel("player name label", "Player Name: ")
    const input = new GUI.InputText("player name", PlayerAgent.playerName)
    input.heightInPixels = 40
    input.widthInPixels = 255
    input.fontFamily = "Regular5"
    input.color = "gold"
    input.onTextChangedObservable.add((event) => {
      console.log("[multiplayer] name event change", event.text)
      PlayerAgent.playerName = event.text
    })
    const nameRow = this.createCenteredRow("player name", label, input)
    nameRow.style.setMargin(Edge.Bottom, 15)
    mainPanel.addControl(nameRow)

    const roomLabel = this.createLabel("room name label", "Room: ")
    const roomInput = new GUI.InputText("room name", this.roomName)
    roomInput.heightInPixels = 40
    roomInput.widthInPixels = 255
    roomInput.fontFamily = "Regular5"
    roomInput.color = "gold"
    roomInput.onTextChangedObservable.add((event) => {
      console.log("[multiplayer] room event change", event.text)
      this.roomName = event.text
      if (MercStorage.instance.isLocalStorageAvailable()) {
        MercStorage.instance.setValue(LAST_ROOM_NAME_KEY, event.text)
      }
    })
    const roomRow = this.createCenteredRow("player name", roomLabel, roomInput)
    roomRow.style.setMargin(Edge.Bottom, 15)
    mainPanel.addControl(roomRow)

    mainPanel.addControl(mainScrollView)

    const buttonContainer = new FlexContainer("button container")
    buttonContainer.style.setAlignItems(Align.Center)
    mainPanel.addControl(buttonContainer)

    const hostButton = MainMenuButton("back", "Host")
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

    const joinButton = MainMenuButton("join", "Join")
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

    const readyButton = MainMenuButton("ready", "Ready")
    readyButton.onPointerClickObservable.add(() => {
      this.ready = !this.ready
      this.gameroom.readyUp(PlayerAgent.playerName, this.ready)
    })
    readyButton.isVisible = false
    buttonContainer.addControl(readyButton)

    const startButton = MainMenuButton("start", "Start")
    startButton.onPointerClickObservable.add(() => {
      this.gameroom.start()
    })
    startButton.isVisible = false
    buttonContainer.addControl(startButton)

    const backButton = MainMenuButton("back", "Back")
    backButton.onPointerClickObservable.addOnce(() => {
      setTimeout(() => {
        AppContainer.instance.gameScene.dispose()
        AppContainer.instance.gameScene = new MainMenuScene()
      }, 333)
    })
    buttonContainer.addControl(backButton)

    this.gameroom.onEvent = () => {
      console.log("[net multiplayer] onEvent")
      clearSection(mainScrollView)

      for (let [id, other] of this.gameroom.others.entries()) {
        console.log(
          "[net multiplayer] player:",
          other.name,
          "ready:",
          other.ready
        )
        let nameLabel = this.createLabel(`other-${other.name}`, other.name)
        let readyLabel = this.createLabel(
          `other-${other.name}-ready`,
          other.ready ? "Ready" : "Waiting"
        )
        let row = this.createRow(
          `other-${other.name}-row`,
          nameLabel,
          readyLabel
        )
        mainScrollView.addControl(row)
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

  private createCenteredRow(
    name: string,
    leftItem: GUI.Control | FlexItem,
    rightItem: GUI.Control | FlexItem
  ): FlexContainer {
    const row = new FlexContainer("row_" + name)
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

  private createRow(
    name: string,
    label: GUI.Control | FlexItem,
    item: GUI.Control | FlexItem
  ): FlexContainer {
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
