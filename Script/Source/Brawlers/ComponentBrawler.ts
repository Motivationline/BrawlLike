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
    public mousePosition: ƒ.Vector2 = ƒ.Vector2.ZERO();
    public animationIdleName: string = "";
    public animationWalkName: string = "";
    public animationAttackName: string = "";
    public animationSpecialName: string = "";
    #invulnerable: boolean = false
    #velocityOverrides: VelocityOverride[] = [];
    #playerMovementLockedUntil: number = -1;
    #dead: boolean = false;
    #isJoystick: boolean = false;

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
          this.rigidbody.addEventListener(ƒ.EVENT_PHYSICS.TRIGGER_ENTER, this.onTrigger);
          this.rigidbody.addEventListener(ƒ.EVENT_PHYSICS.TRIGGER_EXIT, this.onTrigger);
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
    private playAnimation(_name: AnimationType, _options?: { lockAndSwitchToIdleAfter: boolean, playFromStart: boolean, lockMovement: boolean, lockTime: number, direction?: ƒ.Vector3 }) {
      _options = { ...{ lockAndSwitchToIdleAfter: false, playFromStart: false, lockMovement: false, lockTime: 0 }, ..._options };

      if (_name === this.#currentlyActiveAnimation.name && !_options.lockAndSwitchToIdleAfter) return;
      if (this.#currentlyActiveAnimation.lock && !_options.lockAndSwitchToIdleAfter) return;

      MultiplayerManager.updateOne({ type: "animation", name: _name, options: _options }, this.id);

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
      this.direction.copy(_direction);
      this.syncSelf();
    }

    public getDirection(): ƒ.Vector3 {
      return this.direction;
    }

    public update() {
      if (this.#dead) return;
      if (!this.rigidbody) return;
      if (!this.rigidbody.isActive) this.rigidbody.activate(true);
      this.move();

      if (EntityManager.Instance.playerBrawler === this) {
        let mouseWorldPosition: ƒ.Vector3;
        if (this.#isJoystick) {
          mouseWorldPosition = InputManager.joystickPositionToWorldPosition(this.mousePosition, ATTACK_TYPE.MAIN);
        } else {
          mouseWorldPosition = InputManager.mousePositionToWorldPlanePosition(this.mousePosition);
        }
        this.attackSpecial?.updatePreview(this.node.mtxLocal.translation, mouseWorldPosition);
        this.attackSpecial?.update();
        this.attackMain?.updatePreview(this.node.mtxLocal.translation, mouseWorldPosition);
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
      let combinedVelocity: ƒ.Vector3 = ƒ.Recycler.get(ƒ.Vector3);
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
      ƒ.Recycler.store(combinedVelocity);
    }

    dealDamage(_amt: number, _broadcast: boolean) {
      if (!this.#invulnerable) {
        super.dealDamage(_amt, _broadcast);
        this.attackMain?.charge(_amt, ChargeType.DAMAGE_RECEIVED);
        this.attackSpecial?.charge(_amt, ChargeType.DAMAGE_RECEIVED);
      }
    }

    initAttacks() {
      this.attackMain?.initAttack();
      this.attackSpecial?.initAttack();
    }

    attack(_atk: ATTACK_TYPE, _direction: ƒ.Vector3) {
      console.log(_direction);
      if (this.#currentlyActiveAnimation.lock) return;
      switch (_atk) {
        case ATTACK_TYPE.MAIN:
          if (this.attackMain.attack(_direction)) {
            let options = { lockAndSwitchToIdleAfter: true, playFromStart: true, lockMovement: this.attackMain.lockBrawlerForAnimationTime, lockTime: this.attackMain.lockTime };
            this.playAnimation("attack", options);
            MultiplayerManager.updateOne({ type: "animation", name: "attack", options, direction: JSON.parse(JSON.stringify(_direction)) }, this.id);
          }
          break;
        case ATTACK_TYPE.SPECIAL:
          if (this.attackSpecial.attack(_direction)) {
            let options = { lockAndSwitchToIdleAfter: true, playFromStart: true, lockMovement: this.attackSpecial.lockBrawlerForAnimationTime, lockTime: this.attackSpecial.lockTime };
            this.playAnimation("special", options);
            MultiplayerManager.updateOne({ type: "animation", name: "special", options, direction: JSON.parse(JSON.stringify(_direction)) }, this.id);
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
      this.syncSelf();
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
      if (this.#dead) return;
      this.#dead = true;
      GameManager.Instance.playerDied(this);
      this.node.activate(false);
      // document.getElementById(MultiplayerManager.getOwnerIdFromId(this.id))?.classList.add("dead");
    }

    public respawn(_position: ƒ.Vector3) {
      this.node.mtxLocal.translate(ƒ.Vector3.DIFFERENCE(_position, this.node.mtxWorld.translation));
      this.node.activate(true);
      this.health = Infinity;
      this.#dead = false;
      // document.getElementById(MultiplayerManager.getOwnerIdFromId(this.id))?.classList.remove("dead");
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

    public getAttackRange(_atk: ATTACK_TYPE) {
      if (_atk === ATTACK_TYPE.MAIN) return this.attackMain.range;
      if (_atk === ATTACK_TYPE.SPECIAL) return this.attackSpecial.range;
      return 0;
    }

    public setMousePositionAsJoystickInput(_pos: ƒ.Vector2) {
      ƒ.Recycler.store(this.mousePosition);
      this.mousePosition = _pos;
      this.#isJoystick = true;
    }


    creationData(): CreationData {
      return {
        id: this.id,
        initData: this.getInfo(),
        resourceName: this.node.name,
      }
    }

    getInfo(): any {
      let info = super.getInfo();
      info.resourceName = this.node.name,
        info.direction = {
          x: this.direction.x,
          y: this.direction.y,
          z: this.direction.z,
        }
      info.velOverride = [];
      this.#velocityOverrides.forEach(value => {
        info.velOverride.push({ until: value.until, velocity: { x: value.velocity.x, y: value.velocity.y, z: value.velocity.z } })
      });
      info.active = this.node.isActive;
      info.dead = this.#dead;
      return info;
    }

    applyData(data: any): void {
      super.applyData(data);
      if (data.type) {
        switch (data.type) {
          case "animation": {
            this.playAnimation(data.name, data.options);
            if (data.direction)
              this.rotationWrapperMatrix.lookIn(new ƒ.Vector3(data.direction.x, data.direction.y, data.direction.z));
            break;
          }
        }
        return;
      }

      this.direction.x = data.direction.x;
      this.direction.y = data.direction.y;
      this.direction.z = data.direction.z;
      this.#dead = data.dead;
      this.#velocityOverrides = [];
      data.velOverride.forEach((value: any) => {
        this.#velocityOverrides.push(
          {
            until: value.until,
            velocity: new ƒ.Vector3(value.velocity.x, value.velocity.y, value.velocity.z),
          })
      });

      if (this.node.isActive !== data.active) {
        this.node.activate(data.active);
      }
    }

    #touchingGrass: number = 0;
    onTrigger = (_event: ƒ.EventPhysics) => {
      let teamOfOwner = GameManager.Instance.getPlayer(MultiplayerManager.getOwnerIdFromId(EntityManager.Instance.playerBrawler.id)).team;
      if (!this.id) return;
      let teamOfThis = GameManager.Instance.getPlayer(MultiplayerManager.getOwnerIdFromId(this.id)).team;
      if (teamOfOwner === teamOfThis) return;

      if (_event.cmpRigidbody.node.name === "GrassPatch") {
        if (_event.type === ƒ.EVENT_PHYSICS.TRIGGER_ENTER) { this.#touchingGrass++; }
        if (_event.type === ƒ.EVENT_PHYSICS.TRIGGER_EXIT) { this.#touchingGrass--; }
      }

      // if (!this.#visualWrapper) return;
      // let brawlerShouldBeHidden: boolean = false;
      // for (let trigger of this.rigidbody.triggerings) {
      //   if (trigger.node.name === "GrassPatch") {
      //     brawlerShouldBeHidden = true;
      //     break;
      //   }
      // }

      // if(this.#touchingGrass > 0 && !brawlerShouldBeHidden) {
      //   console.log("bad value!");
      //   return;
      // }
      if (this.#touchingGrass > 0) {
        for (let child of this.node.getChildren()) {
          child.activate(false);
        }
      } else {
        for (let child of this.node.getChildren()) {
          child.activate(true);
        }
      }
    }
  }

  export enum ATTACK_TYPE {
    MAIN,
    SPECIAL
  }
}