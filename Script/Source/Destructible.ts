namespace Script {
    import ƒ = FudgeCore;
    export class Destructible extends ƒ.Component {
        static destrcutibles: Destructible[] = [];

        public replaceWith: string = "";
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, () => {
                this.node.addEventListener("destruction", this.destroy.bind(this));
            });
            Destructible.destrcutibles.push(this);
        }
        public async destroy(_fromNetwork: boolean = false): Promise<void> {
            let index = Destructible.destrcutibles.indexOf(this);
            if(index < 0) return;
            Destructible.destrcutibles.splice(index, 1);

            if(!_fromNetwork){
                MultiplayerManager.broadcastDestructible(this);
            }

            let parent = this.node.getParent();
            parent.removeChild(this.node);
            
            if (this.replaceWith) {
                let replacement = <ƒ.Graph>ƒ.Project.getResourcesByName(this.replaceWith)[0]
                if (replacement) {
                    let instance = await ƒ.Project.createGraphInstance(replacement);
                    instance.mtxLocal.translation = this.node.mtxLocal.translation.clone;
                    instance.mtxLocal.scaling = this.node.mtxLocal.scaling.clone;
                    instance.mtxLocal.rotation = this.node.mtxLocal.rotation.clone;
                    parent.addChild(instance);
                }
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