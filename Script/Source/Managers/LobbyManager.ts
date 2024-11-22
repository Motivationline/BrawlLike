namespace Script {
    // import ƒ = FudgeCore;
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

            document.getElementById("room-code").addEventListener("input", this.inputRoom);
            (<HTMLInputElement>document.getElementById("room-code")).value = "";
            (<HTMLButtonElement>document.getElementById("lobby-join")).disabled = true;
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
                        // this.updateVisibleRooms();
                        break;
                    case ƒNet.COMMAND.ROOM_ENTER:
                        // RiveManager.joinRoom(this.client.idRoom);
                    case ƒNet.COMMAND.SERVER_HEARTBEAT:
                        this.updateRoom();
                        break;
                    case ƒNet.COMMAND.UNDEFINED:
                        this.handleUndefined(message);
                        break;
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

        // static updateVisibleRooms() {
        //     return;
        //     if (this.client.idRoom !== "Lobby") return;
        //     document.getElementById("client-id").innerText = this.client.id;
        //     document.getElementById("client-name").innerText = this.client.name;
        //     let listElement: HTMLUListElement = <HTMLUListElement>document.getElementById("open-lobbies");
        //     let newChildren: HTMLElement[] = [];

        //     if (Object.keys(this.rooms).length <= 1) {
        //         let span = document.createElement("span");
        //         span.innerText = "No games going on. Why don't you host yourself?";
        //         newChildren.push(span);
        //     } else {
        //         for (let room in this.rooms) {
        //             if (room === "Lobby") continue;
        //             let li = document.createElement("li");
        //             li.innerText = `${room} - ${this.rooms[room]} Players`;
        //             li.dataset.room = room;
        //             li.addEventListener("click", this.selectRoom);
        //             li.classList.add("room");
        //             if (room === this.selectedRoom) li.classList.add("selected");
        //             newChildren.push(li);
        //         }
        //     }
        //     listElement.replaceChildren(...newChildren);
        // }

        static hostRoom = () => {
            this.client.dispatch({ command: FudgeNet.COMMAND.ROOM_CREATE, route: FudgeNet.ROUTE.SERVER });
        }

        static inputRoom = (_event: Event) => {
            let element = <HTMLInputElement>_event.target;
            let value = element.value;
            if (value.length === 5) {
                this.selectedRoom = value.toLocaleLowerCase();
                (<HTMLButtonElement>document.getElementById("lobby-join")).disabled = false;
            } else {
                (<HTMLButtonElement>document.getElementById("lobby-join")).disabled = true;
            }
        }

        // static selectRoom = (_event: Event) => {
        //     let target = <HTMLLIElement>_event.target;
        //     document.querySelectorAll("li.room").forEach(el => el.classList.remove("selected"));
        //     this.selectedRoom = target.dataset.room;
        //     target.classList.add("selected");
        //     (<HTMLButtonElement>document.getElementById("lobby-join")).disabled = false;
        // }

        static joinRoom = () => {
            // (<HTMLButtonElement>document.getElementById("lobby-join")).disabled = true;
            if (!this.selectedRoom) return;
            let roomID = `_${this.selectedRoom}`;
            if (!this.rooms[roomID]) {
                alert("Room not found");
                return;
            }
            client.dispatch({ command: FudgeNet.COMMAND.ROOM_ENTER, route: FudgeNet.ROUTE.SERVER, content: { room: roomID } });
            this.selectedRoom = "";
            menuManager.joinRoom();
        }
        static leaveRoom = () => {
            client.dispatch({ command: FudgeNet.COMMAND.ROOM_ENTER, route: FudgeNet.ROUTE.SERVER, content: { room: "Lobby" } });
            this.selectedRoom = "";
        }

        static updateRoom = () => {
            if (this.client.idRoom === "Lobby") return;
            if (document.getElementById("game-lobby-id").innerText.toLocaleLowerCase() !== `${this.client.idRoom.substring(1).toLocaleLowerCase()}`)
                document.getElementById("game-lobby-id").innerText = `${this.client.idRoom.substring(1)}`;

            let players: HTMLElement[] = [];

            for (let client in this.client.clientsInfoFromServer) {
                let li = document.createElement("li");
                li.innerText = `${this.client.clientsInfoFromServer[client].name} (id: ${client}) ${client === this.client.id ? "(you)" : ""}`;
                players.push(li);
            }

            document.getElementById("connected-players").replaceChildren(...players);
        }

        static handleUndefined(_message: ƒNet.Message) {
            switch (_message.content.command) {
                case "switchView":
                    menuManager.showOverlay(_message.content.data);
                    break;
                case "selectBrawler":
                    GameManager.Instance.selectBrawler(_message.content.data, _message.idSource);
                    break;
                case "startGame":
                    GameManager.Instance.settings = _message.content.data.settings;
                    GameManager.Instance.teams = _message.content.data.teams;
                    GameManager.Instance.startGame();
                    break;
            }
        }

        static switchView(_view: MENU_TYPE) {
            this.client.dispatch({ command: FudgeNet.COMMAND.UNDEFINED, route: FudgeNet.ROUTE.VIA_SERVER, content: { command: "switchView", data: _view } });
        }
        static selectBrawler(_brawler: string) {
            this.client.dispatch({ command: FudgeNet.COMMAND.UNDEFINED, route: FudgeNet.ROUTE.VIA_SERVER, content: { command: "selectBrawler", data: _brawler } });
        }
        static startGame() {
            this.client.dispatch({ command: FudgeNet.COMMAND.UNDEFINED, route: FudgeNet.ROUTE.VIA_SERVER, content: { command: "startGame", data: { settings: GameManager.Instance.settings, teams: GameManager.Instance.teams } } });
        }
    }
}