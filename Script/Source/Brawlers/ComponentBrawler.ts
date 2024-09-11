///<reference path="../Damagable.ts"/>
namespace Script {
  import ƒ = FudgeCore;
  ƒ.Project.registerScriptNamespace(Script);  // Register the namespace to FUDGE for serialization
  type AnimationType = "idle" | "walk" | "attack" | "special";
  interface VelocityOverride {
    velocity: ƒ.Vector3,
    until: number,
  }

  export class ComponentBrawler extends Damagable {
    // Register the script as component for use in the editor via drag&drop
    public static readonly iSubclass: number = ƒ.Component.registerSubclass(ComponentBrawler);
    // Properties may be mutated by users in the editor via the automatically created user interface
    public speed: number = 1;
    protected direction: ƒ.Vector3 = new ƒ.Vector3();
    protected rotationWrapperMatrix: ƒ.Matrix4x4;
    protected attackMain: ComponentAttack;
    protected attackSpecial: ComponentAttack;
    #animator: ƒ.ComponentAnimator;
    #animations: Map<string, ƒ.Animation> = new Map();
    #currentlyActiveAnimation: { name: string, lock: boolean } = { name: "idle", lock: false };
    public mousePosition: ƒ.Vector3 = ƒ.Vector3.ZERO();
    public animationIdleName: string = "";
    public animationWalkName: string = "";
    public animationAttackName: string = "";
    public animationSpecialName: string = "";
    #invulnerable: boolean = false
    #velocityOverrides: VelocityOverride[] = [];
    #playerMovementLockedUntil: number = -1;

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

    #animationTimeout: number = -1;
    private playAnimation(_name: AnimationType, _options?: { lockAndSwitchToIdleAfter: boolean, playFromStart: boolean, lockMovement: boolean, lockTime: number }) {
      _options = { ...{ lockAndSwitchToIdleAfter: false, playFromStart: false, lockMovement: false, lockTime: 0 }, ..._options };

      if (_name === this.#currentlyActiveAnimation.name && !_options.lockAndSwitchToIdleAfter) return;
      if (this.#currentlyActiveAnimation.lock && !_options.lockAndSwitchToIdleAfter) return;

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
      if (_options.playFromStart) {
        this.#animator.jumpTo(0);
      }
      this.#currentlyActiveAnimation.name = _name;
      this.#currentlyActiveAnimation.lock = _options.lockAndSwitchToIdleAfter;
      if (_options.lockAndSwitchToIdleAfter) {
        clearTimeout(this.#animationTimeout);
        this.#animationTimeout = setTimeout(() => {
          this.#currentlyActiveAnimation.lock = false;
          this.playAnimation("idle");
        }, this.#animations.get(_name).totalTime);
      }
      let newLockTime: number = _options.lockTime * 1000
      if (_options.lockMovement) newLockTime = this.#animations.get(_name).totalTime
      if (newLockTime > 0) this.lockPlayerFor(newLockTime);
    }

    private findAttacks() {
      let components = this.node.getAllComponents();
      this.attackMain = <ComponentAttack>components.find(c => c instanceof ComponentAttack && c.attackType === AttackType.MAIN);
      this.attackSpecial = <ComponentAttack>components.find(c => c instanceof ComponentAttack && c.attackType === AttackType.SPECIAL);
      if (!this.attackMain || !this.attackSpecial) console.error(`${this.node.name} doesn't have a main and a special attack attached.`);
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
        this.attackSpecial?.update();
        this.attackMain?.updatePreview(this.node.mtxLocal.translation, this.mousePosition);
        this.attackMain?.update();
      }

      if (this.#invulnerable) {
        if (this.#invulUntil < ƒ.Time.game.get()) {
          this.#invulnerable = false;
        }
      }
    }

    protected move() {
      let now = ƒ.Time.game.get();
      let combinedVelocity: ƒ.Vector3 = new ƒ.Vector3();
      for (let i: number = 0; i < this.#velocityOverrides.length; i++) {
        let vo = this.#velocityOverrides[i];
        if (vo.until < now) {
          this.#velocityOverrides.splice(i, 1);
          i--;
          continue;
        }
        combinedVelocity.add(vo.velocity);
      }

      if (this.#playerMovementLockedUntil < now) {
        combinedVelocity.add(ƒ.Vector3.SCALE(this.direction, this.speed));
      }
      this.rigidbody.setVelocity(combinedVelocity);
      if (this.direction.magnitudeSquared > 0) {
        if (!this.#currentlyActiveAnimation.lock)
          this.rotationWrapperMatrix.lookIn(this.direction);
        this.playAnimation("walk");
      } else {
        this.playAnimation("idle");
      }
    }

    dealDamage(_amt: number) {
      if (!this.#invulnerable) {
        super.dealDamage(_amt);
        this.attackMain?.charge(_amt, ChargeType.DAMAGE_RECEIVED);
        this.attackSpecial?.charge(_amt, ChargeType.DAMAGE_RECEIVED);
      }
    }

    attack(_atk: ATTACK_TYPE, _direction: ƒ.Vector3) {
      if (this.#currentlyActiveAnimation.lock) return;
      switch (_atk) {
        case ATTACK_TYPE.MAIN:
          if (this.attackMain.attack(_direction)) {
            this.playAnimation("attack", { lockAndSwitchToIdleAfter: true, playFromStart: true, lockMovement: this.attackMain.lockBrawlerForAnimationTime, lockTime: this.attackMain.lockTime });
          }
          break;
        case ATTACK_TYPE.SPECIAL:
          if (this.attackSpecial.attack(_direction)) {
            this.playAnimation("special", { lockAndSwitchToIdleAfter: true, playFromStart: true, lockMovement: this.attackSpecial.lockBrawlerForAnimationTime, lockTime: this.attackSpecial.lockTime });
          }
          break;
      }
      this.rotationWrapperMatrix.lookIn(_direction);
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

    public addVelocity(_velocity: ƒ.Vector3, _duration: number) {
      _duration *= 1000;
      this.#velocityOverrides.push({
        velocity: _velocity,
        until: ƒ.Time.game.get() + _duration,
      });
    }

    public lockPlayerFor(_time: number) {
      this.#playerMovementLockedUntil = Math.max(ƒ.Time.game.get() + _time, this.#playerMovementLockedUntil);
    }

    #invulUntil: number;
    public makeInvulnerableFor(_timeInMS: number) {
      this.#invulnerable = true;
      this.#invulUntil = Math.max(this.#invulUntil, ƒ.Time.game.get() + _timeInMS);
    }

    public dealDamageToOthers(_amt: number) {
      this.attackMain?.charge(_amt, ChargeType.DAMAGE_DEALT);
      this.attackSpecial?.charge(_amt, ChargeType.DAMAGE_DEALT);
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