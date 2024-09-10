namespace Script {
    import ƒ = FudgeCore;
    export class DummyBrawler extends ComponentBrawler {
        public respawnTime: number = 5;
        public walkRandom: boolean = false;
        #respawnPos: ƒ.Vector3 = new ƒ.Vector3();
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.update.bind(this));
            // this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, ()=>{
            //     let rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
            //     rigidbody.addEventListener(ƒ.EVENT_PHYSICS.COLLISION_ENTER, this.changeDirection);
            // })
        }

        protected death(): void {
            this.#respawnPos.copy(this.node.mtxLocal.translation);
            ƒ.Time.game.setTimer(this.respawnTime * 1000, 1, this.respawn);
            this.node.activate(false);
        }

        private respawn = () => {
            this.node.activate(true);
            this.health = Infinity;
        }
        
        private changeDirection = () => {
            // this.setMovement(new ƒ.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                respawnTime: this.respawnTime,
                walkRandom: this.walkRandom,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null) {
                await super.deserialize(_serialization[super.constructor.name]);
            }
            if (_serialization.respawnTime !== undefined) {
                this.respawnTime = _serialization.respawnTime;
            }
            if (_serialization.walkRandom !== undefined) {
                this.walkRandom = _serialization.walkRandom;
            }
            return this;
        }

        public update(): void {
            if (this.walkRandom && this.direction.magnitudeSquared === 0) {
                this.changeDirection();
            }
            super.update();
        }

    }
}