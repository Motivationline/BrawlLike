///<reference path="../ComponentProjectileMainAttack.ts" />
namespace Script {
    import ƒ = FudgeCore;
    export class CowboyMainAttack extends ComponentProjectileMainAttack {
        attack(_direction: ƒ.Vector2): boolean {
            if (!super.attack(_direction)) return false;
            
            return true;
        }

    }
}