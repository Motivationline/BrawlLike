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
        dealDamage(_amt: number): void;
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
    class Destructible extends ƒ.Component {
        replaceWith: string;
        constructor();
        destroy(): Promise<void>;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
declare namespace Script {
    enum MENU_TYPE {
        NONE = 0,
        START = 1,
        LOADING = 2,
        LOBBY = 3,
        GAME_LOBBY = 4,
        SELECTION = 5
    }
    class MenuManager {
        overlays: Map<MENU_TYPE, HTMLElement>;
        constructor();
        resourcesLoaded: () => void;
        showOverlay(_type: MENU_TYPE): void;
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
    class LobbyManager {
        static client: FudgeNet.FudgeClient;
        static rooms: {
            [roomId: string]: number;
        };
        static refreshInterval: number;
        static selectedRoom: string;
        static installListeners(): void;
        static refreshRooms: () => void;
        static messageHandler(_event: CustomEvent | MessageEvent): void;
        static updateVisibleRooms(): void;
        static hostRoom: () => void;
        static selectRoom: (_event: MouseEvent) => void;
        static joinRoom: () => void;
        static leaveRoom: () => void;
        static updateRoom: () => void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    import ƒNet = FudgeNet;
    let viewport: ƒ.Viewport;
    const menuManager: MenuManager;
    const inputManager: InputManager;
    const client: ƒNet.FudgeClient;
    function startViewport(): Promise<void>;
}
declare namespace Script {
    import ƒ = FudgeCore;
    class ComponentAOE extends ƒ.Component {
        #private;
        damage: number;
        maxTicksPerEnemy: number;
        delayBetweenTicksInMS: number;
        delayBeforeFirstTickInMS: number;
        attachedToBrawler: boolean;
        radius: number;
        destructive: boolean;
        durationDamage: number;
        durationVisual: number;
        areaVisible: boolean;
        constructor();
        private init;
        setup(_owner: ComponentBrawler, _pos: ƒ.Vector3): void;
        protected initVisuals: () => Promise<void>;
        protected loop: () => void;
        protected onTriggerEnter: (_event: ƒ.EventPhysics) => void;
        protected onTriggerExit: (_event: ƒ.EventPhysics) => void;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    enum AttackPreviewType {
        LINE = 0,
        CONE = 1,
        AREA = 2
    }
    enum AttackType {
        MAIN = 0,
        SPECIAL = 1
    }
    enum ChargeType {
        PASSIVE = 0,
        DAMAGE_DEALT = 1,
        DAMAGE_RECEIVED = 2
    }
    abstract class ComponentAttack extends ƒ.Component {
        #private;
        static activePreviews: Set<ƒ.Node>;
        previewType: AttackPreviewType;
        previewWidth: number;
        range: number;
        attackType: AttackType;
        maxCharges: number;
        damage: number;
        minDelayBetweenAttacks: number;
        energyGenerationPerSecond: number;
        energyNeededPerCharge: number;
        energyGeneratedPerDamageDealt: number;
        energyGeneratedPerDamageReceived: number;
        castingTime: number;
        lockBrawlerForAnimationTime: boolean;
        lockTime: number;
        recoil: number;
        invulerableTime: number;
        effect: string;
        effectDelay: number;
        protected singleton: boolean;
        protected maxEnergy: number;
        protected currentEnergy: number;
        protected nextAttackAllowedAt: number;
        constructor();
        showPreview(): void;
        hidePreview(): void;
        updatePreview(_brawlerPosition: ƒ.Vector3, _mousePosition: ƒ.Vector3): void;
        private initAttack;
        attack(_direction: ƒ.Vector3): boolean;
        executeAttack: (_event: ƒ.EventTimer) => void;
        executeRecoil: (_event: ƒ.EventTimer) => void;
        private executeEffect;
        update(): void;
        charge(_amt: number, type: ChargeType): void;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
        getMutatorAttributeTypes(_mutator: ƒ.Mutator): ƒ.MutatorAttributeTypes;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class ComponentAOEAttack extends ComponentAttack {
        offset: ƒ.Vector3;
        aoeGraph: string;
        executeAttack: ƒ.TimerHandler;
        protected spawnAOE(direction: ƒ.Vector3): Promise<void>;
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
        destructive: boolean;
        impactAOE: string;
        constructor();
        private init;
        fire(_direction: ƒ.Vector3, _owner: ComponentBrawler): void;
        protected onTriggerEnter: (_event: ƒ.EventPhysics) => void;
        protected explode(): Promise<void>;
        moveToPosition(_pos: ƒ.Vector3): void;
        protected loop: () => void;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
        private initShadow;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class ComponentProjectileAttack extends ComponentAttack {
        speed: number;
        range: number;
        rotateInDirection: boolean;
        attachedToBrawler: boolean;
        projectile: string;
        gravity: boolean;
        destructive: boolean;
        executeAttack: ƒ.TimerHandler;
        shootProjectile(_direction: ƒ.Vector3, _ignoreRange?: boolean): Promise<void>;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class CowboyMainAttack extends ComponentProjectileAttack {
        attack(_direction: ƒ.Vector3): boolean;
    }
}
declare namespace Script {
    class CowboySpecialAttack extends ComponentAttack {
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class FroggerSpecialAttack extends ComponentProjectileAttack {
        radius: number;
        amtProjectiles: number;
        executeAttack: ƒ.TimerHandler;
        shootProjectiles(_direction: ƒ.Vector3): Promise<void>;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class SpiderSpecialAttack extends ComponentAOEAttack {
        moveColliderUpBy: number;
        moveColliderUpForSeconds: number;
        aoeDelay: number;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
        executeAttack: ƒ.TimerHandler;
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
        protected attackMain: ComponentAttack;
        protected attackSpecial: ComponentAttack;
        mousePosition: ƒ.Vector3;
        animationIdleName: string;
        animationWalkName: string;
        animationAttackName: string;
        animationSpecialName: string;
        constructor();
        hndEvent: (_event: Event) => void;
        resourcesLoaded: () => void;
        private playAnimation;
        private findAttacks;
        setMovement(_direction: ƒ.Vector3): void;
        update(): void;
        protected move(): void;
        dealDamage(_amt: number): void;
        attack(_atk: ATTACK_TYPE, _direction: ƒ.Vector3): void;
        showPreview(_atk: ATTACK_TYPE): void;
        hidePreview(_atk: ATTACK_TYPE): void;
        addVelocity(_velocity: ƒ.Vector3, _duration: number): void;
        lockPlayerFor(_time: number): void;
        makeInvulnerableFor(_timeInMS: number): void;
        dealDamageToOthers(_amt: number): void;
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
declare namespace Script {
    import ƒ = FudgeCore;
    class DummyBrawler extends ComponentBrawler {
        #private;
        respawnTime: number;
        walkRandom: boolean;
        constructor();
        protected death(): void;
        private respawn;
        private changeDirection;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
        update(): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class ComponentEffect extends ƒ.Component {
        #private;
        duration: number;
        offset: ƒ.Vector3;
        offsetIsLocal: boolean;
        constructor();
        private init;
        setup(_direction: ƒ.Vector3): void;
        private loop;
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
    import ƒ = FudgeCore;
    class ComponentRandomRotation extends ƒ.Component {
        static readonly iSubclass: number;
        rotationY: number;
        constructor();
        hndEvent: (_event: Event) => void;
        private randomizeRotation;
    }
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
    import ƒ = FudgeCore;
    class Shadow extends ƒ.Component {
        constructor();
        moveShadow: () => void;
    }
}
