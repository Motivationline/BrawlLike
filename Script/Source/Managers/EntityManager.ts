namespace Script {
    import ƒ = FudgeCore;
    export class EntityManager extends ƒ.Component {
        static Instance: EntityManager;
        brawlers: ComponentBrawler[] = [];
        playerBrawler: ComponentBrawler;
        projectiles: ComponentProjectile[] = [];

        constructor() {
            if (EntityManager.Instance) return EntityManager.Instance;
            super();
            EntityManager.Instance = this;
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.update);
        }

        loadBrawler = async (_playerBrawler: string = "Brawler") => {
            console.log("load Brawler");
            let defaultBrawler: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName("Brawler")[0];
            let playerBrawler: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName(_playerBrawler)[0];
            let spawnPoints = this.node.getParent().getChildrenByName("Spawnpoints")[0].getChildren();
            for (let i = 0; i < spawnPoints.length - 1; i++) {
                await this.initBrawler(defaultBrawler, spawnPoints[i].mtxLocal.translation.clone);
            }
            this.playerBrawler = await this.initBrawler(playerBrawler, spawnPoints[spawnPoints.length - 1].mtxLocal.translation.clone);
            let cameraGraph = <ƒ.Graph>ƒ.Project.getResourcesByName("CameraBrawler")[0];
            let cameraInstance = await ƒ.Project.createGraphInstance(cameraGraph);
            this.playerBrawler.node.addChild(cameraInstance);
            let camera = cameraInstance.getComponent(ƒ.ComponentCamera);
            viewport.camera = camera;
        }

        private async initBrawler(_g: ƒ.Graph, _pos: ƒ.Vector3): Promise<ComponentBrawler> {
            let instance = await ƒ.Project.createGraphInstance(_g);
            this.node.addChild(instance);
            instance.mtxLocal.translation = _pos;
            let cb = <ComponentBrawler>instance.getAllComponents().find(c => c instanceof ComponentBrawler);
            this.brawlers.push(cb);
            return cb;
        }

        public addProjectile(_instance: ƒ.GraphInstance, _component: ComponentProjectile, _parent: ƒ.Node) {
            if (!_parent) {
                _parent = this.node;
            }
            this.projectiles.push(_component);
            _parent.addChild(_instance);
        }

        public removeProjectile(_proj: ComponentProjectile) {
            _proj.node?.getParent()?.removeChild(_proj.node);
            let index: number = this.projectiles.indexOf(_proj);
            if (index >= 0) {
                this.projectiles.splice(index, 1);
            }
        }

        update = () => {
            for (let b of this.brawlers) {
                b.update();
            }
        }
    }
}