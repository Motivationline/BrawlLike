namespace Script {
    import ƒ = FudgeCore;
    export abstract class Damagable extends ƒ.Component {
        #health: number = 500;
        rigidbody: ƒ.ComponentRigidbody;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.initDamagable);

        }

        private initDamagable = () => {
            this.node.removeEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.initDamagable);
            this.rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
        }

        get health(): number {
            return this.#health;
        }

        set health(_amt) {
            this.#health = _amt;
            if (this.#health < 0) this.death();
        }


        protected abstract death(): void;

        
        protected reduceMutator(_mutator: ƒ.Mutator): void {
            super.reduceMutator(_mutator);
            delete _mutator.rigidbody;
        }
        /*
        serialize(): ƒ.Serialization {
            let ser: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                health: this.health,
            };
            return ser;
        }

        async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            this.health = _serialization.health;
            await super.deserialize(_serialization[super.constructor.name]);
            return this;
        }
        */
    }
}