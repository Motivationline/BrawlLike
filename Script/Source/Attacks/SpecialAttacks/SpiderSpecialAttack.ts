namespace Script {
    import ƒ = FudgeCore;
    export class SpiderSpecialAttack extends ComponentAOEAttack {
        public moveColliderUpBy: number = 1;
        public moveColliderUpForSeconds: number = 1;
        public aoeDelay: number = 0;

        public serialize(): ƒ.Serialization {
            let s: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                moveColliderUpBy: this.moveColliderUpBy,
                aoeDelay: this.aoeDelay,
            }
            return s;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] !== null) {
                await super.deserialize(_serialization[super.constructor.name]);
            }
            if (_serialization.moveColliderUpBy !== undefined)
                this.moveColliderUpBy = _serialization.moveColliderUpBy;
            if (_serialization.aoeDelay !== undefined)
                this.aoeDelay = _serialization.aoeDelay;
            return this;
        }

        executeAttack: ƒ.TimerHandler = async (_event: ƒ.EventTimer) => {
            let direction: ƒ.Vector3 = <ƒ.Vector3>_event.arguments[0];
            ƒ.Time.game.setTimer(this.aoeDelay * 1000, 1, ()=>{this.spawnAOE(direction)});
            
            let rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
            rigidbody.activate(false);
            rigidbody.mtxPivot.translateY(this.moveColliderUpBy);
            rigidbody.activate(true);
            ƒ.Time.game.setTimer(this.moveColliderUpForSeconds * 1000, 1, ()=>{
                rigidbody.activate(false);
                rigidbody.mtxPivot.translateY(-this.moveColliderUpBy);
                rigidbody.activate(true);
            });
        }


    }
}