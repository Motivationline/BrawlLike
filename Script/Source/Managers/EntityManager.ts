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

        loadBrawler = async (_playerBrawler: Player) => {
            console.log("load Brawler");
            if(!_playerBrawler) return;
            let playerBrawler: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName(_playerBrawler.chosenBrawler)[0];
            let spawnPoint = GameManager.Instance.getSpawnPointForPlayer(LobbyManager.client.id);
            this.playerBrawler = await this.initBrawler(playerBrawler, spawnPoint);
            let cameraGraph = <ƒ.Graph>ƒ.Project.getResourcesByName("CameraBrawler")[0];
            let cameraInstance = await ƒ.Project.createGraphInstance(cameraGraph);
            this.playerBrawler.node.addChild(cameraInstance);
            let camera = cameraInstance.getComponent(ƒ.ComponentCamera);
            viewport.camera = camera;

            this.playerBrawler.setupId();
            _playerBrawler.brawler = this.playerBrawler;
        }

        private async initBrawler(_g: ƒ.Graph, _pos: ƒ.Vector3): Promise<ComponentBrawler> {
            let instance = await ƒ.Project.createGraphInstance(_g);
            this.node.addChild(instance);
            instance.mtxLocal.translation = _pos;
            let cb = <ComponentBrawler>instance.getAllComponents().find(c => c instanceof ComponentBrawler);
            this.brawlers.push(cb);
            return cb;
        }

        public addObjectThroughNetwork(_instance: ƒ.GraphInstance){
            let components = _instance.getAllComponents();
            let brawler = <ComponentBrawler>components.find(c => c instanceof ComponentBrawler);
            if(brawler)
                this.brawlers.push(brawler)
            let proj = <ComponentProjectile>components.find(c => c instanceof ComponentProjectile);
            if(proj)
                this.addProjectile(_instance, proj);

            this.node.addChild(_instance);
        }

        public addProjectile(_instance: ƒ.GraphInstance, _component: ComponentProjectile, _parent?: ƒ.Node) {
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