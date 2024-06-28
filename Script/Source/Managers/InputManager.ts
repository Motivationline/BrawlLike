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
            let direction: ƒ.Vector3 = new ƒ.Vector3();
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(-1, 0, 0))
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(1, 0, 0))
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(0, 0, 1))
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(0, 0, -1))

            let mgtSqrt = direction.magnitudeSquared;
            if (mgtSqrt === 0) {
                EntityManager.Instance.playerBrawler?.setMovement(direction);
                return;
            }
            if (mgtSqrt > 1) {
                direction.normalize(1);
            }

            EntityManager.Instance.playerBrawler?.setMovement(direction);
        }

        leftclick = (_event: MouseEvent) => {
            _event.preventDefault();
            console.log("leftclick", _event)
        }
        rightclick = (_event: MouseEvent) => {
            _event.preventDefault();
            console.log("rightclick", _event)
        }
    }
}