///<reference path="../Damagable.ts"/>
namespace Script {
  import ƒ = FudgeCore;
  ƒ.Project.registerScriptNamespace(Script);  // Register the namespace to FUDGE for serialization

  export class ComponentBrawler extends Damagable {
    // Register the script as component for use in the editor via drag&drop
    public static readonly iSubclass: number = ƒ.Component.registerSubclass(ComponentBrawler);
    // Properties may be mutated by users in the editor via the automatically created user interface
    public speed: number = 1;
    protected direction: ƒ.Vector3 = new ƒ.Vector3();
    protected rotationWrapperMatrix: ƒ.Matrix4x4;

    constructor() {
      super();

      if (ƒ.Project.mode == ƒ.MODE.EDITOR)
        return;

      // Listen to this component being added to or removed from a node
      this.addEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
      this.addEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
      this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.hndEvent);
    }

    // Activate the functions of this component as response to events
    public hndEvent = (_event: Event): void => {
      switch (_event.type) {
        case ƒ.EVENT.COMPONENT_ADD:
          break;
        case ƒ.EVENT.COMPONENT_REMOVE:
          this.removeEventListener(ƒ.EVENT.COMPONENT_ADD, this.hndEvent);
          this.removeEventListener(ƒ.EVENT.COMPONENT_REMOVE, this.hndEvent);
          break;
        case ƒ.EVENT.NODE_DESERIALIZED:
          // if deserialized the node is now fully reconstructed and access to all its components and children is possible
          this.rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
          this.rigidbody.effectRotation = new ƒ.Vector3();
          this.rotationWrapperMatrix = this.node.getChild(0).mtxLocal;
          break;
      }
    }

    public setMovement(_direction: ƒ.Vector3) {
      this.direction = _direction;
    }

    public update() {
      if (!this.rigidbody) return;
      if (!this.rigidbody.isActive) this.rigidbody.activate(true);
      this.move();
    }

    protected move() {
      this.rigidbody.setVelocity(ƒ.Vector3.SCALE(this.direction, this.speed));
      if (this.direction.magnitudeSquared > 0)
        this.rotationWrapperMatrix.lookIn(this.direction);
    }


    protected death(): void {
      console.log("I died.", this);
    }

    protected reduceMutator(_mutator: ƒ.Mutator): void {
      super.reduceMutator(_mutator);
      delete _mutator.direction;
      delete _mutator.rotationWrapperMatrix;
    }

    public serialize(): ƒ.Serialization {
      let serialization: ƒ.Serialization = {
        [super.constructor.name]: super.serialize(),
        speed: this.speed
      };

      return serialization;
    }

    public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
      if (_serialization[super.constructor.name] != null)
        await super.deserialize(_serialization[super.constructor.name]);
      if (_serialization.speed != null)
        this.speed = _serialization.speed;

      return this;
    }
  }
}