/// <reference path="Misc/ServerSync.ts" />
namespace Script {
    import ƒ = FudgeCore;
    export abstract class Damagable extends ServerSync {
        #health: number = 500;
        rigidbody: ƒ.ComponentRigidbody;
        #healthBar: ƒ.ComponentMesh;
        #maxHealth: number = 500;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.initDamagable);
        }

        private initDamagable = () => {
            // this.removeEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.initDamagable);
            this.node.addEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initHealthbar, true);
            this.rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
            this.#maxHealth = this.#health;
        }

        private initHealthbar = async () => {
            // this.node.removeEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initHealthbar, true);
            let healthbar: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName("Healthbar")[0];
            let instance = await ƒ.Project.createGraphInstance(healthbar);
            this.node.addChild(instance);
            this.#healthBar = instance.getChild(0).getComponent(ƒ.ComponentMesh);
        }

        get health(): number {
            return this.#health;
        }

        dealDamage(_amt: number, _broadcast: boolean) {
            this.#health = Math.min(this.#health - _amt, this.#maxHealth);
            if (this.#health <= 0) this.death();
            if (!this.#healthBar) return;
            let scale: number = this.#health / this.#maxHealth;
            this.#healthBar.mtxPivot.scaling = new ƒ.Vector3(scale, this.#healthBar.mtxPivot.scaling.y, this.#healthBar.mtxPivot.scaling.z);
            this.#healthBar.mtxPivot.translation = new ƒ.Vector3(scale / 2 - 0.5, this.#healthBar.mtxPivot.translation.y, this.#healthBar.mtxPivot.translation.z);
            if (_broadcast)
                MultiplayerManager.updateOne({ type: "damage", override: true, amt: _amt }, this.id);
        }

        set health(_amt: number) {
            this.dealDamage(this.#health - _amt, false);
        }

        protected abstract death(): void;

        protected reduceMutator(_mutator: ƒ.Mutator): void {
            super.reduceMutator(_mutator);
            delete _mutator.rigidbody;
        }

        public getMutator(_extendable?: boolean): ƒ.Mutator {
            let mutator: ƒ.Mutator = super.getMutator(true);
            mutator.health = this.health;
            return mutator;
        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                health: this.health,
            };

            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.health != null)
                this.health = _serialization.health;

            return this;
        }

        getInfo(): any {
            let info = super.getInfo();
            info.health = this.#health;
            info.maxHealth = this.#maxHealth;
            return info;
        }

        applyData(data: any): void {
            super.applyData(data);
            if (data.type) {
                switch (data.type) {
                    case "damage": {
                        this.dealDamage(data.amt, false);
                        break;
                    }
                }
                return;
            }
            this.health = data.health;
            this.#maxHealth = data.maxHealth;
        }
    }
}