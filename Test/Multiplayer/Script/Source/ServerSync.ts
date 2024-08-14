namespace Script {
    import ƒ = FudgeCore;
    export class ServerSync extends ƒ.Component {
        id: string;
        ownerId: string;
        constructor(_ownerId?: string, _id?: string) {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.ownerId = _ownerId;
            this.id = _id;
            MultiplayerManager.register(this);
            if (!this.id) {
                this.id = this.ownerId + "_" + ƒ.Time.game.get() + "_" + Math.floor(Math.random() * 10000 + 1);
            }
        }

        getInfo() {
            let info: any = {};
            info.position = this.node.mtxLocal.translation;
            return info;
        }
        putInfo(_data: any) {
            if (this.ownerId === MultiplayerManager.client.id) return;
            if (!_data) return;
            this.applyData(_data);
        }
        applyData(data: any) {
            let rb = this.node.getComponent(ƒ.ComponentRigidbody);
            rb.activate(false);
            this.node.mtxLocal.translation = new ƒ.Vector3(data.position.x, data.position.y, data.position.z);
            rb.activate(true);
        }

    }
}