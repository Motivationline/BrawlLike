namespace Script {
    import ƒ = FudgeCore;
    export class Destructible extends ƒ.Component {
        constructor(){
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, ()=>{
                this.node.addEventListener("destruction", this.destroy.bind(this));
            });
        }
        public destroy(): void {
            this.node.getParent().removeChild(this.node);
        }
    }
}