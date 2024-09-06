namespace Script {
    import ƒ = FudgeCore;
    export class ComponentEffect extends ƒ.Component {
        duration: number = 1;
        offset: ƒ.Vector3 = new ƒ.Vector3();
        offsetIsLocal: boolean = true;
        #endTime: number = Infinity;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.init);
            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.loop);
        }

        private init = () => {
            this.removeEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.init);
            if (!this.node.getComponent(ƒ.ComponentTransform))
                this.node.addComponent(new ƒ.ComponentTransform());
        }

        public setup(_direction: ƒ.Vector3) {

            let angle: number = ƒ.Vector3.ANGLE(new ƒ.Vector3(_direction.x, 0, _direction.z), ƒ.Vector3.Z());
            angle *= Math.PI / 180 * Math.sign(_direction.x);
            let rotatedOffset = new ƒ.Vector3(this.offset.x * Math.cos(angle) + this.offset.z * Math.sin(angle), this.offset.y, -this.offset.x * Math.sin(angle) + this.offset.z * Math.cos(angle))

            this.node.mtxLocal.translate(this.offsetIsLocal ? rotatedOffset : this.offset);
            if (this.offsetIsLocal) this.node.mtxLocal.rotateY(angle * 180 / Math.PI);
            this.#endTime = ƒ.Time.game.get() + this.duration * 1000;
        }

        private loop = () => {
            let currentTime = ƒ.Time.game.get();
            if (currentTime > this.#endTime) {
                ƒ.Loop.removeEventListener(ƒ.EVENT.LOOP_FRAME, this.loop);
                this.node.getParent()?.removeChild(this.node);
            }
        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                duration: this.duration,
                offset: this.offset.serialize(),
                offsetIsLocal: this.offsetIsLocal,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.duration !== undefined)
                this.duration = _serialization.duration;
            if (_serialization.offset !== undefined)
                this.offset.deserialize(_serialization.offset);
            if (_serialization.offsetIsLocal !== undefined)
                this.offsetIsLocal = _serialization.offsetIsLocal;
            return this;
        }

    }
}