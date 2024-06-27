namespace Script {
    import ƒ = FudgeCore;
    export class MenuManager {
        constructor(){
            ƒ.Project.addEventListener(ƒ.EVENT.RESOURCES_LOADED, this.resourcesLoaded);
            document.addEventListener("DOMContentLoaded", ()=>{
                document.getElementById("start").addEventListener("click", async ()=> {
                    document.getElementById("start-overlay").style.display = "none";
                    await EntityManager.Instance.loadBrawler();
                    ƒ.Loop.start();
                });
            });
        }

        resourcesLoaded = () => {
            console.log("resources loaded");
            (<HTMLButtonElement>document.getElementById("start")).disabled = false;
        }
    }
}