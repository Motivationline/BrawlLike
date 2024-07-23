namespace Script {
    import ƒ = FudgeCore;
    export enum AttackPreviewType {
        LINE = 0,
        CONE,
        AREA,
    }
    export abstract class ComponentAttack extends ƒ.Component {
        public previewType: AttackPreviewType = AttackPreviewType.LINE;

        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            
        }
        
        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                previewType: this.previewType,
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.previewType)
                this.previewType = _serialization.previewType;

            return this;
        }

        public getMutatorAttributeTypes(_mutator: ƒ.Mutator): ƒ.MutatorAttributeTypes {
            let types: ƒ.MutatorAttributeTypes = super.getMutatorAttributeTypes(_mutator);
            if(types.previewType)
                types.previewType = AttackPreviewType;
            return types;    
        }
    }
}