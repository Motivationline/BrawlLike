/// <reference path="ComponentAttack.ts"/>

namespace Script {
    import ƒ = FudgeCore;
    export class ComponentAOEAttack extends ComponentAttack {
        offset: ƒ.Vector3 = ƒ.Vector3.ZERO();
        aoeGraph: string = "";

        executeAttack: ƒ.TimerHandler = async (_event: ƒ.EventTimer) => {
            let direction: ƒ.Vector3 = <ƒ.Vector3>_event.arguments[0];
            if (!direction) return;

            if (!this.aoeGraph) return;

            let aoe = <ƒ.Graph>ƒ.Project.getResourcesByName(this.aoeGraph)[0];
            let instance = await ƒ.Project.createGraphInstance(aoe);
            let compAOE = <ComponentAOE>instance.getAllComponents().find(c => c instanceof ComponentAOE);

            let owner = <ComponentBrawler>this.node.getAllComponents().find(c => c instanceof ComponentBrawler);
            let angle: number = ƒ.Vector3.ANGLE(new ƒ.Vector3(direction.x, 0, direction.z), ƒ.Vector3.Z());
            angle *= Math.PI / 180 * Math.sign(direction.x);

            // see https://stackoverflow.com/questions/14607640/rotating-a-vector-in-3d-space
            let rotatedOffset = new ƒ.Vector3(this.offset.x * Math.cos(angle) + this.offset.z * Math.sin(angle), this.offset.y, -this.offset.x * Math.sin(angle) + this.offset.z * Math.cos(angle))
            
            if (compAOE.attachedToBrawler) {
                this.node.addChild(instance);
                compAOE.setup(owner, rotatedOffset);
            } else {
                this.node.getParent().addChild(instance);
                compAOE.setup(owner, ƒ.Vector3.SUM(this.node.mtxLocal.translation, rotatedOffset));
            }

        };



        public serialize(): ƒ.Serialization {
            let serialization: ƒ.Serialization = {
                [super.constructor.name]: super.serialize(),
                aoeGraph: this.aoeGraph,
                offset: this.offset.serialize(),
            }
            return serialization;
        }

        public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.aoeGraph !== undefined)
                this.aoeGraph = _serialization.aoeGraph;
            if (_serialization.offset !== undefined)
                this.offset.deserialize(_serialization.offset);
            return this;
        }
    }
}