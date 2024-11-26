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
    abstract class Damagable extends ServerSync {
        #private;
        rigidbody: ƒ.ComponentRigidbody;
        constructor();
        private initDamagable;
        private initHealthbar;
        get health(): number;
        dealDamage(_amt: number, _broadcast: boolean): void;
        set health(_amt: number);
        protected abstract death(): void;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
        getMutator(_extendable?: boolean): ƒ.Mutator;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
        getInfo(): any;
        applyData(data: any): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class Destructible extends ƒ.Component {
        static destrcutibles: Destructible[];
        replaceWith: string;
        constructor();
        destroy(_fromNetwork?: boolean): Promise<void>;
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
        SELECTION = 5,
        GAME_OVERLAY = 6
    }
    class MenuManager {
        overlays: Map<MENU_TYPE, HTMLElement>;
        constructor();
        resourcesLoaded: () => void;
        joinRoom(): void;
        showOverlay(_type: MENU_TYPE): void;
        selectBrawler(_button: HTMLButtonElement): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
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
        static mousePositionToWorldPlanePosition(_mousePosition: ƒ.Vector2): ƒ.Vector3;
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
        loadBrawler: (_playerBrawler: Player) => Promise<void>;
        private initBrawler;
        addObjectThroughNetwork(_instance: ƒ.GraphInstance): void;
        addProjectile(_instance: ƒ.GraphInstance, _component: ComponentProjectile, _parent?: ƒ.Node): void;
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
        private static createObjectLater;
        private static createObject;
        private static destroyObject;
        static updateOne(_data: any, _id: string): void;
        static broadcastJoin(): void;
        static broadcastDestructible(d: Destructible): void;
        private static messageHandler;
        static getOwnerIdFromId(_id: string): string;
        static clearObjects(): void;
    }
}
declare namespace Script {
    import ƒNet = FudgeNet;
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
        static hostRoom: () => void;
        static inputRoom: (_event: Event) => void;
        static joinRoom: () => void;
        static leaveRoom: () => void;
        static updateRoom: () => void;
        static handleUndefined(_message: ƒNet.Message): void;
        static switchView(_view: MENU_TYPE): void;
        static selectBrawler(_brawler: string): void;
        static startGame(): void;
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
        initAttack: () => Promise<void>;
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
    class ComponentProjectile extends ServerSync {
        #private;
        gravity: boolean;
        rotateInDirection: boolean;
        damage: number;
        speed: number;
        range: number;
        destructive: boolean;
        impactAOE: string;
        constructor();
        private removeEventListeners;
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
        creationData(): CreationData;
        getInfo(): any;
        applyData(_data: any): void;
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
        mousePosition: ƒ.Vector2;
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
        getDirection(): ƒ.Vector3;
        update(): void;
        protected move(): void;
        dealDamage(_amt: number, _broadcast: boolean): void;
        initAttacks(): void;
        attack(_atk: ATTACK_TYPE, _direction: ƒ.Vector3): void;
        showPreview(_atk: ATTACK_TYPE): void;
        hidePreview(_atk: ATTACK_TYPE): void;
        addVelocity(_velocity: ƒ.Vector3, _duration: number): void;
        lockPlayerFor(_time: number): void;
        makeInvulnerableFor(_timeInMS: number): void;
        dealDamageToOthers(_amt: number): void;
        protected death(): void;
        respawn(_position: ƒ.Vector3): void;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
        creationData(): CreationData;
        getInfo(): any;
        applyData(data: any): void;
        onTrigger: (_event: ƒ.EventPhysics) => void;
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
        respawn(): void;
        private changeDirection;
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
        update(): void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    interface Player {
        id: string;
        brawler?: ComponentBrawler;
        remainingRespawns?: number;
        chosenBrawler?: string;
        team?: number;
    }
    interface Team {
        players: Player[];
        remainingRespawns?: number;
        respawnPoints?: ƒ.Node[];
        wonRounds?: number;
    }
    enum RESPAWN_TYPE {
        AT_FIXED_RESPAWN_POINT = 0,
        AT_RANDOM_RESPAWN_POINT = 1,
        AT_DEATH_LOCATION = 2,
        AT_TEAMMATE_LOCATION = 3
    }
    interface GameSettings {
        timer: number;
        maxRespawnsPerRoundAndTeam: number;
        maxRespawnsPerRoundAndPlayer: number;
        amtRounds: number;
        respawnTime: number;
        respawnType: RESPAWN_TYPE[];
        arena: string;
    }
    class GameManager {
        #private;
        static Instance: GameManager;
        teams: Team[];
        settings: GameSettings;
        gameActive: boolean;
        private defaultSettings;
        constructor();
        init(_teams: Team[], _settings: Partial<GameSettings>, _gameActive?: boolean): void;
        startGame(): Promise<void>;
        timerId: number;
        timeDiv: HTMLDivElement;
        remainingTime: number;
        startRound(): Promise<void>;
        selectBrawler(_brawler: string, _player: string): void;
        getPlayer(_playerID: string): Player | undefined;
        getChosenBrawlerOfPlayer(_player: string): string;
        playerDied(cp: ComponentBrawler): void;
        private checkEndRound;
        private getRoundWinner;
        private getGameWinner;
        private respawnPlayer;
        private getTeamOfPlayer;
        private initSpawnPoints;
        getSpawnPointForPlayer(_player: string | Player): ƒ.Vector3;
        resetGame(): void;
    }
}
declare namespace Script {
    enum RIVE_SCENE {
        INTRO = 0,
        MAIN_MENU = 1,
        WIREFRAME = 2
    }
    const RiveMap: Map<RIVE_SCENE, {
        src: string;
        stateMachine: string;
    }>;
    class RiveManager {
        static rive: rive.Rive;
        static inputs: Map<string, rive.StateMachineInput>;
        static init(_scene: RIVE_SCENE): void;
        static eventHandler: (_event: rive.Event) => void;
        static loadMainMenu: () => void;
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
    class Shadow extends ƒ.Component {
        constructor();
        moveShadow: () => void;
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class SpawnPoint extends ƒ.Component {
        team: number;
        constructor();
        serialize(): ƒ.Serialization;
        deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable>;
    }
}
