namespace Script {
    import ƒ = FudgeCore;
    export class InputManager {
        static Instance: InputManager;
        constructor() {
            if (InputManager.Instance) return InputManager.Instance;
            InputManager.Instance = this;

            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.update);
        }

        update = () => {
            let direction: ƒ.Vector3 = ƒ.Recycler.reuse(ƒ.Vector3).set(0,0,0);
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT]))
                direction.x += -1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]))
                direction.x += 1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]))
                direction.z += 1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP]))
                direction.z += -1;

            if(direction.equals(EntityManager.Instance.playerBrawler.getDirection())) {
                ƒ.Recycler.store(direction);
                return;
            }

            let mgtSqrt = direction.magnitudeSquared;
            if (mgtSqrt === 0) {
                EntityManager.Instance.playerBrawler?.setMovement(direction);
                ƒ.Recycler.store(direction);
                return;
            }
            if (mgtSqrt > 1) {
                direction.normalize(1);
            }

            EntityManager.Instance.playerBrawler?.setMovement(direction);
            ƒ.Recycler.store(direction);
        }

        mainPreviewTimeout: number;
        specialPreviewTimeout: number;

        mousedown = (_event: MouseEvent) => {
            _event.preventDefault();
            if(_event.button == 0){
                this.mainPreviewTimeout = setTimeout(()=>{
                    EntityManager.Instance.playerBrawler.showPreview(ATTACK_TYPE.MAIN);
                }, 100);
            } else if(_event.button == 2){
                this.specialPreviewTimeout = setTimeout(()=>{
                    EntityManager.Instance.playerBrawler.showPreview(ATTACK_TYPE.SPECIAL);
                }, 100);
            }
        }
        mouseup = (_event: MouseEvent) => {
            _event.preventDefault();
            if(_event.button == 0){
                clearTimeout(this.mainPreviewTimeout);
                this.tryToAttack(ATTACK_TYPE.MAIN, _event);
                EntityManager.Instance.playerBrawler.hidePreview(ATTACK_TYPE.MAIN);
            } else if (_event.button == 2){
                clearTimeout(this.specialPreviewTimeout);
                this.tryToAttack(ATTACK_TYPE.SPECIAL, _event);
                EntityManager.Instance.playerBrawler.hidePreview(ATTACK_TYPE.SPECIAL);
            }
        }

        mousemove = (_event: MouseEvent) => {
            _event.preventDefault();
            if(!EntityManager.Instance || !EntityManager.Instance.playerBrawler) return;
            EntityManager.Instance.playerBrawler.mousePosition = new ƒ.Vector2(_event.clientX, _event.clientY);
        }

        private tryToAttack(_atk: ATTACK_TYPE, _event: MouseEvent) {
            _event.preventDefault();
            let pb = EntityManager.Instance.playerBrawler;
            if (!pb) return;
            viewport.pointClientToProjection
            // let playerPos = viewport.pointWorldToClient(pb.node.mtxWorld.translation);
            // let clientPos = viewport.pointClientToSource(new ƒ.Vector2(_event.clientX, _event.clientY));
            let clickPos = InputManager.mousePositionToWorldPlanePosition(new ƒ.Vector2(_event.clientX, _event.clientY))
            let direction = ƒ.Vector3.DIFFERENCE(clickPos, pb.node.mtxWorld.translation);
            EntityManager.Instance.playerBrawler?.attack(_atk, direction);
        }
        
        static mousePositionToWorldPlanePosition(_mousePosition: ƒ.Vector2): ƒ.Vector3 {
            let ray = viewport.getRayFromClient(_mousePosition);
            let clickPos = ray.intersectPlane(ƒ.Vector3.ZERO(), ƒ.Vector3.Y(1));
            return clickPos;
        }
    }
}