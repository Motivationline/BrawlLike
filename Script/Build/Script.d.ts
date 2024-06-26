declare namespace Script {
    import ƒ = FudgeCore;
    class Brawler extends ƒ.ComponentScript {
        static readonly iSubclass: number;
        message: string;
        private direction;
        private rigidbody;
        constructor();
        hndEvent: (_event: Event) => void;
        setMovement(_direction: ƒ.Vector2): void;
        update(): void;
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
        playerBrawler: Brawler;
        constructor();
        loadBrawler: () => void;
        update: () => void;
    }
}
declare namespace Script {
    const inputManager: InputManager;
    const entityManager: EntityManager;
}
