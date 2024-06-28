namespace Script {
    import ƒ = FudgeCore;
    export class MenuManager {
        constructor() {
            
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Project.addEventListener(ƒ.EVENT.RESOURCES_LOADED, this.resourcesLoaded);
            document.addEventListener("DOMContentLoaded", () => {
                document.getElementById("start").addEventListener("click", startViewport);
                document.getElementById("selection-overlay").querySelectorAll("button").forEach((button) => {
                    button.addEventListener("click", async () => {
                        await EntityManager.Instance.loadBrawler(button.dataset.brawler);
                        ƒ.Loop.start();
                        document.getElementById("selection-overlay").style.display = "none";
                    });
                })
            });
        }
        
        resourcesLoaded = () => {
            console.log("resources loaded");
            document.getElementById("start-overlay").style.display = "none";
        }
    }
}