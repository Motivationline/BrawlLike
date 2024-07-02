namespace Script {
    import ƒ = FudgeCore;
    export abstract class ComponentMainAttack extends ƒ.Component {
        reloadTime: number = 1;
        minDelayBetweenAttacks: number = 0.3;
        damage: number = 100;
        castTime: number = 0.05;
        maxCharges: number = 3;

        protected charges: number = 3;
        attack(_direction: ƒ.Vector2): boolean {
            if (this.charges == 0) return false;
            return true;
        }

        protected reduceMutator(_mutator: ƒ.Mutator): void {
            delete _mutator.charges;
        }
    }
}