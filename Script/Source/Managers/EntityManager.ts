namespace Script {
    import ƒ = FudgeCore;
    export class EntityManager extends ƒ.Component {
        static Instance: EntityManager;
        playerBrawler: Brawler;

        constructor(){
            if(EntityManager.Instance) return EntityManager.Instance;
            super();
            EntityManager.Instance = this;
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
              return;
      
            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.update);
        }

        loadBrawler = async () => {
            console.log("load Brawler");
            let brawler: ƒ.Graph = <ƒ.Graph>ƒ.Project.getResourcesByName("Brawler")[0];
            let spawnPoints = this.node.getParent().getChildrenByName("Spawnpoints")[0].getChildren();
            for(let i = 0; i < spawnPoints.length; i++){
                let instance = await ƒ.Project.createGraphInstance(brawler);
                this.node.addChild(instance);
                instance.mtxLocal.translation = spawnPoints[i].mtxLocal.translation.clone;
                this.playerBrawler = instance.getComponent(Brawler);
            }
        }

        update = () => {
            this.playerBrawler?.update();
        }
    }
}