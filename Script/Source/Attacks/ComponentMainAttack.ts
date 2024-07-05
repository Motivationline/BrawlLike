namespace Script {
    import ƒ = FudgeCore;
    export abstract class ComponentMainAttack extends ƒ.Component {
        reloadTime: number = 1;
        minDelayBetweenAttacks: number = 0.3;
        damage: number = 100;
        castTime: number = 0.05;
        maxCharges: number = 3;

        protected charges: number = 3;
        attack(_direction: ƒ.Vector3): boolean {
            if (this.charges == 0) return false;
            return true;
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
            if(_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if(_serialization.reloadTime)
                this.reloadTime = _serialization.reloadTime;
            if(_serialization.minDelayBetweenAttacks)
                this.minDelayBetweenAttacks = _serialization.minDelayBetweenAttacks;
            if(_serialization.damage)
                this.damage = _serialization.damage;
            if(_serialization.castTime)
                this.castTime = _serialization.castTime;
            if(_serialization.maxCharges)
                this.maxCharges = _serialization.maxCharges;

            return this;
        }
    }
}