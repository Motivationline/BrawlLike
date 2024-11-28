/// <reference path="../TouchJoystick.ts" />

namespace Script {
    import ƒ = FudgeCore;
    export class InputManager {
        static Instance: InputManager;
        movementJoystick: TouchJoystick.Joystick;
        attackJoystick: TouchJoystick.Joystick;
        #joystickReadyToShoot: boolean = false;

        constructor() {
            if (InputManager.Instance) return InputManager.Instance;
            InputManager.Instance = this;

            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;

            ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.update);

            this.setupTouch();
        }

        update = () => {
            let direction: ƒ.Vector3 = ƒ.Recycler.reuse(ƒ.Vector3).set(0, 0, 0);
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT]))
                direction.x += -1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]))
                direction.x += 1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]))
                direction.z += 1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP]))
                direction.z += -1;

            direction.x += this.movementJoystick.x;
            direction.z += this.movementJoystick.y;

            if (direction.equals(EntityManager.Instance.playerBrawler.getDirection())) {
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
            if (_event.button == 0) {
                this.mainPreviewTimeout = setTimeout(() => {
                    EntityManager.Instance.playerBrawler.showPreview(ATTACK_TYPE.MAIN);
                }, 100);
            } else if (_event.button == 2) {
                this.specialPreviewTimeout = setTimeout(() => {
                    EntityManager.Instance.playerBrawler.showPreview(ATTACK_TYPE.SPECIAL);
                }, 100);
            }
        }
        mouseup = (_event: MouseEvent) => {
            _event.preventDefault();
            if (_event.button == 0) {
                clearTimeout(this.mainPreviewTimeout);
                this.tryToAttack(ATTACK_TYPE.MAIN, _event);
                EntityManager.Instance.playerBrawler.hidePreview(ATTACK_TYPE.MAIN);
            } else if (_event.button == 2) {
                clearTimeout(this.specialPreviewTimeout);
                this.tryToAttack(ATTACK_TYPE.SPECIAL, _event);
                EntityManager.Instance.playerBrawler.hidePreview(ATTACK_TYPE.SPECIAL);
            }
        }

        mousemove = (_event: MouseEvent) => {
            _event.preventDefault();
            if (!EntityManager.Instance || !EntityManager.Instance.playerBrawler) return;
            EntityManager.Instance.playerBrawler.mousePosition = new ƒ.Vector2(_event.clientX, _event.clientY);
        }

        private tryToAttack(_atk: ATTACK_TYPE, _event: MouseEvent) {
            _event.preventDefault();
            let pb = EntityManager.Instance.playerBrawler;
            if (!pb) return;
            // viewport.pointClientToProjection
            // let playerPos = viewport.pointWorldToClient(pb.node.mtxWorld.translation);
            // let clientPos = viewport.pointClientToSource(new ƒ.Vector2(_event.clientX, _event.clientY));
            let clickPos = InputManager.mousePositionToWorldPlanePosition(new ƒ.Vector2(_event.clientX, _event.clientY))
            let direction = ƒ.Vector3.DIFFERENCE(clickPos, pb.node.mtxWorld.translation);
            EntityManager.Instance.playerBrawler?.attack(_atk, direction);
        }

        private setupTouch() {
            this.movementJoystick = new TouchJoystick.Joystick(document.getElementById("touch-move"), { positioning: "floating", following: true });
            this.attackJoystick = new TouchJoystick.Joystick(document.getElementById("touch-attack"), { positioning: "floating", following: true });

            this.attackJoystick.addEventListener(TouchJoystick.EVENT.CHANGE, <EventListener>this.joystickChange);
            this.attackJoystick.addEventListener(TouchJoystick.EVENT.PRESSED, <EventListener>this.joystickPressed);
            this.attackJoystick.addEventListener(TouchJoystick.EVENT.RELEASED, <EventListener>this.joystickReleased);
        }

        private joystickChange = (_event: CustomEvent) => {
            let position = ƒ.Recycler.get(ƒ.Vector2).set(_event.detail.x, _event.detail.y);
            let playerBrawler = EntityManager.Instance.playerBrawler;
            playerBrawler.setMousePositionAsJoystickInput(position);
            playerBrawler.showPreview(ATTACK_TYPE.MAIN);
            this.#joystickReadyToShoot = true;
        }
        private joystickPressed = (_event: CustomEvent) => {
        }
        private joystickReleased = (_event: CustomEvent) => {
            EntityManager.Instance.playerBrawler.hidePreview(ATTACK_TYPE.MAIN);
            if (this.#joystickReadyToShoot) {
                let direction = ƒ.Recycler.get(ƒ.Vector3).set(_event.detail.x, 0, _event.detail.y);
                direction.scale(EntityManager.Instance.playerBrawler.getAttackRange(ATTACK_TYPE.MAIN));
                EntityManager.Instance.playerBrawler.attack(ATTACK_TYPE.MAIN, direction)
                ƒ.Recycler.store(direction);
            }
            this.#joystickReadyToShoot = false;
        }

        static mousePositionToWorldPlanePosition(_mousePosition: ƒ.Vector2): ƒ.Vector3 {
            let ray = viewport.getRayFromClient(_mousePosition);
            let clickPos = ray.intersectPlane(ƒ.Vector3.ZERO(), ƒ.Vector3.Y(1));
            return clickPos;
        }
        static joystickPositionToWorldPosition(_mousePosition: ƒ.Vector2, _atk: ATTACK_TYPE): ƒ.Vector3 {
            let mouseWorldPosition = EntityManager.Instance.playerBrawler.node.mtxLocal.translation.clone;
            let direction = ƒ.Recycler.reuse(ƒ.Vector3).set(_mousePosition.x, 0, _mousePosition.y);
            direction.scale(EntityManager.Instance.playerBrawler.getAttackRange(_atk));
            mouseWorldPosition.add(direction);
            ƒ.Recycler.store(direction);
            return mouseWorldPosition;
        }
    }
}