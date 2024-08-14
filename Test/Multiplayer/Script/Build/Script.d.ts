declare namespace Script {
    interface NetworkData {
        [id: string]: any;
    }
    class MultiplayerManager {
        #private;
        static Instance: MultiplayerManager;
        static client: FudgeNet.FudgeClient;
        constructor();
        static register(_syncComp: ServerSync): void;
        static installListeners(): void;
        static getUpdate(): NetworkData;
        static applyUpdate(_data: NetworkData): Promise<void>;
        static createPlayer(_id: string): Promise<void>;
        static messageHandler(_event: CustomEvent | MessageEvent): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    let viewport: ƒ.Viewport;
}
declare namespace Script {
    import ƒ = FudgeCore;
    class PlayerScript extends ƒ.ComponentScript {
        #private;
        constructor(_playerDriven?: boolean);
        hndEvent: (_event: Event) => void;
        loop: () => void;
        checkInput(): void;
        move(): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class ServerSync extends ƒ.Component {
        id: string;
        ownerId: string;
        constructor(_ownerId?: string, _id?: string);
        getInfo(): any;
        putInfo(_data: any): void;
        applyData(data: any): void;
    }
}
