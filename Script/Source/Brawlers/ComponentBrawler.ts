///<reference path="../Damagable.ts"/>
namespace Script {
  import ƒ = FudgeCore;
  ƒ.Project.registerScriptNamespace(Script);  // Register the namespace to FUDGE for serialization
  type AnimationType = "idle"| "walk" | "attack" | "special";

  export class ComponentBrawler extends Damagable {
    // Register the script as component for use in the editor via drag&drop
    public static readonly iSubclass: number = ƒ.Component.registerSubclass(ComponentBrawler);
    // Properties may be mutated by users in the editor via the automatically created user interface
    public speed: number = 1;
    protected direction: ƒ.Vector3 = new ƒ.Vector3();
    protected rotationWrapperMatrix: ƒ.Matrix4x4;
    protected attackMain: ComponentMainAttack;
    protected attackSpecial: ComponentSpecialAttack;
    #animator: ƒ.ComponentAnimator;
    #animations: Map<string, ƒ.Animation> = new Map();
    #currentlyActiveAnimation: { name: string, lock: boolean } = { name: "idle", lock: false };
    public mousePosition: ƒ.Vector3 = ƒ.Vector3.ZERO();
    public animationIdleName: string;
    public animationWalkName: string;
    public animationAttackName: string;
    public animationSpecialName: string;

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
          this.findAttacks();
          this.node.addEventListener(ƒ.EVENT.CHILD_APPEND, this.resourcesLoaded);
          break;
      }
    }

    resourcesLoaded = () => {
      this.node.removeEventListener(ƒ.EVENT.CHILD_APPEND, this.resourcesLoaded);
      this.#animator = this.node.getChild(0).getChild(0).getComponent(ƒ.ComponentAnimator);
    }

    private playAnimation(_name: AnimationType, _lockAndSwitchToIdleAfter: boolean = false) {
      if (_name === this.#currentlyActiveAnimation.name) return;
      if (this.#currentlyActiveAnimation.lock) return;
      if (!this.#animations.has(_name)) {
        let animationName: string = this.animationIdleName;
        if (_name == "walk") animationName = this.animationWalkName;
        if (_name == "attack") animationName = this.animationAttackName;
        if (_name == "special") animationName = this.animationSpecialName;
        if (!animationName) return;
        let animation = <ƒ.Animation>ƒ.Project.getResourcesByName(animationName)[0];
        if (!animation) return;
        this.#animations.set(_name, animation);
      }
      this.#animator.animation = this.#animations.get(_name);
      this.#currentlyActiveAnimation.name = _name;
      this.#currentlyActiveAnimation.lock = _lockAndSwitchToIdleAfter;
      if (_lockAndSwitchToIdleAfter) {
        setTimeout(() => {
          this.#currentlyActiveAnimation.lock = false;
          this.playAnimation("idle");
        }, this.#animations.get(_name).totalTime);
      }
    }

    private findAttacks() {
      let components = this.node.getAllComponents();
      this.attackMain = <ComponentMainAttack>components.find(c => c instanceof ComponentMainAttack);
      this.attackSpecial = <ComponentSpecialAttack>components.find(c => c instanceof ComponentSpecialAttack);
      if (!this.attackMain || !this.attackSpecial) console.error(`${this.node.name} doesn't have attacks attached.`);
    }

    public setMovement(_direction: ƒ.Vector3) {
      this.direction = _direction;
    }

    public update() {
      if (!this.rigidbody) return;
      if (!this.rigidbody.isActive) this.rigidbody.activate(true);
      this.move();

      if (EntityManager.Instance.playerBrawler === this) {
        this.attackSpecial?.updatePreview(this.node.mtxLocal.translation, this.mousePosition);
        this.attackMain?.updatePreview(this.node.mtxLocal.translation, this.mousePosition);
        this.attackMain?.update();
      }
    }

    protected move() {
      this.rigidbody.setVelocity(ƒ.Vector3.SCALE(this.direction, this.speed));
      if (this.direction.magnitudeSquared > 0) {
        this.rotationWrapperMatrix.lookIn(this.direction);
        this.playAnimation("walk");
      } else {
        this.playAnimation("idle");
      }
    }

    attack(_atk: ATTACK_TYPE, _direction: ƒ.Vector3) {
      switch (_atk) {
        case ATTACK_TYPE.MAIN:
          this.attackMain.attack(_direction);
          this.playAnimation("attack", true);
          break;
        case ATTACK_TYPE.SPECIAL:
          this.attackSpecial.attack(_direction);
          this.playAnimation("special", true);
          break;
      }
    }

    public showPreview(_atk: ATTACK_TYPE) {
      switch (_atk) {
        case ATTACK_TYPE.MAIN:
          this.attackMain.showPreview();
          break;
        case ATTACK_TYPE.SPECIAL:
          this.attackSpecial.showPreview();
          break;
      }
    }

    public hidePreview(_atk: ATTACK_TYPE) {
      switch (_atk) {
        case ATTACK_TYPE.MAIN:
          this.attackMain.hidePreview();
          break;
        case ATTACK_TYPE.SPECIAL:
          this.attackSpecial.hidePreview();
          break;
      }
    }


    protected death(): void {
      console.log("I died.", this);
    }

    protected reduceMutator(_mutator: ƒ.Mutator): void {
      super.reduceMutator(_mutator);
      delete _mutator.direction;
      delete _mutator.rotationWrapperMatrix;
      delete _mutator.attackMain;
      delete _mutator.attackSpecial;
      delete _mutator.mousePosition;
    }

    public serialize(): ƒ.Serialization {
      let serialization: ƒ.Serialization = {
        [super.constructor.name]: super.serialize(),
        speed: this.speed,
        animationIdleName: this.animationIdleName,
        animationWalkName: this.animationWalkName,
        animationAttackName: this.animationAttackName,
        animationSpecialName: this.animationSpecialName,
      };

      return serialization;
    }

    public async deserialize(_serialization: ƒ.Serialization): Promise<ƒ.Serializable> {
      if (_serialization[super.constructor.name] != null)
        await super.deserialize(_serialization[super.constructor.name]);
      if (_serialization.speed != null)
        this.speed = _serialization.speed;
      this.animationIdleName = _serialization.animationIdleName;
      this.animationWalkName = _serialization.animationWalkName;
      this.animationAttackName = _serialization.animationAttackName;
      this.animationSpecialName = _serialization.animationSpecialName;
      return this;
    }
  }

  export enum ATTACK_TYPE {
    MAIN,
    SPECIAL
  }
}