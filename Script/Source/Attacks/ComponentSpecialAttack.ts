namespace Script {
    import ƒ = FudgeCore;
    export abstract class ComponentSpecialAttack extends ƒ.Component {
        damage: number = 100;
        castTime: number = 0.05;
        requiredCharge: number = 500;

        protected currentCharge: number = 0;

        charge(_amt: number){
            this.currentCharge = Math.min(this.currentCharge + _amt, this.requiredCharge);
        }

        attack(_direction: ƒ.Vector2): boolean {
            if (this.currentCharge < this.requiredCharge) return false;
            return true;
        }

        protected reduceMutator(_mutator: ƒ.Mutator): void {
            delete _mutator.currentCharge;
        }
    }
}