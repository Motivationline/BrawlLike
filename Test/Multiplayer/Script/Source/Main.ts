/// <reference path="MultiplayerManager.ts" />
namespace Script {
  import ƒ = FudgeCore;
  import ƒNet = FudgeNet;
  ƒ.Debug.info("Main Program Template running!");

  export let viewport: ƒ.Viewport;
  document.addEventListener("interactiveViewportStarted", <EventListener>start);
  let rooms: string[] = [];


  const client = new ƒNet.FudgeClient();
  client.connectToServer("wss://motivationline.plagiatus.net");
  client.addEventListener(ƒNet.EVENT.MESSAGE_RECEIVED, <EventListener><unknown>receiveMessage);
  const playerName = prompt("PlayerName", "Player" + Math.floor(Math.random() * 10000 + 1));
  let interval: number;
  MultiplayerManager.client = client;
  MultiplayerManager.installListeners();

  function start(_event: CustomEvent): void {
    viewport = _event.detail;
    client.loginToServer(playerName);

    ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, update);
    ƒ.Loop.start();  // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a

    // document.getElementById("btn-join").addEventListener("click", joinRoom);
    document.getElementById("btn-create").addEventListener("click", createRoom);
    document.getElementById("btn-refresh").addEventListener("click", refreshRooms);

    refreshRooms();
    interval = setInterval(refreshRooms, 5000);
  }

  function update(_event: Event): void {
    ƒ.Physics.simulate();  // if physics is included and used
    viewport.draw();
    ƒ.AudioManager.default.update();
  }

  async function receiveMessage(_event: CustomEvent | MessageEvent) {
    if (_event instanceof MessageEvent) {
      let message: ƒNet.Message = JSON.parse(_event.data);
      if (message.command === ƒNet.COMMAND.SERVER_HEARTBEAT) {
        if (client.name == undefined) {
        }
        client.dispatch({ command: ƒNet.COMMAND.CLIENT_HEARTBEAT })
        return;
      }
      // console.table(message);


      switch (message.command) {
        case ƒNet.COMMAND.ROOM_CREATE: {
          console.log("created room", message.content.room);
          rooms.push(message.content.room);
          updateVisibleRooms();
          // client.dispatch({command: ƒNet.COMMAND.ROOM_ENTER})
          break;
        }
        case ƒNet.COMMAND.ROOM_GET_IDS: {
          rooms = message.content.rooms;
          updateVisibleRooms();
          break;
        }
      }
    }

  }

  function joinRoom(_room: string) {
    // let idRoom: string = (<HTMLInputElement>document.getElementById("room")).value;
    if (!rooms.includes(_room)) return;
    console.log("Enter", _room);
    client.dispatch({ command: FudgeNet.COMMAND.ROOM_ENTER, route: FudgeNet.ROUTE.SERVER, content: { room: _room } });
    client.idRoom = _room;

    loadGame();
  }
  function createRoom() {
    client.dispatch({ command: FudgeNet.COMMAND.ROOM_CREATE, route: FudgeNet.ROUTE.SERVER });
  }
  function refreshRooms() {
    client.dispatch({ command: FudgeNet.COMMAND.ROOM_GET_IDS, route: FudgeNet.ROUTE.SERVER });
  }
  function updateVisibleRooms() {
    let roomsToDisplay: HTMLElement[] = [];
    for(let room of rooms){
      let btn = document.createElement("button");
      btn.innerText = room;
      btn.addEventListener("click", () => {
        joinRoom(room);
      });
      roomsToDisplay.push(btn);
    }
    document.getElementById("rooms").replaceChildren(...roomsToDisplay);
  }

  async function loadGame() {
    clearInterval(interval);
    let graph = <ƒ.Graph>ƒ.Project.getResourcesByName("Map")[0];
    viewport.setBranch(graph);
    document.getElementById("rooms-wrapper").remove();
    
    let player = <ƒ.Graph>ƒ.Project.getResourcesByName("Player")[0];
    let instance = await ƒ.Project.createGraphInstance(player);
    graph.addChild(instance);
    instance.mtxLocal.translation = new ƒ.Vector3();
    viewport.camera = instance.getComponent(ƒ.ComponentCamera);
    let playerScript = new PlayerScript(true)
    instance.addComponent(playerScript);
    playerScript.setupId();

    MultiplayerManager.broadcastJoin();
  }
}

