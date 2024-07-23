namespace Script {
    import ƒ = FudgeCore;
    export enum AttackPreviewType {
        LINE = 0,
        CONE,
        AREA,
    }
    export abstract class ComponentAttack extends ƒ.Component {
        public previewType: AttackPreviewType = AttackPreviewType.LINE;
        public previewWidth: number = 1;
        public range: number = 5;
        #previewNode: ƒ.Node;
        #previewActive: boolean = false;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, () => {
                this.node.addEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initPreviewHandler, true);
            });
        }

        public showPreview() {
            this.#previewNode.activate(true);
            this.#previewActive = true;
        }

        public hidePreview() {
            this.#previewNode.activate(false);
            this.#previewActive = false;
        }

        public updatePreview(_brawlerPosition: ƒ.Vector3, _mousePosition: ƒ.Vector3) {
            if (!this.#previewActive) return;
            switch (this.previewType) {
                case AttackPreviewType.LINE:
                case AttackPreviewType.CONE:
                    let newRotation: ƒ.Vector3 = ƒ.Matrix4x4.LOOK_AT(_brawlerPosition, _mousePosition).rotation;
                    this.#previewNode.mtxLocal.rotation = ƒ.Vector3.Y(newRotation.y);
                    break;
                case AttackPreviewType.AREA:
                    let newPosition = ƒ.Vector3.DIFFERENCE(_mousePosition, _brawlerPosition);
                    if (newPosition.magnitude > this.range) newPosition.normalize(this.range);
                    this.#previewNode.mtxLocal.translation = newPosition;
                    break;
            }
        }

        private initPreviewHandler = () => {
            let quad: ƒ.MeshQuad = <ƒ.MeshQuad>ƒ.Project.getResourcesByType(ƒ.MeshQuad)[0];
            let texture: ƒ.Material;
            switch (this.previewType) {
                case AttackPreviewType.LINE:
                    texture = <ƒ.Material>ƒ.Project.getResourcesByName("PreviewLine")[0];
                    break;
                case AttackPreviewType.CONE:
                    texture = <ƒ.Material>ƒ.Project.getResourcesByName("PreviewCone")[0];
                    break;
                case AttackPreviewType.AREA:
                    texture = <ƒ.Material>ƒ.Project.getResourcesByName("PreviewArea")[0];
                    break;
            }
            if (!quad || !texture) {
                console.error("Failed to load preview resources.");
                return;
            }
            let node = new ƒ.Node("preview");
            node.addComponent(new ƒ.ComponentTransform());

            let childNode = new ƒ.Node("preview");
            let mesh = new ƒ.ComponentMesh(quad);
            childNode.addComponent(mesh);
            let mat = new ƒ.ComponentMaterial(texture)
            childNode.addComponent(mat);
            mat.sortForAlpha = true;

            if (this.previewType === AttackPreviewType.CONE || this.previewType === AttackPreviewType.LINE) {
                mesh.mtxPivot.scaleX(this.previewWidth);
                mesh.mtxPivot.translateZ(0.5);
                node.mtxLocal.scaling.z = this.range;
            } else if (this.previewType === AttackPreviewType.AREA) {
                mesh.mtxPivot.scaling.x = mesh.mtxPivot.scaling.z = this.previewWidth;
            }
            mesh.mtxPivot.rotateX(-90);

            node.addChild(childNode);

            this.#previewNode = node;
            this.node.addChild(node);
            this.hidePreview();
        }

        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                previewType: this.previewType,
                previewWidth: this.previewWidth,
                range: this.range,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.previewType)
                this.previewType = _serialization.previewType;
            if (_serialization.previewWidth)
                this.previewWidth = _serialization.previewWidth;
            if (_serialization.range)
                this.range = _serialization.range;

            return this;
        }

        public getMutatorAttributeTypes(_mutator: ƒ.Mutator): ƒ.MutatorAttributeTypes {
            let types: ƒ.MutatorAttributeTypes = super.getMutatorAttributeTypes(_mutator);
            if (types.previewType)
                types.previewType = AttackPreviewType;
            return types;
        }
    }
}