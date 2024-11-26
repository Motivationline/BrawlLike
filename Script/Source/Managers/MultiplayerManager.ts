namespace Script {
    import ƒ = FudgeCore;
    import ƒNet = FudgeNet;

    enum MessageCommand {
        SYNC,
        DESTROY,
        CREATE,
        JOIN,
        DESTRUCT
    }
    export interface NetworkData {
        [id: string]: any;
    }
    export interface CreationData {
        id: string,
        resourceName: string,
        initData: any,
    }
    export interface DestructionData {
        id: string,
    }
    export class MultiplayerManager {
        static Instance: MultiplayerManager = new MultiplayerManager();
        static client: FudgeNet.FudgeClient;
        static #ownElementsToSync: Map<string, ServerSync> = new Map();
        static #otherElementsToSync: Map<string, ServerSync> = new Map();
        static #otherClients: {
            [id: string]: {
                name?: string;
                isHost?: boolean;
            };
        } = {};

        constructor() {
            if (MultiplayerManager.Instance) return MultiplayerManager.Instance;
        }

        static register(_syncComp: ServerSync) {
            if (_syncComp.ownerId === this.client.id) {
                this.#ownElementsToSync.set(_syncComp.id, _syncComp);
                this.broadcastCreation(_syncComp.creationData());
            } else if (_syncComp.ownerId !== this.client.id) {
                this.#otherElementsToSync.set(_syncComp.id, _syncComp);
            }
        }

        static installListeners() {
            this.client.addEventListener(ƒNet.EVENT.MESSAGE_RECEIVED, <EventListenerOrEventListenerObject>this.messageHandler.bind(this));

            setInterval(() => {
                if (!GameManager.Instance.gameActive) return;
                let updateData: NetworkData = this.getUpdate();
                if (Object.keys(updateData).length == 0) return;
                this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.SYNC, data: updateData } })
            }, 1000);
        }

        static broadcastCreation(_data: CreationData) {
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.CREATE, data: _data } })
        }

        private static getUpdate(): NetworkData {
            let data: NetworkData = {};
            for (let element of this.#ownElementsToSync.values()) {
                if (element.node.getParent()) {
                    data[element.id] = element.getInfo();
                }
            }
            return data;
        }

        private static async applyUpdate(_data: NetworkData) {
            // console.log("apply Update", { _data })
            for (let element of this.#otherElementsToSync.values()) {
                let data = _data[element.id];
                if (data) {
                    element.putInfo(data);
                }
                delete _data[element.id];
            }
            for (let id in _data) {
                let data = _data[id];
                if (this.#ownElementsToSync.has(id)) {
                    if (!data.override) continue;
                    this.#ownElementsToSync.get(id)?.putInfo(data);
                } else {
                    console.warn("desync detected, unknown object created.");
                    this.createObjectLater(id, data);
                }
            }
        }

        private static createObjectLater(_id: string, _data: any){
            this.createObject({
                id: _id,
                initData: _data,
                resourceName: _data.resourceName,
            })
        }

        private static async createObject(_data: CreationData) {
            let graph = <ƒ.Graph>ƒ.Project.getResourcesByName(_data.resourceName)[0];
            let instance = await ƒ.Project.createGraphInstance(graph);
            EntityManager.Instance.addObjectThroughNetwork(instance);
            let ssc = <ServerSync>instance.getAllComponents().find(c => c instanceof ServerSync);
            ssc.setupId(_data.id);
            ssc.applyData(_data.initData);
        }

        private static async destroyObject(_data: DestructionData) {
            if (!this.#otherElementsToSync.has(_data.id)) return;
            let element = this.#otherElementsToSync.get(_data.id);
            element.node.getParent()?.removeChild(element.node);
            this.#otherElementsToSync.delete(_data.id);
        }

        static updateOne(_data: any, _id: string) {
            let updateData: NetworkData = {};
            updateData[_id] = _data;
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.SYNC, data: updateData } })
        }

        static broadcastJoin() {
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.JOIN } });
        }

        public static broadcastDestructible(d: Destructible) {
            let translation = d.node.mtxWorld.translation;
            let translationToSend = { x: translation.x, y: translation.y, z: translation.z };
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.DESTRUCT, data: translationToSend } });
        }

        private static messageHandler(_event: CustomEvent | MessageEvent) {
            if (_event instanceof MessageEvent) {
                let message: ƒNet.Message = JSON.parse(_event.data);
                if (message.command === ƒNet.COMMAND.UNDEFINED) {
                    if (message.idSource == this.client.id) return;
                    if (message.content.command === MessageCommand.SYNC) {
                        this.applyUpdate(message.content.data);
                    }
                    else if (message.content.command === MessageCommand.CREATE) {
                        this.createObject(message.content.data);
                    }
                    else if (message.content.command === MessageCommand.DESTROY) {
                        this.destroyObject(message.content.data);
                    }
                    else if (message.content.command === MessageCommand.JOIN) {
                        for (let element of this.#ownElementsToSync.values()) {
                            let creationData = element.creationData();
                            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, idTarget: message.idSource, content: { command: MessageCommand.CREATE, data: creationData } })
                        }
                    }
                    else if (message.content.command === MessageCommand.DESTRUCT) {
                        let newPosData = message.content.data;
                        let posV: ƒ.Vector3 = new ƒ.Vector3(newPosData.x, newPosData.y, newPosData.z);
                        for (let d of Destructible.destrcutibles) {
                            if (d.node.mtxWorld.translation.equals(posV, 0.6)) {
                                d.destroy(true);
                                return;
                            }
                        }
                    }
                }
            } else {
                console.warn("unexpected event", _event);
            }

            for (let id in this.client.clientsInfoFromServer) {
                delete this.#otherClients[id];
            }
            for (let id in this.#otherClients) {
                for (let entityId of this.#otherElementsToSync.keys()) {
                    let ownerId = this.getOwnerIdFromId(entityId);
                    if (ownerId === id) {
                        this.destroyObject({ id: entityId });
                    }
                }
            }
            this.#otherClients = { ...this.client.clientsInfoFromServer };
        }

        static getOwnerIdFromId(_id: string): string {
            return _id.split("+")[0];
        }

        static clearObjects() {
            this.#otherElementsToSync = new Map();
            this.#ownElementsToSync = new Map();
        }
    }
}