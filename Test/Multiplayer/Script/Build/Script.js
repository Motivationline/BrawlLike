"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    var ƒNet = FudgeNet;
    let MessageCommand;
    (function (MessageCommand) {
        MessageCommand[MessageCommand["SYNC"] = 0] = "SYNC";
        MessageCommand[MessageCommand["DESTROY"] = 1] = "DESTROY";
        MessageCommand[MessageCommand["CREATE"] = 2] = "CREATE";
        MessageCommand[MessageCommand["JOIN"] = 3] = "JOIN";
    })(MessageCommand || (MessageCommand = {}));
    class MultiplayerManager {
        static { this.Instance = new MultiplayerManager(); }
        static #ownElementsToSync = new Map();
        static #otherElementsToSync = new Map();
        constructor() {
            if (MultiplayerManager.Instance)
                return MultiplayerManager.Instance;
        }
        static register(_syncComp) {
            if (_syncComp.ownerId === this.client.id) {
                this.#ownElementsToSync.set(_syncComp.id, _syncComp);
                this.broadcastCreation(_syncComp.creationData());
            }
            else if (_syncComp.ownerId !== this.client.id) {
                this.#otherElementsToSync.set(_syncComp.id, _syncComp);
            }
        }
        static installListeners() {
            this.client.addEventListener(ƒNet.EVENT.MESSAGE_RECEIVED, this.messageHandler.bind(this));
            setInterval(() => {
                let updateData = this.getUpdate();
                this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.SYNC, data: updateData } });
            }, 1000);
        }
        static broadcastCreation(_data) {
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.CREATE, data: _data } });
        }
        static getUpdate() {
            let data = {};
            for (let element of this.#ownElementsToSync.values()) {
                data[element.id] = element.getInfo();
            }
            return data;
        }
        static async applyUpdate(_data) {
            // console.log("apply Update", { _data })
            for (let element of this.#otherElementsToSync.values()) {
                let data = _data[element.id];
                if (data) {
                    element.putInfo(data);
                }
                delete _data[element.id];
            }
        }
        static async createObject(_data) {
            let graph = ƒ.Project.getResourcesByName(_data.resourceName)[0];
            let instance = await ƒ.Project.createGraphInstance(graph);
            Script.viewport.getBranch().addChild(instance);
            if (_data.resourceName === "Player") {
                let playerScript = new Script.PlayerScript(false);
                instance.addComponent(playerScript);
            }
            let ssc = instance.getAllComponents().find(c => c instanceof Script.ServerSync);
            ssc.setupId(_data.id);
        }
        static async destroyObject(_data) {
            if (!this.#otherElementsToSync.has(_data.id))
                return;
            this.#otherElementsToSync.delete(_data.id);
            let element = this.#otherElementsToSync.get(_data.id);
            element.node.getParent()?.removeChild(element.node);
        }
        static updateOne(_data, _id) {
            let updateData = {};
            updateData[_id] = _data;
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.SYNC, data: updateData } });
        }
        static broadcastJoin() {
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.JOIN } });
        }
        static messageHandler(_event) {
            if (_event instanceof MessageEvent) {
                let message = JSON.parse(_event.data);
                if (message.command === ƒNet.COMMAND.UNDEFINED) {
                    if (message.idSource == this.client.id)
                        return;
                    if (message.content.command === MessageCommand.SYNC) {
                        this.applyUpdate(message.content.data);
                    }
                    if (message.content.command === MessageCommand.CREATE) {
                        this.createObject(message.content.data);
                    }
                    if (message.content.command === MessageCommand.DESTROY) {
                        this.destroyObject(message.content.data);
                    }
                    if (message.content.command === MessageCommand.JOIN) {
                        for (let element of this.#ownElementsToSync.values()) {
                            let creationData = element.creationData();
                            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, idTarget: message.idSource, content: { command: MessageCommand.CREATE, data: creationData } });
                        }
                    }
                }
            }
            else {
                console.warn("unexpected event", _event);
            }
        }
        static getOwnerIdFromId(_id) {
            return _id.split("+")[0];
        }
    }
    Script.MultiplayerManager = MultiplayerManager;
})(Script || (Script = {}));
/// <reference path="MultiplayerManager.ts" />
var Script;
/// <reference path="MultiplayerManager.ts" />
(function (Script) {
    var ƒ = FudgeCore;
    var ƒNet = FudgeNet;
    ƒ.Debug.info("Main Program Template running!");
    document.addEventListener("interactiveViewportStarted", start);
    let rooms = [];
    const client = new ƒNet.FudgeClient();
    client.connectToServer("wss://motivationline.plagiatus.net");
    client.addEventListener(ƒNet.EVENT.MESSAGE_RECEIVED, receiveMessage);
    const playerName = prompt("PlayerName", "Player" + Math.floor(Math.random() * 10000 + 1));
    let interval;
    Script.MultiplayerManager.client = client;
    Script.MultiplayerManager.installListeners();
    function start(_event) {
        Script.viewport = _event.detail;
        client.loginToServer(playerName);
        ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, update);
        ƒ.Loop.start(); // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
        // document.getElementById("btn-join").addEventListener("click", joinRoom);
        document.getElementById("btn-create").addEventListener("click", createRoom);
        document.getElementById("btn-refresh").addEventListener("click", refreshRooms);
        refreshRooms();
        interval = setInterval(refreshRooms, 5000);
    }
    function update(_event) {
        ƒ.Physics.simulate(); // if physics is included and used
        Script.viewport.draw();
        ƒ.AudioManager.default.update();
    }
    async function receiveMessage(_event) {
        if (_event instanceof MessageEvent) {
            let message = JSON.parse(_event.data);
            if (message.command === ƒNet.COMMAND.SERVER_HEARTBEAT) {
                if (client.name == undefined) {
                }
                client.dispatch({ command: ƒNet.COMMAND.CLIENT_HEARTBEAT });
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
    function joinRoom(_room) {
        // let idRoom: string = (<HTMLInputElement>document.getElementById("room")).value;
        if (!rooms.includes(_room))
            return;
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
        let roomsToDisplay = [];
        for (let room of rooms) {
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
        let graph = ƒ.Project.getResourcesByName("Map")[0];
        Script.viewport.setBranch(graph);
        document.getElementById("rooms-wrapper").remove();
        let player = ƒ.Project.getResourcesByName("Player")[0];
        let instance = await ƒ.Project.createGraphInstance(player);
        graph.addChild(instance);
        instance.mtxLocal.translation = new ƒ.Vector3();
        Script.viewport.camera = instance.getComponent(ƒ.ComponentCamera);
        let playerScript = new Script.PlayerScript(true);
        instance.addComponent(playerScript);
        playerScript.setupId();
        Script.MultiplayerManager.broadcastJoin();
    }
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ServerSync extends ƒ.Component {
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
        }
        setupId(_id) {
            this.id = _id;
            if (!_id) {
                this.id = Script.MultiplayerManager.client.id + "+" + ƒ.Time.game.get() + "+" + Math.floor(Math.random() * 10000 + 1);
            }
            this.ownerId = Script.MultiplayerManager.getOwnerIdFromId(this.id);
            Script.MultiplayerManager.register(this);
        }
        syncSelf() {
            Script.MultiplayerManager.updateOne(this.getInfo(), this.id);
        }
        getInfo() {
            let info = {};
            info.position = this.node.mtxLocal.translation;
            return info;
        }
        putInfo(_data) {
            if (this.ownerId === Script.MultiplayerManager.client.id)
                return;
            if (!_data)
                return;
            this.applyData(_data);
        }
        applyData(data) {
            let rb = this.node.getComponent(ƒ.ComponentRigidbody);
            rb.activate(false);
            this.node.mtxLocal.translation = new ƒ.Vector3(data.position.x, data.position.y, data.position.z);
            rb.activate(true);
        }
    }
    Script.ServerSync = ServerSync;
})(Script || (Script = {}));
/// <reference path="ServerSync.ts" />
var Script;
/// <reference path="ServerSync.ts" />
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class PlayerScript extends Script.ServerSync {
        // Register the script as component for use in the editor via drag&drop
        #rb;
        #currentDirection;
        #playerDriven;
        constructor(_playerDriven = false) {
            super();
            this.#currentDirection = new ƒ.Vector3();
            this.#playerDriven = false;
            // Activate the functions of this component as response to events
            this.hndEvent = (_event) => {
                switch (_event.type) {
                    case "componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */:
                        this.removeEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
                        this.removeEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                        break;
                    case "componentAdd" /* ƒ.EVENT.COMPONENT_ADD */:
                    case "nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */:
                        // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                        this.#rb = this.node.getComponent(ƒ.ComponentRigidbody);
                        this.#rb.effectGravity = 0;
                        this.#rb.effectRotation = new ƒ.Vector3();
                        break;
                }
            };
            // protected reduceMutator(_mutator: ƒ.Mutator): void {
            //   // delete properties that should not be mutated
            //   // undefined properties and private fields (#) will not be included by default
            // }
            this.loop = () => {
                if (this.#playerDriven) {
                    this.checkInput();
                }
                this.move();
            };
            this.#playerDriven = !!_playerDriven;
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.hndEvent);
            ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.loop);
        }
        checkInput() {
            let direction = new ƒ.Vector3();
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(1, 0, 0));
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(-1, 0, 0));
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(0, 0, -1));
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(0, 0, 1));
            let mgtSqrt = direction.magnitudeSquared;
            if (mgtSqrt > 1) {
                direction.normalize(1);
            }
            if (!this.#currentDirection.equals(direction)) {
                this.#currentDirection.copy(direction);
                this.syncSelf();
            }
        }
        move() {
            this.#rb.setVelocity(this.#currentDirection);
        }
        getInfo() {
            let info = super.getInfo();
            info.dir = this.#currentDirection;
            return info;
        }
        putInfo(_data) {
            super.putInfo(_data);
            this.#currentDirection = _data.dir;
        }
        creationData() {
            return {
                id: this.id,
                initData: this.getInfo(),
                resourceName: "Player",
            };
        }
    }
    Script.PlayerScript = PlayerScript;
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map