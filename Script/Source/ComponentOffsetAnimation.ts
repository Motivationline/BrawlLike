namespace Script {
    import ƒ = FudgeCore;
    export class ComponentOffsetAnimation extends ƒ.Component {
        public offsetFactor: number = 1
        constructor() {
            super();

            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            // Listen to this component being added to or removed from a node
            this.addEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
            this.addEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.hndEvent);
        }


        public hndEvent = (_event: Event): void => {
            switch (_event.type) {

                case ƒ.EVENT.COMPONENT_ADD:
                    break;
                case ƒ.EVENT.COMPONENT_REMOVE:
                    this.removeEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
                    this.removeEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
                    break;
                case ƒ.EVENT.NODE_DESERIALIZED:
                    let animator = this.node.getComponent(ƒ.ComponentAnimator)
                    let randomTime = Math.round(Math.random() * animator.animation.totalTime * this.offsetFactor)
                    animator.jumpTo(randomTime)
                    break;
            }
        }
    }

}