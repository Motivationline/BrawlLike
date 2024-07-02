namespace Script {
    import ƒ = FudgeCore;
    export class CowboySpecialAttack extends ComponentSpecialAttack {
        attack(_direction: ƒ.Vector2): boolean {
            if(!super.attack(_direction)) return false;

            return true;
        }
    }
}