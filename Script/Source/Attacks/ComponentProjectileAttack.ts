namespace Script {
    import ƒ = FudgeCore;
    export class ComponentProjectileAttack extends ComponentAttack {
        speed: number = 2;
        range: number = 10;
        recoil: number = 0;
        rotateInDirection: boolean = true;
        attachedToBrawler: boolean = false;
        projectile: string = "DefaultProjectile";
        gravity: boolean = false;
        destructive: boolean = false;

        attack(_direction: ƒ.Vector3, _shootProjectile: boolean = true): boolean {
            if (!super.attack(_direction)) return false;

            if (_shootProjectile) this.shootProjectile(_direction);
            return true;
        }

        async shootProjectile(_direction: ƒ.Vector3, _ignoreRange: boolean = false) {
            let projectile: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName(this.projectile)[0];
            let instance = await ƒ.Project.createGraphInstance(projectile);
            let projectileComponent: ComponentProjectile = <ComponentProjectile>instance.getAllComponents().find(c => c instanceof ComponentProjectile);
            projectileComponent.damage = this.damage;
            projectileComponent.speed = this.speed;
            projectileComponent.range = this.range;
            projectileComponent.rotateInDirection = this.rotateInDirection;
            projectileComponent.gravity = this.gravity;
            projectileComponent.destructive = this.destructive;

            let parent: ƒ.Node = this.attachedToBrawler ? this.node : undefined;
            EntityManager.Instance.addProjectile(instance, projectileComponent, parent);
            projectileComponent.moveToPosition(this.node.mtxWorld.translation.clone.add(ƒ.Vector3.Y(0.5)));
            let brawlerComp: ComponentBrawler = <ComponentBrawler>this.node.getAllComponents().find(c => c instanceof ComponentBrawler);

            if (this.gravity) {
                if (_direction.magnitude > this.range && !_ignoreRange)
                    _direction.normalize(this.range);
            } else {
                _direction.normalize();
            }
            projectileComponent.fire(_direction, brawlerComp);

            if (this.recoil !== 0) {
                let recoil = new ƒ.Vector3(-_direction.x, 0, -_direction.z).normalize(this.recoil);
                brawlerComp.addVelocity(recoil, 0.25);
            }
        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                speed: this.speed,
                range: this.range,
                rotateInDirection: this.rotateInDirection,
                attachedToBrawler: this.attachedToBrawler,
                projectile: this.projectile,
                recoil: this.recoil,
                gravity: this.gravity,
                destructive: this.destructive,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {

            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);

            if (_serialization.speed !== undefined)
                this.speed = _serialization.speed;
            if (_serialization.range !== undefined)
                this.range = _serialization.range;
            if (_serialization.rotateInDirection !== undefined)
                this.rotateInDirection = _serialization.rotateInDirection;
            if (_serialization.attachedToBrawler !== undefined)
                this.attachedToBrawler = _serialization.attachedToBrawler;
            if (_serialization.projectile !== undefined)
                this.projectile = _serialization.projectile;
            if (_serialization.recoil !== undefined)
                this.recoil = _serialization.recoil;
            if (_serialization.gravity !== undefined)
                this.gravity = _serialization.gravity;
            if (_serialization.destructive !== undefined)
                this.destructive = _serialization.destructive;
            return this;
        }
    }
}