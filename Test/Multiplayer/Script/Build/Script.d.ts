declare namespace Script {
    interface NetworkData {
        [id: string]: any;
    }
    interface CreationData {
        id: string;
        resourceName: string;
        initData: any;
    }
    interface DestructionData {
        id: string;
    }
    class MultiplayerManager {
        #private;
        static Instance: MultiplayerManager;
        static client: FudgeNet.FudgeClient;
        constructor();
        static register(_syncComp: ServerSync): void;
        static installListeners(): void;
        static broadcastCreation(_data: CreationData): void;
        private static getUpdate;
        private static applyUpdate;
        private static createObject;
        private static destroyObject;
        static updateOne(_data: any, _id: string): void;
        static broadcastJoin(): void;
        private static messageHandler;
        static getOwnerIdFromId(_id: string): string;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    let viewport: ƒ.Viewport;
}
declare namespace Script {
    import ƒ = FudgeCore;
    abstract class ServerSync extends ƒ.Component {
        id: string;
        ownerId: string;
        constructor();
        setupId(_id?: string): void;
        syncSelf(): void;
        getInfo(): any;
        putInfo(_data: any): void;
        applyData(data: any): void;
        abstract creationData(): CreationData;
    }
}
declare namespace Script {
    class PlayerScript extends ServerSync {
        #private;
        constructor(_playerDriven?: boolean);
        hndEvent: (_event: Event) => void;
        loop: () => void;
        checkInput(): void;
        move(): void;
        getInfo(): any;
        putInfo(_data: any): void;
        creationData(): CreationData;
    }
}
