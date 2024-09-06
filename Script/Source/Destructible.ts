namespace Script {
    import ƒ = FudgeCore;
    export class Destructible extends ƒ.Component {
        public replaceWith: string = "";
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, () => {
                this.node.addEventListener("destruction", this.destroy.bind(this));
            });
        }
        public async destroy(): Promise<void> {
            let parent = this.node.getParent();

            if (this.replaceWith) {
                let replacement = <ƒ.Graph>ƒ.Project.getResourcesByName(this.replaceWith)[0]
                if (replacement) {
                    let instance = await ƒ.Project.createGraphInstance(replacement);
                    instance.mtxLocal.translation = this.node.mtxLocal.translation.clone;
                    instance.mtxLocal.scaling = this.node.mtxLocal.scaling.clone;
                    instance.mtxLocal.rotation = this.node.mtxLocal.rotation.clone;
                    parent.replaceChild(this.node, instance);
                } else {
                    parent.removeChild(this.node);
                }

            } else {
                parent.removeChild(this.node);
            }

        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                replaceWith: this.replaceWith,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.replaceWith !== undefined)
                this.replaceWith = _serialization.replaceWith;
            return this;
        }
    }
}