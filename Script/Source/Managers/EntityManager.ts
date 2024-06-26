namespace Script {
    import ƒ = FudgeCore;
    export class EntityManager extends ƒ.Component {
        playerBrawler: Brawler;

        constructor(){
            super();
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
              return;
      
            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.update);
            ƒ.Project.addEventListener(ƒ.EVENT.RESOURCES_LOADED, this.loadBrawler);
        }

        loadBrawler = () => {
            let brawler: ƒ.GraphInstance = <ƒ.GraphInstance><unknown>ƒ.Project.getResourcesByName("Brawler")[0];
            this.playerBrawler = brawler.getComponent(Brawler);
            this.node.addChild(brawler);
        }

        update = () => {
            this.playerBrawler.update();
        }
    }
}