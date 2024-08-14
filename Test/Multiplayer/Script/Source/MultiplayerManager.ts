namespace Script {
    import ƒ = FudgeCore;
    import ƒNet = FudgeNet;
    export interface NetworkData {
        [id: string]: any;
    }
    export class MultiplayerManager {
        static Instance: MultiplayerManager = new MultiplayerManager();
        static client: FudgeNet.FudgeClient;
        static #ownElementsToSync: ServerSync[] = [];
        static #otherElementsToSync: ServerSync[] = [];

        constructor() {
            if (MultiplayerManager.Instance) return MultiplayerManager.Instance;
        }

        static register(_syncComp: ServerSync) {
            if (!_syncComp.ownerId) {
                _syncComp.ownerId = this.client.id;
                if (this.#ownElementsToSync.includes(_syncComp)) return;
                this.#ownElementsToSync.push(_syncComp);
            } else if (_syncComp.ownerId !== this.client.id) {
                if (this.#otherElementsToSync.includes(_syncComp)) return;
                this.#otherElementsToSync.push(_syncComp);
            }
        }

        static installListeners() {
            this.client.addEventListener(ƒNet.EVENT.MESSAGE_RECEIVED, <EventListenerOrEventListenerObject>this.messageHandler.bind(this));

            setInterval(() => {
                let updateData: NetworkData = this.getUpdate();
                this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: "sync", data: updateData } })
            }, 100);
        }

        static getUpdate(): NetworkData {
            let data: NetworkData = {};
            for (let element of this.#ownElementsToSync) {
                data[element.id] = element.getInfo();
            }
            return data;
        }

        static async applyUpdate(_data: NetworkData) {
            // console.log("apply Update", { _data })
            for (let element of this.#otherElementsToSync) {
                let data = _data[element.id];
                if (data) {
                    element.putInfo(data);
                }
                delete _data[element.id];
            }

            let keys = Object.keys(_data);
            for (let key of keys) {
                await this.createPlayer(key);
            }
            if(keys.length > 0){
                this.applyUpdate(_data);
            }
        }

        static async createPlayer(_id: string) {

            let player = <ƒ.Graph>ƒ.Project.getResourcesByName("Player")[0];
            let instance = await ƒ.Project.createGraphInstance(player);
            viewport.getBranch().addChild(instance);
            instance.mtxLocal.translation = new ƒ.Vector3();
            instance.addComponent(new PlayerScript());
            instance.addComponent(new ServerSync(`_${_id.split("_")[1]}`, _id));
        }

        static messageHandler(_event: CustomEvent | MessageEvent) {
            if (_event instanceof MessageEvent) {
                let message: ƒNet.Message = JSON.parse(_event.data);
                if (message.command === ƒNet.COMMAND.UNDEFINED) {
                    if (message.content.command === "sync") {
                        if (message.idSource !== this.client.id) {
                            this.applyUpdate(message.content.data);
                        }
                    }
                }
            } else {
                if (_event.type === "sync") {
                    this.applyUpdate(_event.detail.data);
                }
            }
        }
    }
}