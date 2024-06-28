namespace Script {
    import ƒ = FudgeCore;
    export class ComponentProjectile extends ƒ.Component {
        gravity: boolean = false;
        rotateInDirection: boolean = true;
        damage: number = 100;
        speed: number = 10;
        range: number = 10;
        #rb: ƒ.ComponentRigidbody;
        #owner: ComponentBrawler;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.init);
        }

        private init = () => {
            this.#rb = this.node.getComponent(ƒ.ComponentRigidbody);
            this.#rb.effectGravity = Number(this.gravity);
            this.#rb.addEventListener(ƒ.EVENT_PHYSICS.TRIGGER_ENTER, this.onTriggerEnter);
        }

        public fire(_direction: ƒ.Vector2, _owner: ComponentBrawler) {
            this.#rb.setVelocity(new ƒ.Vector3(_direction.x, 0, _direction.y).scale(this.speed));
            this.#owner = _owner;
        }

        protected onTriggerEnter = (_event: ƒ.EventPhysics) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody) return;
            //TODO do team check
            (<Damagable>_event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Damagable)).health -= this.damage;
            this.explode();
        }

        protected explode() {
            this.node.getParent().removeChild(this.node);
        }

    }
}