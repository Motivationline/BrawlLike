///<reference path="../ComponentProjectileAttack.ts" />
namespace Script {
    import ƒ = FudgeCore;
    export class CowboyMainAttack extends ComponentProjectileAttack {
        attack(_direction: ƒ.Vector3): boolean {
            if (!super.attack(_direction)) return false;

            return true;
        }

    }
}