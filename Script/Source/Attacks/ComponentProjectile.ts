namespace Script {
    import ƒ = FudgeCore;
    export class ComponentProjectile extends ƒ.Component {
        gravity: boolean = false;
        rotateInDirection: boolean = true;
        damage: number = 100;
        speed: number = 10;
        range: number = 3;
        #rb: ƒ.ComponentRigidbody;
        #owner: ComponentBrawler;
        #startPosition: ƒ.Vector3;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.init);
            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.loop);
        }

        private init = () => {
            this.#rb = this.node.getComponent(ƒ.ComponentRigidbody);
            this.#rb.effectGravity = Number(this.gravity);
            this.#rb.addEventListener(ƒ.EVENT_PHYSICS.TRIGGER_ENTER, this.onTriggerEnter);
        }

        public fire(_direction: ƒ.Vector2, _owner: ComponentBrawler) {
            this.#owner = _owner;
            if(this.rotateInDirection) {
                this.node.mtxLocal.lookIn(new ƒ.Vector3(_direction.x, 0, _direction.y));
                
            } else {
                this.#rb.setVelocity(new ƒ.Vector3(_direction.x, 0, _direction.y).scale(this.speed));
            }
        }

        protected onTriggerEnter = (_event: ƒ.EventPhysics) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody) return;
            //TODO do team check
            let damagable: Damagable = (<Damagable>_event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Damagable));
            this.explode();
            if(!damagable) return;
            damagable.health -= this.damage;
        }

        protected explode() {
            this.node.getParent().removeChild(this.node);
        }

        moveToPosition(_pos: ƒ.Vector3){
            let rb = this.node.getComponent(ƒ.ComponentRigidbody);
            rb.activate(false);
            this.#startPosition = _pos;
            this.node.mtxLocal.translation = _pos;
            rb.activate(true);
        }

        protected loop = () => {
            if(!this.#startPosition) return;
            let distance = ƒ.Vector3.DIFFERENCE(this.node.mtxWorld.translation, this.#startPosition).magnitudeSquared;
            if(distance > this.range * this.range) {
                this.node.getParent().removeChild(this.node);
            }
        }

    }
}