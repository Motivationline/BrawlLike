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
        constructor();
        destroy(): void;
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
    class ComponentAOE extends ƒ.Component {
        #private;
        damage: number;
        maxTicksPerEnemy: number;
        delayBetweenTicksInMS: number;
        delayBeforeFirstTickInMS: number;
        attachedToBrawler: boolean;
        radius: number;
        destructive: boolean;
        duration: number;
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
    abstract class ComponentAttack extends ƒ.Component {
        #private;
        previewType: AttackPreviewType;
        previewWidth: number;
        range: number;
        attackType: AttackType;
        maxCharges: number;
        damage: number;
        minDelayBetweenAttacks: number;
        energyGenerationPerSecond: number;
        energyNeededPerCharge: number;
        castingTime: number;
        lockBrawlerForAnimationTime: boolean;
        lockTime: number;
        recoil: number;
        invulerableTime: number;
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
        executeAttack(_event: ƒ.EventTimer): void;
        update(): void;
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
    import ƒ = FudgeCore;
    class CowboySpecialAttack extends ComponentAttack {
        attack(_direction: ƒ.Vector3): boolean;
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
    class IgnoredByProjectiles extends ƒ.Component {
    }
}
declare namespace Script {
    import ƒ = FudgeCore;
    class Shadow extends ƒ.Component {
        constructor();
        moveShadow: () => void;
    }
}
