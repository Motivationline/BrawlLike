namespace Script {
    import ƒ = FudgeCore;
    export class Shadow extends ƒ.Component {
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.moveShadow);
        }

        moveShadow = () => {
            let currentY = this.node.mtxWorld.translation.y;
            if(currentY !== 0) {
                this.node.mtxLocal.translateY(-currentY);
            }
        }
        
    }
}