declare namespace Script {
    import ƒ = FudgeCore;
    class Brawler extends ƒ.ComponentScript {
        static readonly iSubclass: number;
        speed: number;
        private direction;
        private rigidbody;
        constructor();
        hndEvent: (_event: Event) => void;
        setMovement(_direction: ƒ.Vector2): void;
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
        constructor();
        update: () => void;
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
    const menuManager: MenuManager;
    const inputManager: InputManager;
}
