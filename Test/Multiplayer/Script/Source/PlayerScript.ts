/// <reference path="ServerSync.ts" />

namespace Script {
  import ƒ = FudgeCore;
  ƒ.Project.registerScriptNamespace(Script);  // Register the namespace to FUDGE for serialization

  export class PlayerScript extends ServerSync {
    // Register the script as component for use in the editor via drag&drop
    #rb: ƒ.ComponentRigidbody;
    #currentDirection: ƒ.Vector3 = new ƒ.Vector3();
    #playerDriven: boolean = false;

    constructor(_playerDriven: boolean = false) {
      super();

      this.#playerDriven = !!_playerDriven;

      // Don't start when running in editor
      if (ƒ.Project.mode == ƒ.MODE.EDITOR)
        return;

      // Listen to this component being added to or removed from a node
      this.addEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
      this.addEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
      this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.hndEvent);
      ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, this.loop);
    }

    // Activate the functions of this component as response to events
    public hndEvent = (_event: Event): void => {
      switch (_event.type) {
        case ƒ.EVENT.COMPONENT_REMOVE:
          this.removeEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
          this.removeEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
          break;
        case ƒ.EVENT.COMPONENT_ADD:
        case ƒ.EVENT.NODE_DESERIALIZED:
          // if deserialized the node is now fully reconstructed and access to all its components and children is possible
          this.#rb = this.node.getComponent(ƒ.ComponentRigidbody);
          this.#rb.effectGravity = 0;
          this.#rb.effectRotation = new ƒ.Vector3();
          break;
      }
    }

    // protected reduceMutator(_mutator: ƒ.Mutator): void {
    //   // delete properties that should not be mutated
    //   // undefined properties and private fields (#) will not be included by default
    // }

    loop = () => {
      if(this.#playerDriven){
        this.checkInput();
      }
      this.move();
    }

    checkInput() {
      let direction: ƒ.Vector3 = new ƒ.Vector3();
      if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT]))
        direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(1, 0, 0))
      if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]))
        direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(-1, 0, 0))
      if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]))
        direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(0, 0, -1))
      if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP]))
        direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(0, 0, 1))

      let mgtSqrt = direction.magnitudeSquared;
      if (mgtSqrt > 1) {
        direction.normalize(1);
      }
      if (!this.#currentDirection.equals(direction)){
        this.#currentDirection.copy(direction);
        this.syncSelf();
      }
    }

    move() {
      this.#rb.setVelocity(this.#currentDirection);
    }

    getInfo() {
      let info = super.getInfo();
      info.dir = this.#currentDirection;
      return info;
    }

    putInfo(_data: any): void {
      super.putInfo(_data);
      this.#currentDirection = _data.dir;
    }

    creationData(): CreationData {
      return {
        id: this.id,
        initData: this.getInfo(),
        resourceName: "Player",
      }
    }
  }
}