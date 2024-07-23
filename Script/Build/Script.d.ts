declare namespace Script {
    import ƒ = FudgeCore;
    class ComponentOffsetAnimation extends ƒ.Component {
        offsetFactor: number;
        constructor();
        hndEvent: (_event: Event) => void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class CustomMaterial extends ƒ.Material {
    }
    class ComponentPhongToToon extends ƒ.Component {
        static readonly iSubclass: number;
        private static materials;
        constructor();
        hndEvent: (_event: Event) => void;
        private materialToToon;
        private coatToToon;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    abstract class Damagable extends ƒ.Component {
        #private;
        rigidbody: ƒ.ComponentRigidbody;
        constructor();
        private initDamagable;
        private initHealthbar;
        get health(): number;
        set health(_amt: number);
        protected abstract death(): void;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
        getMutator(_extendable?: boolean): ƒ.Mutator;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class IgnoredByProjectiles extends ƒ.Component {
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
        mainPreviewTimeout: number;
        specialPreviewTimeout: number;
        mousedown: (_event: MouseEvent) => void;
        mouseup: (_event: MouseEvent) => void;
        mousemove: (_event: MouseEvent) => void;
        private tryToAttack;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class EntityManager extends ƒ.Component {
        static Instance: EntityManager;
        brawlers: ComponentBrawler[];
        playerBrawler: ComponentBrawler;
        projectiles: ComponentProjectile[];
        constructor();
        loadBrawler: (_playerBrawler?: string) => Promise<void>;
        private initBrawler;
        addProjectile(_instance: ƒ.GraphInstance, _component: ComponentProjectile, _parent: ƒ.Node): void;
        removeProjectile(_proj: ComponentProjectile): void;
        update: () => void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    let viewport: ƒ.Viewport;
    const menuManager: MenuManager;
    const inputManager: InputManager;
    function startViewport(): Promise<void>;
}
declare namespace Script {
    import ƒ = FudgeCore;
    enum AttackPreviewType {
        LINE = 0,
        CONE = 1,
        AREA = 2
    }
    abstract class ComponentAttack extends ƒ.Component {
        #private;
        previewType: AttackPreviewType;
        previewWidth: number;
        range: number;
        constructor();
        showPreview(): void;
        hidePreview(): void;
        updatePreview(_brawlerPosition: ƒ.Vector3, _mousePosition: ƒ.Vector3): void;
        private initPreviewHandler;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
        getMutatorAttributeTypes(_mutator: ƒ.Mutator): ƒ.MutatorAttributeTypes;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    abstract class ComponentMainAttack extends ComponentAttack {
        #private;
        reloadTime: number;
        minDelayBetweenAttacks: number;
        damage: number;
        castTime: number;
        maxCharges: number;
        protected charges: number;
        protected chargeMoment: number;
        constructor();
        private initMainAttack;
        private initVisuals;
        attack(_direction: ƒ.Vector3): boolean;
        update(): void;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class ComponentProjectile extends ƒ.Component {
        #private;
        gravity: boolean;
        rotateInDirection: boolean;
        damage: number;
        speed: number;
        range: number;
        constructor();
        private init;
        fire(_direction: ƒ.Vector3, _owner: ComponentBrawler): void;
        protected onTriggerEnter: (_event: ƒ.EventPhysics) => void;
        protected explode(): void;
        moveToPosition(_pos: ƒ.Vector3): void;
        protected loop: () => void;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class ComponentProjectileMainAttack extends ComponentMainAttack {
        speed: number;
        range: number;
        rotateInDirection: boolean;
        attachedToBrawler: boolean;
        projectile: string;
        attack(_direction: ƒ.Vector3): boolean;
        shootProjectile(_direction: ƒ.Vector3): Promise<void>;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    abstract class ComponentSpecialAttack extends ComponentAttack {
        damage: number;
        castTime: number;
        requiredCharge: number;
        protected currentCharge: number;
        charge(_amt: number): void;
        attack(_direction: ƒ.Vector3): boolean;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class CowboyMainAttack extends ComponentProjectileMainAttack {
        attack(_direction: ƒ.Vector3): boolean;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class CowboySpecialAttack extends ComponentSpecialAttack {
        attack(_direction: ƒ.Vector3): boolean;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class ComponentBrawler extends Damagable {
        #private;
        static readonly iSubclass: number;
        speed: number;
        protected direction: ƒ.Vector3;
        protected rotationWrapperMatrix: ƒ.Matrix4x4;
        protected attackMain: ComponentMainAttack;
        protected attackSpecial: ComponentSpecialAttack;
        mousePosition: ƒ.Vector3;
        animationIdleName: string;
        animationWalkName: string;
        constructor();
        hndEvent: (_event: Event) => void;
        resourcesLoaded: () => void;
        private playAnimation;
        private findAttacks;
        setMovement(_direction: ƒ.Vector3): void;
        update(): void;
        protected move(): void;
        attack(_atk: ATTACK_TYPE, _direction: ƒ.Vector3): void;
        showPreview(_atk: ATTACK_TYPE): void;
        hidePreview(_atk: ATTACK_TYPE): void;
        protected death(): void;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
    enum ATTACK_TYPE {
        MAIN = 0,
        SPECIAL = 1
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class Cowboy extends ComponentBrawler {
        move(): void;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
    }
}
