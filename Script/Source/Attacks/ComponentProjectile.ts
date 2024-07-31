namespace Script {
    import ƒ = FudgeCore;
    export class ComponentProjectile extends ƒ.Component {
        gravity: boolean = false;
        rotateInDirection: boolean = true;
        damage: number = 100;
        speed: number = 10;
        range: number = 3;
        destructive: boolean = false;
        impactAOE: string = "";

        #rb: ƒ.ComponentRigidbody;
        #owner: ComponentBrawler;
        #startPosition: ƒ.Vector3;

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
            this.node.addEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initShadow, true);
        }

        public fire(_direction: ƒ.Vector3, _owner: ComponentBrawler) {
            this.#owner = _owner;
            this.#rb.effectGravity = Number(this.gravity);
            if (this.rotateInDirection) {
                this.node.mtxLocal.lookIn(_direction);
            }
            if (this.gravity) {
                // calculate arc as desired
                let timeToImpact = this.speed;
                let desiredHeight = 3;

                let g = ƒ.Physics.getGravity().y;
                let desiredG = -8 * desiredHeight / Math.pow(timeToImpact, 2);

                this.#rb.effectGravity = desiredG / g;
                let velocityY = -desiredG * timeToImpact / 2;
                _direction.scale(1 / timeToImpact);
                _direction.y = velocityY;
                this.#rb.setVelocity(_direction);
            } else {
                this.#rb.setVelocity(_direction.scale(this.speed));
            }
        }

        protected onTriggerEnter = (_event: ƒ.EventPhysics) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody) return;
            if (this.gravity && this.#rb.getVelocity().y > 0) return;
            // TODO do team check
            // check if target has disable script
            let noProjectile = _event.cmpRigidbody.node.getComponent(IgnoredByProjectiles);
            if (noProjectile && noProjectile.isActive) return;

            // check for damagable target
            let damagable: Damagable = (<Damagable>_event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Damagable));
            if (damagable) {
                damagable.health -= this.damage;
            }
            // check for destructible target
            if (this.destructive) {
                _event.cmpRigidbody.node.dispatchEvent(new CustomEvent("destruction", { bubbles: true }))
            }
            this.explode();
        }

        protected async explode() {
            if (this.impactAOE) {
                let aoe = <ƒ.Graph>ƒ.Project.getResourcesByName(this.impactAOE)[0];
                let instance = await ƒ.Project.createGraphInstance(aoe);

                this.node.getParent().addChild(instance);

                let compAOE = <ComponentAOE>instance.getAllComponents().find(c => c instanceof ComponentAOE);
                compAOE.setup(this.#owner, this.node.mtxLocal.translation);
            }
            EntityManager.Instance.removeProjectile(this);
        }

        moveToPosition(_pos: ƒ.Vector3) {
            let rb = this.node.getComponent(ƒ.ComponentRigidbody);
            rb.activate(false);
            this.#startPosition = _pos;
            this.node.mtxLocal.translation = _pos;
            rb.activate(true);
        }

        protected loop = () => {
            if (!this.#startPosition) return;
            if (this.gravity) return;
            let distance = ƒ.Vector3.DIFFERENCE(this.node.mtxWorld.translation, this.#startPosition).magnitudeSquared;
            if (distance > this.range * this.range) {
                this.explode();
            }
        }

        protected reduceMutator(_mutator: ƒ.Mutator): void {
            delete _mutator.damage;
            delete _mutator.speed;
            delete _mutator.range;
            delete _mutator.rotateInDirection;
            delete _mutator.destructive;
        }

        private initShadow = async () => {
            let shadow = <ƒ.Graph>ƒ.Project.getResourcesByName("Shadow")[0];
            let instance = await ƒ.Project.createGraphInstance(shadow);
            instance.mtxLocal.scaling = ƒ.Vector3.ONE(0.5);
            this.node.addChild(instance);
        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                impactAOE: this.impactAOE,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.impactAOE !== undefined)
                this.impactAOE = _serialization.impactAOE;
            return this;
        }
    }
}