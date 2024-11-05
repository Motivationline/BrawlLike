namespace Script {
    import ƒ = FudgeCore;
    export abstract class ServerSync extends ƒ.Component {
        id: string;
        ownerId: string;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
        }

        setupId(_id?: string) {
            this.id = _id;
            if (!_id) {
                this.id = MultiplayerManager.client.id + "+" + Math.floor(ƒ.Time.game.get()) + "+" + Math.floor(Math.random() * 10000 + 1);
            }
            this.ownerId = MultiplayerManager.getOwnerIdFromId(this.id);
            MultiplayerManager.register(this);
        }

        syncSelf() {
            MultiplayerManager.updateOne(this.getInfo(), this.id);
        }

        getInfo(): any {
            let info: any = {};
            info.position = this.node.mtxLocal.translation;
            return info;
        }
        putInfo(_data: any) {
            if (this.ownerId === MultiplayerManager.client.id && !_data.override) return;
            if (!_data) return;
            this.applyData(_data);
        }
        applyData(data: any) {
            if (data.type) {
                return;
            }
            let rb = this.node.getComponent(ƒ.ComponentRigidbody);
            rb.activate(false);
            this.node.mtxLocal.translation = new ƒ.Vector3(data.position.x, data.position.y, data.position.z);
            rb.activate(true);
        }
        abstract creationData(): CreationData;

    }
}