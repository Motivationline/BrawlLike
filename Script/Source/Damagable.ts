namespace Script {
    import ƒ = FudgeCore;
    export abstract class Damagable extends ƒ.Component {
        #health: number;
        rigidbody: ƒ.ComponentRigidbody;

        constructor(){
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
            if(this.#health < 0) this.death();
        }


        protected abstract death(): void;
    }   
}