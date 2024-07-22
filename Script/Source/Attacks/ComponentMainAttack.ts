namespace Script {
    import ƒ = FudgeCore;
    export abstract class ComponentMainAttack extends ƒ.Component {
        reloadTime: number = 1;
        minDelayBetweenAttacks: number = 0.3;
        damage: number = 100;
        castTime: number = 0.05;
        maxCharges: number = 3;

        protected charges: number = this.maxCharges;
        protected chargeMoment: number = -1;
        #attackBars: ƒ.Node[] = [];
        #attackBarColor: ƒ.Color;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.initMainAttack);
        }

        private initMainAttack = () => {
            // this.removeEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.initMainAttack);
            this.node.addEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initVisuals, true);
        }

        private initVisuals = async () => {
            // this.node.removeEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initVisuals, true);
            let attackbar: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName("BasicAttackBar")[0];

            for (let i: number = 0; i < this.maxCharges; i++) {
                let instance = await ƒ.Project.createGraphInstance(attackbar);
                this.node.addChild(instance);
                let translateBy = (1 / this.maxCharges) * (i - 1);
                instance.mtxLocal.translateX(translateBy);
                instance.mtxLocal.scaleX(0.9 / this.maxCharges);
                this.#attackBars.push(instance.getChild(0));
                this.#attackBarColor = instance.getChild(0).getComponent(ƒ.ComponentMaterial).clrPrimary;
            }
        }

        attack(_direction: ƒ.Vector3): boolean {
            if (this.charges == 0) return false;
            if (this.charges < this.#attackBars.length) {
                let pivot = this.#attackBars[this.charges].getComponent(ƒ.ComponentMesh).mtxPivot;
                pivot.scaling = new ƒ.Vector3(0, pivot.scaling.y, pivot.scaling.z);
            }
            this.charges--;
            this.#attackBars[this.charges].getComponent(ƒ.ComponentMaterial).clrPrimary = ƒ.Color.CSS("gray");
            if (this.chargeMoment < 0) this.chargeMoment = ƒ.Time.game.get();
            return true;
        }

        update(): void {
            if (this.charges < this.maxCharges) {
                let currentTime = ƒ.Time.game.get();
                let reloadRatio = (currentTime - this.chargeMoment) / (this.reloadTime * 1000);
                let scaling = this.#attackBars[this.charges].getComponent(ƒ.ComponentMesh).mtxPivot.scaling;
                this.#attackBars[this.charges].getComponent(ƒ.ComponentMesh).mtxPivot.scaling = new ƒ.Vector3(Math.min(1, reloadRatio), scaling.y, scaling.z);
                if (reloadRatio >= 1) {
                    this.#attackBars[this.charges].getComponent(ƒ.ComponentMaterial).clrPrimary = this.#attackBarColor;
                    this.charges++;
                    this.chargeMoment = currentTime;
                    if (this.charges >= this.maxCharges) {
                        this.chargeMoment = -1;
                    }
                }
            }
        }

        protected reduceMutator(_mutator: ƒ.Mutator): void {
            delete _mutator.charges;
        }


        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                reloadTime: this.reloadTime,
                minDelayBetweenAttacks: this.minDelayBetweenAttacks,
                damage: this.damage,
                castTime: this.castTime,
                maxCharges: this.maxCharges,
            }

            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.reloadTime)
                this.reloadTime = _serialization.reloadTime;
            if (_serialization.minDelayBetweenAttacks)
                this.minDelayBetweenAttacks = _serialization.minDelayBetweenAttacks;
            if (_serialization.damage)
                this.damage = _serialization.damage;
            if (_serialization.castTime)
                this.castTime = _serialization.castTime;
            if (_serialization.maxCharges)
                this.maxCharges = _serialization.maxCharges;

            return this;
        }
    }
}