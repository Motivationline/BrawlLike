namespace Script {
    import ƒ = FudgeCore;
    export class FroggerSpecialAttack extends ComponentProjectileAttack {
        radius: number = 1.5;
        amtProjectiles: number = 5;

        executeAttack: ƒ.TimerHandler = (_event: ƒ.EventTimer) => {
            let direction = <ƒ.Vector3>_event.arguments[0];
            this.shootProjectiles(direction);
        }

        async shootProjectiles(_direction: ƒ.Vector3): Promise<void> {
            if (_direction.magnitude > this.range)
                _direction.normalize(this.range);

            //shoot one in the center
            await this.shootProjectile(_direction.clone);
            //shoot other projectiles in radius around with random start angle
            let projAmt = this.amtProjectiles - 1;
            let angle: number = Math.random() * Math.PI;
            let angleBetweenProjectiles: number = Math.PI * 2 / projAmt;
            for (let proj: number = 0; proj < projAmt; proj++) {
                let newPosition = ƒ.Vector3.SUM(_direction, new ƒ.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize(this.radius));
                await this.shootProjectile(newPosition, true);
                angle += angleBetweenProjectiles;
            }

        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                radius: this.radius,
                amtProjectiles: this.amtProjectiles,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {

            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);

            if (_serialization.radius !== undefined)
                this.radius = _serialization.radius;
            if (_serialization.amtProjectiles !== undefined)
                this.amtProjectiles = _serialization.amtProjectiles;
            return this;
        }
    }
}