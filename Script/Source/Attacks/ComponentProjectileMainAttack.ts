namespace Script {
    import ƒ = FudgeCore;
    export class ComponentProjectileMainAttack extends ComponentMainAttack {
        speed: number = 2;
        range: number = 10;
        rotateInDirection: boolean = true;
        attachedToBrawler: boolean = false;
        projectile: string = "DefaultProjectile";

        attack(_direction: ƒ.Vector3): boolean {
            if (!super.attack(_direction)) return false;

            this.shootProjectile(_direction);
            return true;
        }

        async shootProjectile(_direction: ƒ.Vector3) {
            let projectile: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName(this.projectile)[0];
            let instance = await ƒ.Project.createGraphInstance(projectile);
            let projectileComponent: ComponentProjectile = <ComponentProjectile>instance.getAllComponents().find(c => c instanceof ComponentProjectile);
            projectileComponent.damage = this.damage;
            projectileComponent.speed = this.speed;
            projectileComponent.range = this.range;
            projectileComponent.rotateInDirection = this.rotateInDirection;

            let parent: ƒ.Node = this.attachedToBrawler ? this.node : undefined;
            EntityManager.Instance.addProjectile(instance, projectileComponent, parent);
            projectileComponent.moveToPosition(this.node.mtxWorld.translation.clone.add(ƒ.Vector3.Y(0.5)));
            projectileComponent.fire(_direction, <ComponentBrawler>this.node.getAllComponents().find(c => c instanceof ComponentBrawler));
        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                speed: this.speed,
                range: this.range,
                rotateInDirection: this.rotateInDirection,
                attachedToBrawler: this.attachedToBrawler,
                projectile: this.projectile,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {

            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);

            if (_serialization.speed)
                this.speed = _serialization.speed;
            if (_serialization.range)
                this.range = _serialization.range;
            if (_serialization.rotateInDirection)
                this.rotateInDirection = _serialization.rotateInDirection;
            if (_serialization.attachedToBrawler)
                this.attachedToBrawler = _serialization.attachedToBrawler;
            if (_serialization.projectile)
                this.projectile = _serialization.projectile;
            return this;
        }
    }
}