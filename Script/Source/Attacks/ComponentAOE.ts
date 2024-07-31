namespace Script {
    import ƒ = FudgeCore;
    export class ComponentAOE extends ƒ.Component {
        damage: number = 50;
        maxTicksPerEnemy: number = 1000;
        delayBetweenTicksInMS: number = 500;
        delayBeforeFirstTickInMS: number = 0;
        attachedToBrawler: boolean = false;
        radius: number = 1;
        destructive: boolean = false;
        duration: number = 1;
        areaVisible: boolean = true;

        #rb: ƒ.ComponentRigidbody;
        #damagables: { target: Damagable, nextDamage: number, amtTicks: number }[] = [];
        #owner: ComponentBrawler;
        #circle: ƒ.Node;
        #endTime: number;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.init);
            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.loop);
        }
        private init = () => {
            this.#rb = this.node.getComponent(ƒ.ComponentRigidbody);
            this.#rb.addEventListener(ƒ.EVENT_PHYSICS.TRIGGER_ENTER, this.onTriggerEnter);
            this.#rb.addEventListener(ƒ.EVENT_PHYSICS.TRIGGER_EXIT, this.onTriggerExit);
            this.node.addEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initVisuals, true);
        }

        public setup(_owner: ComponentBrawler, _pos: ƒ.Vector3) {
            this.#owner = _owner;

            this.node.mtxLocal.translation = new ƒ.Vector3(_pos.x, 0, _pos.z);
            this.#endTime = ƒ.Time.game.get() + this.duration * 1000;
        }

        protected initVisuals = async () => {
            let aoeCircle = <ƒ.Graph>ƒ.Project.getResourcesByName("AOECircle")[0]
            let instance = await ƒ.Project.createGraphInstance(aoeCircle);
            this.node.addChild(instance);
            this.node.mtxLocal.scale(ƒ.Vector3.ONE(this.radius));
            this.#circle = instance;

            if (this.areaVisible) {
                this.#circle.activate(true);
                let mat = this.#circle.getComponent(ƒ.ComponentMaterial);
                if (this.#owner === EntityManager.Instance.playerBrawler) {
                    mat.clrPrimary = ƒ.Color.CSS("aqua");
                } else {
                    mat.clrPrimary = ƒ.Color.CSS("crimson");
                }
            } else {
                this.#circle.activate(false);
            }
        }

        protected loop = () => {
            if(this.maxTicksPerEnemy === null || this.maxTicksPerEnemy === undefined) this.maxTicksPerEnemy = Infinity;
            let currentTime = ƒ.Time.game.get();
            for (let pair of this.#damagables) {
                if (pair.nextDamage <= currentTime && pair.amtTicks < this.maxTicksPerEnemy) {
                    pair.target.health -= this.damage;
                    pair.nextDamage = currentTime + this.delayBetweenTicksInMS;
                    pair.amtTicks++;
                }
            }
            if (this.#endTime < currentTime) {
                this.node.getParent()?.removeChild(this.node);
                ƒ.Loop.removeEventListener(ƒ.EVENT.LOOP_FRAME, this.loop);
            }
        }

        protected onTriggerEnter = (_event: ƒ.EventPhysics) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody) return;
            // TODO: Team check
            // check if damagable
            let damagable: Damagable = (<Damagable>_event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Damagable));
            if (damagable) {
                let amtTicks: number = 0;
                if (this.delayBeforeFirstTickInMS === 0) {
                    damagable.health -= this.damage;
                    amtTicks++;
                }
                let dInArray = this.#damagables.find((d) => d.target === damagable);
                if (!dInArray) {
                    this.#damagables.push({
                        target: damagable,
                        nextDamage: this.delayBeforeFirstTickInMS > 0 ? ƒ.Time.game.get() + this.delayBeforeFirstTickInMS : ƒ.Time.game.get() + this.delayBetweenTicksInMS,
                        amtTicks,
                    });
                }
            }

            // check for destructible target
            if (this.destructive) {
                let destructible: Destructible = (<Destructible>_event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Destructible));
                if (destructible) {
                    destructible.destroy();
                }
            }
        }
        protected onTriggerExit = (_event: ƒ.EventPhysics) => {
            let damagable: Damagable = (<Damagable>_event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Damagable));
            if (damagable) {
                for (let i: number = 0; i < this.#damagables.length; i++) {
                    let d = this.#damagables[i].target;
                    if (d === damagable) {
                        this.#damagables.splice(i, 1);
                        break;
                    }
                }
            }
        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                damage: this.damage,
                maxTicksPerEnemy: this.maxTicksPerEnemy,
                delayBetweenTicksInMS: this.delayBetweenTicksInMS,
                delayBeforeFirstTickInMS: this.delayBeforeFirstTickInMS,
                attachedToBrawler: this.attachedToBrawler,
                radius: this.radius,
                destructive: this.destructive,
                duration: this.duration,
                areaVisible: this.areaVisible,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {

            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);

            if (_serialization.damage !== undefined)
                this.damage = _serialization.damage;
            if (_serialization.maxTicksPerEnemy !== undefined)
                this.maxTicksPerEnemy = _serialization.maxTicksPerEnemy;
            if (_serialization.delayBetweenTicksInMS !== undefined)
                this.delayBetweenTicksInMS = _serialization.delayBetweenTicksInMS;
            if (_serialization.delayBeforeFirstTickInMS !== undefined)
                this.delayBeforeFirstTickInMS = _serialization.delayBeforeFirstTickInMS;
            if (_serialization.attachedToBrawler !== undefined)
                this.attachedToBrawler = _serialization.attachedToBrawler;
            if (_serialization.radius !== undefined)
                this.radius = _serialization.radius;
            if (_serialization.destructive !== undefined)
                this.destructive = _serialization.destructive;
            if (_serialization.duration !== undefined)
                this.duration = _serialization.duration;
            if (_serialization.areaVisible !== undefined)
                this.areaVisible = _serialization.areaVisible;
            return this;
        }
    }
}