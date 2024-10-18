namespace Script {
    import ƒ = FudgeCore;
    export enum AttackPreviewType {
        LINE = 0,
        CONE,
        AREA,
    }

    export enum AttackType {
        MAIN,
        SPECIAL,
    }

    export enum ChargeType {
        PASSIVE,
        DAMAGE_DEALT,
        DAMAGE_RECEIVED,
    }

    export abstract class ComponentAttack extends ƒ.Component {
        public static activePreviews: Set<ƒ.Node> = new Set();

        public previewType: AttackPreviewType = AttackPreviewType.LINE;
        public previewWidth: number = 1;
        public range: number = 5;
        public attackType: AttackType = AttackType.MAIN;
        public maxCharges: number = 3;
        public damage: number = 100;
        public minDelayBetweenAttacks: number = 0.3;
        public energyGenerationPerSecond: number = 0;
        public energyNeededPerCharge: number = 1;
        public energyGeneratedPerDamageDealt: number = 0;
        public energyGeneratedPerDamageReceived: number = 0;
        public castingTime: number = 0;
        public lockBrawlerForAnimationTime: boolean = false;
        public lockTime: number = 0;
        public recoil: number = 0;
        public invulerableTime: number = 0;
        public effect: string = "";
        public effectDelay: number = 0;

        protected singleton: boolean = false;
        protected maxEnergy: number = 0;
        protected currentEnergy: number = 0;
        protected nextAttackAllowedAt: number = -1;
        #attackBars: ƒ.Node[] = [];
        #attackBarColor: ƒ.Color;
        #previewNode: ƒ.Node;
        #previewActive: boolean = false;
        #previewMaterial: ƒ.ComponentMaterial;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, () => {
                this.node.addEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initAttack, true);
            });
        }

        public showPreview() {
            this.#previewActive = true;
            ComponentAttack.activePreviews.add(this.#previewNode);
        }

        public hidePreview() {
            this.#previewActive = false;
            ComponentAttack.activePreviews.delete(this.#previewNode);
        }

        public updatePreview(_brawlerPosition: ƒ.Vector3, _mousePosition: ƒ.Vector3) {
            if (!this.#previewActive) return;
            switch (this.previewType) {
                case AttackPreviewType.LINE:
                case AttackPreviewType.CONE:
                    let newRotation: ƒ.Vector3 = ƒ.Matrix4x4.LOOK_AT(_brawlerPosition, _mousePosition).rotation;
                    this.#previewNode.mtxLocal.rotation = ƒ.Vector3.Y(newRotation.y);
                    break;
                case AttackPreviewType.AREA:
                    let newPosition = ƒ.Vector3.DIFFERENCE(_mousePosition, _brawlerPosition);
                    if (newPosition.magnitude > this.range) newPosition.normalize(this.range);
                    this.#previewNode.mtxLocal.translation = newPosition;
                    break;
            }
            
            if(!this.#previewMaterial) return;
            let {g} = this.#previewMaterial.clrPrimary;
            let charges = Math.floor(this.currentEnergy / this.energyNeededPerCharge);
            if (charges < 1 && g === 1) {
                // can't attack
                this.#previewMaterial.clrPrimary.g = 0;
                this.#previewMaterial.clrPrimary.b = 0;
            } else if(charges >= 1 && g !== 1) {
                // can attack
                this.#previewMaterial.clrPrimary.g = 1;
                this.#previewMaterial.clrPrimary.b = 1;
            }
        }

        private initAttack = async () => {
            // Preview
            let quad: ƒ.MeshQuad = <ƒ.MeshQuad>ƒ.Project.getResourcesByType(ƒ.MeshQuad)[0];
            let texture: ƒ.Material;
            switch (this.previewType) {
                case AttackPreviewType.LINE:
                    texture = <ƒ.Material>ƒ.Project.getResourcesByName("PreviewLine")[0];
                    break;
                case AttackPreviewType.CONE:
                    texture = <ƒ.Material>ƒ.Project.getResourcesByName("PreviewCone")[0];
                    break;
                case AttackPreviewType.AREA:
                    texture = <ƒ.Material>ƒ.Project.getResourcesByName("PreviewArea")[0];
                    break;
            }
            if (!quad || !texture) {
                console.error("Failed to load preview resources.");
                return;
            }
            let node = new ƒ.Node("preview");
            node.addComponent(new ƒ.ComponentTransform());

            let childNode = new ƒ.Node("previewInner");
            let mesh = new ƒ.ComponentMesh(quad);
            childNode.addComponent(mesh);
            let mat = new ƒ.ComponentMaterial(texture)
            childNode.addComponent(mat);
            mat.sortForAlpha = true;
            this.#previewMaterial = mat;

            if (this.previewType === AttackPreviewType.CONE || this.previewType === AttackPreviewType.LINE) {
                mesh.mtxPivot.scaleX(this.previewWidth);
                mesh.mtxPivot.translateZ(0.5);
                node.mtxLocal.scaling.z = this.range;
            } else if (this.previewType === AttackPreviewType.AREA) {
                mesh.mtxPivot.scaleX(this.previewWidth);
                mesh.mtxPivot.scaleZ(this.previewWidth);
            }
            mesh.mtxPivot.rotateX(-90);

            node.addChild(childNode);

            this.#previewNode = node;
            this.#previewNode.activate(false);
            this.node.addChild(this.#previewNode);

            // Chargebar

            this.maxEnergy = this.maxCharges * this.energyNeededPerCharge;
            this.currentEnergy = this.maxEnergy;
            if (this.attackType === AttackType.SPECIAL) this.currentEnergy = 0;
            let attackbar: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName("BasicAttackBar")[0];

            let width: number = 1 / this.maxCharges;
            let gap: number = width * 0.1;
            let visibleWidth: number = (1 - (this.maxCharges - 1) * gap) / this.maxCharges;
            this.#attackBarColor = ƒ.Color.CSS("Orange");
            if (this.attackType === AttackType.SPECIAL) this.#attackBarColor = ƒ.Color.CSS("Gold");
            for (let i: number = 0; i < this.maxCharges; i++) {
                let instance = await ƒ.Project.createGraphInstance(attackbar);
                this.node.addChild(instance);
                let translateBy = width * i - 0.5 + 0.5 * width;
                instance.mtxLocal.translateX(translateBy);
                if (this.attackType === AttackType.SPECIAL) instance.mtxLocal.translateY(-0.1);
                instance.mtxLocal.scaleX(visibleWidth);
                this.#attackBars.push(instance.getChild(0));
                if (i * this.energyNeededPerCharge < this.currentEnergy)
                    instance.getChild(0).getComponent(ƒ.ComponentMaterial).clrPrimary = this.#attackBarColor;
            }
        }

        attack(_direction: ƒ.Vector3): boolean {
            let charges = Math.floor(this.currentEnergy / this.energyNeededPerCharge);
            if (charges < 1) return false;
            let timeNow: number = ƒ.Time.game.get();
            if (this.nextAttackAllowedAt > timeNow) return false;
            if (charges < this.#attackBars.length) {
                let pivot = this.#attackBars[charges].getComponent(ƒ.ComponentMesh).mtxPivot;
                pivot.scaling = new ƒ.Vector3(0, pivot.scaling.y, pivot.scaling.z);
            }
            this.currentEnergy -= this.energyNeededPerCharge;
            this.#attackBars[charges - 1].getComponent(ƒ.ComponentMaterial).clrPrimary = ƒ.Color.CSS("gray");
            this.nextAttackAllowedAt = timeNow + this.minDelayBetweenAttacks * 1000;
            ƒ.Time.game.setTimer(this.castingTime * 1000, 1, this.executeAttack, _direction);
            ƒ.Time.game.setTimer(this.castingTime * 1000, 1, this.executeRecoil, _direction);
            ƒ.Time.game.setTimer(this.effectDelay * 1000, 1, this.executeEffect, _direction);
            let brawlerComp: ComponentBrawler = <ComponentBrawler>this.node.getAllComponents().find(c => c instanceof ComponentBrawler);
            if (this.invulerableTime) brawlerComp.makeInvulnerableFor(this.invulerableTime * 1000);
            return true;
        }

        executeAttack = (_event: ƒ.EventTimer) => {

        }

        executeRecoil = (_event: ƒ.EventTimer) => {
            let direction = <ƒ.Vector3>_event.arguments[0];
            let brawlerComp: ComponentBrawler = <ComponentBrawler>this.node.getAllComponents().find(c => c instanceof ComponentBrawler);
            if (this.recoil !== 0) {
                let recoil = new ƒ.Vector3(-direction.x, 0, -direction.z).normalize(this.recoil);
                brawlerComp.addVelocity(recoil, 0.25);
            }
        }

        private executeEffect = async (_event: ƒ.EventTimer) => {
            if (!this.effect) return;
            let direction: ƒ.Vector3 = <ƒ.Vector3>_event.arguments[0];
            if (!direction) return;

            let obj = <ƒ.Graph>ƒ.Project.getResourcesByName(this.effect)[0];
            if (!obj) return;

            let instance = await ƒ.Project.createGraphInstance(obj);

            this.node.addChild(instance);
            let comp = <ComponentEffect>instance.getAllComponents().find(c => c instanceof ComponentEffect);;
            comp.setup(direction);
        }

        update(): void {
            let charges = Math.floor(this.currentEnergy / this.energyNeededPerCharge);
            if (charges < this.maxCharges) {
                let deltaTime = ƒ.Loop.timeFrameGame / 1000;
                let energyCharge = deltaTime * this.energyGenerationPerSecond;
                this.charge(energyCharge, ChargeType.PASSIVE);
            }
        }

        public charge(_amt: number, type: ChargeType) {
            switch (type) {
                case ChargeType.PASSIVE: {
                    this.currentEnergy += _amt;
                    break;
                }
                case ChargeType.DAMAGE_DEALT: {
                    this.currentEnergy +=_amt * this.energyGeneratedPerDamageDealt;
                    break;
                }
                case ChargeType.DAMAGE_RECEIVED: {
                    this.currentEnergy += _amt * this.energyGeneratedPerDamageReceived;
                    break;
                }
            }
            this.currentEnergy = Math.min(this.currentEnergy, this.maxEnergy);

            for (let charge = 0; charge < this.maxCharges; charge++) {
                let scaling = this.#attackBars[charge].getComponent(ƒ.ComponentMesh).mtxPivot.scaling;
                let thisChargePercentage: number = Math.min(1, Math.max(0, (this.currentEnergy - (charge * this.energyNeededPerCharge)) / this.energyNeededPerCharge));
                this.#attackBars[charge].getComponent(ƒ.ComponentMesh).mtxPivot.scaling = new ƒ.Vector3(Math.min(1, thisChargePercentage), scaling.y, scaling.z);
                let translation = this.#attackBars[charge].getComponent(ƒ.ComponentMesh).mtxPivot.translation;
                this.#attackBars[charge].getComponent(ƒ.ComponentMesh).mtxPivot.translation = new ƒ.Vector3(Math.min(1, thisChargePercentage) / 2 - 0.5, translation.y, translation.z);
                if (thisChargePercentage >= 1) {
                    this.#attackBars[charge].getComponent(ƒ.ComponentMaterial).clrPrimary = this.#attackBarColor;
                }
            }
        }


        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                previewType: this.previewType,
                previewWidth: this.previewWidth,
                range: this.range,
                attackType: this.attackType,
                maxCharges: this.maxCharges,
                damage: this.damage,
                minDelayBetweenAttacks: this.minDelayBetweenAttacks,
                energyGenerationPerSecond: this.energyGenerationPerSecond,
                energyGeneratedPerDamageDealt: this.energyGeneratedPerDamageDealt,
                energyGeneratedPerDamageReceived: this.energyGeneratedPerDamageReceived,
                energyNeededPerCharge: this.energyNeededPerCharge,
                castingTime: this.castingTime,
                lockBrawlerForAnimationTime: this.lockBrawlerForAnimationTime,
                lockTime: this.lockTime,
                recoil: this.recoil,
                invulerableTime: this.invulerableTime,
                effect: this.effect,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.previewType !== undefined)
                this.previewType = _serialization.previewType;
            if (_serialization.previewWidth !== undefined)
                this.previewWidth = _serialization.previewWidth;
            if (_serialization.attackType !== undefined)
                this.attackType = _serialization.attackType;
            if (_serialization.range !== undefined)
                this.range = _serialization.range;
            if (_serialization.maxCharges !== undefined)
                this.maxCharges = _serialization.maxCharges;
            if (_serialization.damage !== undefined)
                this.damage = _serialization.damage;
            if (_serialization.minDelayBetweenAttacks !== undefined)
                this.minDelayBetweenAttacks = _serialization.minDelayBetweenAttacks;
            if (_serialization.energyGenerationPerSecond !== undefined)
                this.energyGenerationPerSecond = _serialization.energyGenerationPerSecond;
            if (_serialization.energyNeededPerCharge !== undefined)
                this.energyNeededPerCharge = _serialization.energyNeededPerCharge;
            if (_serialization.energyGeneratedPerDamageDealt !== undefined)
                this.energyGeneratedPerDamageDealt = _serialization.energyGeneratedPerDamageDealt;
            if (_serialization.energyGeneratedPerDamageReceived !== undefined)
                this.energyGeneratedPerDamageReceived = _serialization.energyGeneratedPerDamageReceived;
            if (_serialization.castingTime !== undefined)
                this.castingTime = _serialization.castingTime;
            if (_serialization.lockBrawlerForAnimationTime !== undefined)
                this.lockBrawlerForAnimationTime = _serialization.lockBrawlerForAnimationTime;
            if (_serialization.lockTime !== undefined)
                this.lockTime = _serialization.lockTime;
            if (_serialization.recoil !== undefined)
                this.recoil = _serialization.recoil;
            if (_serialization.invulerableTime !== undefined)
                this.invulerableTime = _serialization.invulerableTime;
            if (_serialization.effect !== undefined)
                this.effect = _serialization.effect;

            return this;
        }

        public getMutatorAttributeTypes(_mutator: ƒ.Mutator): ƒ.MutatorAttributeTypes {
            let types: ƒ.MutatorAttributeTypes = super.getMutatorAttributeTypes(_mutator);
            if (types.previewType)
                types.previewType = AttackPreviewType;
            if (types.attackType)
                types.attackType = AttackType;
            return types;
        }


        protected reduceMutator(_mutator: ƒ.Mutator): void {
            delete _mutator.maxEnergy;
            delete _mutator.currentEnergy;
            delete _mutator.nextAttackAllowedAt;
            delete _mutator.singleton;
        }
    }
}