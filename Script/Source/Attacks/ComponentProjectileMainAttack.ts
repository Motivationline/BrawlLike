namespace Script {
    import ƒ = FudgeCore;
    export class ComponentProjectileMainAttack extends ComponentMainAttack {
        speed: number = 2;
        range: number = 10;
        rotateInDirection: boolean = true;
        attachedToBrawler: boolean = false;

        attack(_direction: ƒ.Vector2): boolean {
            if(!super.attack(_direction)) return false;

            this.shootProjectile(_direction);
        }

        async shootProjectile(_direction: ƒ.Vector2) {
            let projectile: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName("DefaultProjectile")[0];
            let instance = await ƒ.Project.createGraphInstance(projectile);
            let projectileComponent: ComponentProjectile =<ComponentProjectile> instance.getAllComponents().find(c => c instanceof ComponentProjectile);
            projectileComponent.damage = this.damage;
            projectileComponent.speed = this.speed;
            projectileComponent.range = this.range;
            projectileComponent.rotateInDirection = this.rotateInDirection;

            let parent: ƒ.Node = this.attachedToBrawler ? this.node : undefined;
            EntityManager.Instance.addProjectile(instance, projectileComponent, parent);
            projectileComponent.moveToPosition(this.node.mtxWorld.translation.clone.add(ƒ.Vector3.Y(0.5)));
            projectileComponent.fire(_direction, <ComponentBrawler>this.node.getAllComponents().find(c => c instanceof ComponentBrawler));
        }
    }
}