namespace Script {
    import ƒ = FudgeCore;
    export class Destructible extends ƒ.Component {
        public destroy(): void {
            this.node.getParent().removeChild(this.node);
        }
    }
}