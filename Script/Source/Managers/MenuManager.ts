namespace Script {
    import ƒ = FudgeCore;
    export enum MENU_TYPE {
        NONE,
        START,
        LOADING,
        LOBBY,
        GAME_LOBBY,
        SELECTION,
    }
    export class MenuManager {
        overlays: Map<MENU_TYPE, HTMLElement> = new Map();
        
        constructor() {

            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Project.addEventListener(ƒ.EVENT.RESOURCES_LOADED, this.resourcesLoaded);
            document.addEventListener("DOMContentLoaded", () => {
                this.overlays.set(MENU_TYPE.START, document.getElementById("start-overlay"));
                this.overlays.set(MENU_TYPE.LOADING, document.getElementById("loading-overlay"));
                this.overlays.set(MENU_TYPE.LOBBY, document.getElementById("lobby-overlay"));
                this.overlays.set(MENU_TYPE.GAME_LOBBY, document.getElementById("game-lobby-overlay"));
                this.overlays.set(MENU_TYPE.SELECTION, document.getElementById("selection-overlay"));

                document.getElementById("start").addEventListener("click", () => {
                    this.showOverlay(MENU_TYPE.LOADING)
                    startViewport();
                });
                document.getElementById("selection-overlay").querySelectorAll("button").forEach((button) => {
                    button.addEventListener("click", async () => {
                        let graph = <ƒ.Graph>ƒ.Project.getResourcesByName("TrainingMap")[0];
                        viewport.setBranch(graph);
                        await EntityManager.Instance.loadBrawler(button.dataset.brawler);
                        ƒ.Loop.start();
                        // ƒ.Time.game.setScale(0.2);
                        this.showOverlay(MENU_TYPE.NONE);
                    });
                });
                document.getElementById("lobby-host").addEventListener("click", ()=>{
                    this.showOverlay(MENU_TYPE.GAME_LOBBY);
                });
                document.getElementById("lobby-join").addEventListener("click", ()=>{
                    this.showOverlay(MENU_TYPE.GAME_LOBBY);
                });
                document.getElementById("game-lobby-cancel").addEventListener("click", ()=>{
                    this.showOverlay(MENU_TYPE.LOBBY);
                });
                document.getElementById("game-lobby-start").addEventListener("click", ()=>{
                    this.showOverlay(MENU_TYPE.SELECTION);
                });

            });
        }

        resourcesLoaded = () => {
            console.log("resources loaded");
            this.showOverlay(MENU_TYPE.LOBBY);
        }

        showOverlay(_type: MENU_TYPE){
            if(!this.overlays.has(_type) && _type !== MENU_TYPE.NONE) return;
            this.overlays.forEach(overlay => {
                overlay.classList.add("hidden");
            });
            this.overlays.get(_type)?.classList.remove("hidden");
        }
    }
}