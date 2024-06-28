declare namespace Script {
    import ƒ = FudgeCore;
    class Brawler extends ƒ.ComponentScript {
        static readonly iSubclass: number;
        speed: number;
        private direction;
        private rigidbody;
        private rotationWrapperMatrix;
        constructor();
        hndEvent: (_event: Event) => void;
        setMovement(_direction: ƒ.Vector3): void;
        update(): void;
    }
}
declare namespace Script {
    class MenuManager {
        constructor();
        resourcesLoaded: () => void;
    }
}
declare namespace Script {
    class InputManager {
        static Instance: InputManager;
        constructor();
        update: () => void;
        leftclick: (_event: MouseEvent) => void;
        rightclick: (_event: MouseEvent) => void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class EntityManager extends ƒ.Component {
        static Instance: EntityManager;
        playerBrawler: Brawler;
        constructor();
        loadBrawler: () => Promise<void>;
        update: () => void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    let viewport: ƒ.Viewport;
    const menuManager: MenuManager;
    const inputManager: InputManager;
}
