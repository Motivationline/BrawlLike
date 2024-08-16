namespace Script {
    import ƒ = FudgeCore;
    import ƒNet = FudgeNet;
    export class LobbyManager {
        static client: FudgeNet.FudgeClient;
        static rooms: { [roomId: string]: number }
        static refreshInterval: number;
        static selectedRoom: string = "";

        static installListeners() {
            this.client.addEventListener(ƒNet.EVENT.MESSAGE_RECEIVED, <EventListenerOrEventListenerObject>this.messageHandler.bind(this));
            this.refreshRooms();
            this.refreshInterval = setInterval(this.refreshRooms, 5000);
            document.getElementById("lobby-host").addEventListener("click", this.hostRoom);
            document.getElementById("lobby-join").addEventListener("click", this.joinRoom);
            document.getElementById("game-lobby-cancel").addEventListener("click", this.leaveRoom);
            
        }

        static refreshRooms = () => {
            this.client.dispatch({ command: FudgeNet.COMMAND.ROOM_GET_IDS, route: FudgeNet.ROUTE.SERVER });
        }

        static messageHandler(_event: CustomEvent | MessageEvent) {
            if (_event instanceof MessageEvent) {
                let message: ƒNet.Message = JSON.parse(_event.data);
                switch (message.command) {
                    case ƒNet.COMMAND.ROOM_GET_IDS:
                        this.rooms = message.content.rooms;
                        this.updateVisibleRooms();
                        break;
                    case ƒNet.COMMAND.ROOM_ENTER:
                    case ƒNet.COMMAND.SERVER_HEARTBEAT:
                        this.updateRoom();
                        break;
                    // case ƒNet.COMMAND.UNDEFINED:
                    // case ƒNet.COMMAND.ERROR:
                    // case ƒNet.COMMAND.ASSIGN_ID:
                    // case ƒNet.COMMAND.LOGIN_REQUEST:
                    // case ƒNet.COMMAND.LOGIN_RESPONSE:
                    // case ƒNet.COMMAND.SERVER_HEARTBEAT:
                    // case ƒNet.COMMAND.CLIENT_HEARTBEAT:
                    // case ƒNet.COMMAND.RTC_OFFER:
                    // case ƒNet.COMMAND.RTC_ANSWER:
                    // case ƒNet.COMMAND.ICE_CANDIDATE:
                    // case ƒNet.COMMAND.CREATE_MESH:
                    // case ƒNet.COMMAND.CONNECT_HOST:
                    // case ƒNet.COMMAND.CONNECT_PEERS:
                    // case ƒNet.COMMAND.DISCONNECT_PEERS:
                    // case ƒNet.COMMAND.ROOM_CREATE:
                }
            }
        }

        static updateVisibleRooms() {
            if(this.client.idRoom !== "Lobby") return;
            document.getElementById("client-id").innerText = this.client.id;
            document.getElementById("client-name").innerText = this.client.name;
            let listElement: HTMLUListElement = <HTMLUListElement>document.getElementById("open-lobbies");
            let newChildren: HTMLElement[] = [];

            if (Object.keys(this.rooms).length <= 1) {
                let span = document.createElement("span");
                span.innerText = "No games going on. Why don't you host yourself?";
                newChildren.push(span);
            } else {
                for (let room in this.rooms) {
                    if (room === "Lobby") continue;
                    let li = document.createElement("li");
                    li.innerText = `${room} - ${this.rooms[room]} Players`;
                    li.dataset.room = room;
                    li.addEventListener("click", this.selectRoom);
                    li.classList.add("room");
                    if (room === this.selectedRoom) li.classList.add("selected");
                    newChildren.push(li);
                }
            }
            listElement.replaceChildren(...newChildren);
        }

        static hostRoom = () => {
            this.client.dispatch({ command: FudgeNet.COMMAND.ROOM_CREATE, route: FudgeNet.ROUTE.SERVER });
        }

        static selectRoom = (_event: MouseEvent) => {
            let target = <HTMLLIElement>_event.target;
            document.querySelectorAll("li.room").forEach(el => el.classList.remove("selected"));
            this.selectedRoom = target.dataset.room;
            target.classList.add("selected");
            (<HTMLButtonElement>document.getElementById("lobby-join")).disabled = false;
        }

        static joinRoom = () => {
            (<HTMLButtonElement>document.getElementById("lobby-join")).disabled = true;
            if(!this.selectedRoom) return;
            client.dispatch({ command: FudgeNet.COMMAND.ROOM_ENTER, route: FudgeNet.ROUTE.SERVER, content: { room: this.selectedRoom } });
            this.selectedRoom = "";
        }
        static leaveRoom = () => {
            client.dispatch({ command: FudgeNet.COMMAND.ROOM_ENTER, route: FudgeNet.ROUTE.SERVER, content: { room: "Lobby" } });
            this.selectedRoom = "";
        }

        static updateRoom = () => {
            if(this.client.idRoom === "Lobby") return;
            document.getElementById("game-lobby-id").innerText = `Room id: ${this.client.idRoom}`;

            let players: HTMLElement[] = [];

            for(let client in this.client.clientsInfoFromServer){
                let li = document.createElement("li");
                li.innerText = `${this.client.clientsInfoFromServer[client].name} (id: ${client}) ${client === this.client.id ? "(you)" : ""}`;
                players.push(li);
            }

            document.getElementById("connected-players").replaceChildren(...players);
        }
    }
}