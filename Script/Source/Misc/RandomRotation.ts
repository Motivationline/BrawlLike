namespace Script {
    import ƒ = FudgeCore;

    export class ComponentRandomRotation extends ƒ.Component {
        public static readonly iSubclass: number = ƒ.Component.registerSubclass(ComponentRandomRotation);
        public rotationY: number = 5;

        constructor() {
            super();

            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            // Listen to this component being added to or removed from a node
            this.addEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
            this.addEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.hndEvent);
        }

        // Activate the functions of this component as response to events
        public hndEvent = (_event: Event): void => {
            switch (_event.type) {
                case ƒ.EVENT.COMPONENT_ADD:
                    break;
                case ƒ.EVENT.COMPONENT_REMOVE:
                    this.removeEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
                    this.removeEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
                    break;
                case ƒ.EVENT.NODE_DESERIALIZED:
                    this.node.getChild(0).mtxLocal.rotateY(this.randomizeRotation(this.rotationY))
                    break;
            }
        }

        private randomizeRotation(_number: number): number {
            let rangeNumber: number = Math.random() * _number
            let randNumber:number = Math.random()
            if (randNumber < 0.5) { return rangeNumber*-1 }
            else {
                return rangeNumber
            }
        }
    }
}