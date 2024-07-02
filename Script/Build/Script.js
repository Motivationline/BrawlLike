"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class Damagable extends ƒ.Component {
        #health = 500;
        rigidbody;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.initDamagable);
        }
        initDamagable = () => {
            this.node.removeEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.initDamagable);
            this.rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
        };
        get health() {
            return this.#health;
        }
        set health(_amt) {
            this.#health = _amt;
            if (this.#health < 0)
                this.death();
        }
        reduceMutator(_mutator) {
            super.reduceMutator(_mutator);
            delete _mutator.rigidbody;
        }
        getMutator(_extendable) {
            let mutator = super.getMutator(true);
            mutator.health = this.health;
            return mutator;
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                health: this.health,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.health != null)
                this.health = _serialization.health;
            return this;
        }
    }
    Script.Damagable = Damagable;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class MenuManager {
        constructor() {
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Project.addEventListener("resourcesLoaded" /* ƒ.EVENT.RESOURCES_LOADED */, this.resourcesLoaded);
            document.addEventListener("DOMContentLoaded", () => {
                document.getElementById("start").addEventListener("click", Script.startViewport);
                document.getElementById("selection-overlay").querySelectorAll("button").forEach((button) => {
                    button.addEventListener("click", async () => {
                        await Script.EntityManager.Instance.loadBrawler(button.dataset.brawler);
                        ƒ.Loop.start();
                        document.getElementById("selection-overlay").style.display = "none";
                    });
                });
            });
        }
        resourcesLoaded = () => {
            console.log("resources loaded");
            document.getElementById("start-overlay").style.display = "none";
        };
    }
    Script.MenuManager = MenuManager;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class InputManager {
        static Instance;
        constructor() {
            if (InputManager.Instance)
                return InputManager.Instance;
            InputManager.Instance = this;
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.update);
        }
        update = () => {
            let direction = new ƒ.Vector3();
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(-1, 0, 0));
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(1, 0, 0));
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(0, 0, 1));
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP]))
                direction.add(ƒ.Recycler.borrow(ƒ.Vector3).set(0, 0, -1));
            let mgtSqrt = direction.magnitudeSquared;
            if (mgtSqrt === 0) {
                Script.EntityManager.Instance.playerBrawler?.setMovement(direction);
                return;
            }
            if (mgtSqrt > 1) {
                direction.normalize(1);
            }
            Script.EntityManager.Instance.playerBrawler?.setMovement(direction);
        };
        leftclick = (_event) => {
            this.tryToAttack(Script.ATTACK_TYPE.MAIN, _event);
        };
        rightclick = (_event) => {
            this.tryToAttack(Script.ATTACK_TYPE.SPECIAL, _event);
        };
        tryToAttack(_atk, _event) {
            _event.preventDefault();
            let pb = Script.EntityManager.Instance.playerBrawler;
            if (!pb)
                return;
            let playerPos = Script.viewport.pointWorldToClient(pb.node.mtxWorld.translation);
            let clientPos = Script.viewport.pointClientToSource(new ƒ.Vector2(_event.clientX, _event.clientY));
            let direction = ƒ.Vector2.DIFFERENCE(clientPos, playerPos).normalize();
            Script.EntityManager.Instance.playerBrawler?.attack(_atk, direction);
        }
    }
    Script.InputManager = InputManager;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class EntityManager extends ƒ.Component {
        static Instance;
        brawlers = [];
        playerBrawler;
        projectiles = [];
        constructor() {
            if (EntityManager.Instance)
                return EntityManager.Instance;
            super();
            EntityManager.Instance = this;
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.update);
        }
        loadBrawler = async (_playerBrawler = "Brawler") => {
            console.log("load Brawler");
            let defaultBrawler = ƒ.Project.getResourcesByName("Brawler")[0];
            let playerBrawler = ƒ.Project.getResourcesByName(_playerBrawler)[0];
            let spawnPoints = this.node.getParent().getChildrenByName("Spawnpoints")[0].getChildren();
            for (let i = 0; i < spawnPoints.length - 1; i++) {
                this.initBrawler(defaultBrawler, spawnPoints[i].mtxLocal.translation.clone);
            }
            this.playerBrawler = await this.initBrawler(playerBrawler, spawnPoints[spawnPoints.length - 1].mtxLocal.translation.clone);
            let cameraGraph = ƒ.Project.getResourcesByName("CameraBrawler")[0];
            let cameraInstance = await ƒ.Project.createGraphInstance(cameraGraph);
            this.playerBrawler.node.addChild(cameraInstance);
            let camera = cameraInstance.getComponent(ƒ.ComponentCamera);
            Script.viewport.camera = camera;
        };
        async initBrawler(_g, _pos) {
            let instance = await ƒ.Project.createGraphInstance(_g);
            this.node.addChild(instance);
            instance.mtxLocal.translation = _pos;
            let cb = instance.getAllComponents().find(c => c instanceof Script.ComponentBrawler);
            this.brawlers.push(cb);
            return cb;
        }
        addProjectile(_instance, _component, _parent) {
            if (!_parent) {
                _parent = this.node;
            }
            this.projectiles.push(_component);
            _parent.addChild(_instance);
        }
        update = () => {
            for (let b of this.brawlers) {
                b.update();
            }
        };
    }
    Script.EntityManager = EntityManager;
})(Script || (Script = {}));
///<reference path="Managers/MenuManager.ts" />
///<reference path="Managers/InputManager.ts" />
///<reference path="Managers/EntityManager.ts" />
var Script;
///<reference path="Managers/MenuManager.ts" />
///<reference path="Managers/InputManager.ts" />
///<reference path="Managers/EntityManager.ts" />
(function (Script) {
    var ƒ = FudgeCore;
    document.addEventListener("interactiveViewportStarted", start);
    Script.menuManager = new Script.MenuManager();
    Script.inputManager = new Script.InputManager();
    document.addEventListener("DOMContentLoaded", preStart);
    function preStart() {
    }
    function start(_event) {
        Script.viewport = _event.detail;
        Script.viewport.physicsDebugMode = ƒ.PHYSICS_DEBUGMODE.COLLIDERS;
        ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, update);
        // ƒ.Loop.start();  // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
    }
    function update(_event) {
        ƒ.Physics.simulate(); // if physics is included and used
        Script.viewport.draw();
        ƒ.AudioManager.default.update();
    }
    async function startViewport() {
        document.getElementById("start").removeEventListener("click", startViewport);
        let graphId = document.head.querySelector("meta[autoView]").getAttribute("autoView");
        await ƒ.Project.loadResourcesFromHTML();
        let graph = ƒ.Project.resources[graphId];
        let canvas = document.querySelector("canvas");
        let viewport = new ƒ.Viewport();
        let camera = findFirstCameraInGraph(graph);
        viewport.initialize("GameViewport", graph, camera, canvas);
        canvas.dispatchEvent(new CustomEvent("interactiveViewportStarted", { bubbles: true, detail: viewport }));
        canvas.addEventListener("click", Script.InputManager.Instance.leftclick);
        canvas.addEventListener("contextmenu", Script.InputManager.Instance.rightclick);
    }
    Script.startViewport = startViewport;
    function findFirstCameraInGraph(_graph) {
        let cam = _graph.getComponent(ƒ.ComponentCamera);
        if (cam)
            return cam;
        for (let child of _graph.getChildren()) {
            cam = findFirstCameraInGraph(child);
            if (cam)
                return cam;
        }
        return undefined;
    }
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentMainAttack extends ƒ.Component {
        reloadTime = 1;
        minDelayBetweenAttacks = 0.3;
        damage = 100;
        castTime = 0.05;
        maxCharges = 3;
        charges = 3;
        attack(_direction) {
            if (this.charges == 0)
                return false;
            return true;
        }
        reduceMutator(_mutator) {
            delete _mutator.charges;
        }
    }
    Script.ComponentMainAttack = ComponentMainAttack;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentProjectile extends ƒ.Component {
        gravity = false;
        rotateInDirection = true;
        damage = 100;
        speed = 10;
        range = 3;
        #rb;
        #owner;
        #startPosition;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.init);
            ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.loop);
        }
        init = () => {
            this.#rb = this.node.getComponent(ƒ.ComponentRigidbody);
            this.#rb.effectGravity = Number(this.gravity);
            this.#rb.addEventListener("TriggerEnteredCollision" /* ƒ.EVENT_PHYSICS.TRIGGER_ENTER */, this.onTriggerEnter);
        };
        fire(_direction, _owner) {
            this.#owner = _owner;
            if (this.rotateInDirection) {
                this.node.mtxLocal.lookIn(new ƒ.Vector3(_direction.x, 0, _direction.y));
            }
            else {
                this.#rb.setVelocity(new ƒ.Vector3(_direction.x, 0, _direction.y).scale(this.speed));
            }
        }
        onTriggerEnter = (_event) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody)
                return;
            //TODO do team check
            let damagable = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Damagable);
            this.explode();
            if (!damagable)
                return;
            damagable.health -= this.damage;
        };
        explode() {
            this.node.getParent().removeChild(this.node);
        }
        moveToPosition(_pos) {
            let rb = this.node.getComponent(ƒ.ComponentRigidbody);
            rb.activate(false);
            this.#startPosition = _pos;
            this.node.mtxLocal.translation = _pos;
            rb.activate(true);
        }
        loop = () => {
            if (!this.#startPosition)
                return;
            let distance = ƒ.Vector3.DIFFERENCE(this.node.mtxWorld.translation, this.#startPosition).magnitudeSquared;
            if (distance > this.range * this.range) {
                this.node.getParent().removeChild(this.node);
            }
        };
    }
    Script.ComponentProjectile = ComponentProjectile;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentProjectileMainAttack extends Script.ComponentMainAttack {
        speed = 2;
        range = 10;
        rotateInDirection = false;
        attachedToBrawler = false;
        attack(_direction) {
            if (!super.attack(_direction))
                return false;
            this.shootProjectile(_direction);
        }
        async shootProjectile(_direction) {
            let projectile = ƒ.Project.getResourcesByName("DefaultProjectile")[0];
            let instance = await ƒ.Project.createGraphInstance(projectile);
            let projectileComponent = instance.getAllComponents().find(c => c instanceof Script.ComponentProjectile);
            projectileComponent.damage = this.damage;
            projectileComponent.speed = this.speed;
            projectileComponent.range = this.range;
            projectileComponent.rotateInDirection = this.rotateInDirection;
            let parent = this.attachedToBrawler ? this.node : undefined;
            Script.EntityManager.Instance.addProjectile(instance, projectileComponent, parent);
            projectileComponent.moveToPosition(this.node.mtxWorld.translation.clone.add(ƒ.Vector3.Y(0.5)));
            projectileComponent.fire(_direction, this.node.getAllComponents().find(c => c instanceof Script.ComponentBrawler));
        }
    }
    Script.ComponentProjectileMainAttack = ComponentProjectileMainAttack;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentSpecialAttack extends ƒ.Component {
        damage = 100;
        castTime = 0.05;
        requiredCharge = 500;
        currentCharge = 0;
        charge(_amt) {
            this.currentCharge = Math.min(this.currentCharge + _amt, this.requiredCharge);
        }
        attack(_direction) {
            if (this.currentCharge < this.requiredCharge)
                return false;
            return true;
        }
        reduceMutator(_mutator) {
            delete _mutator.currentCharge;
        }
    }
    Script.ComponentSpecialAttack = ComponentSpecialAttack;
})(Script || (Script = {}));
///<reference path="../ComponentProjectileMainAttack.ts" />
var Script;
///<reference path="../ComponentProjectileMainAttack.ts" />
(function (Script) {
    class CowboyMainAttack extends Script.ComponentProjectileMainAttack {
        attack(_direction) {
            if (!super.attack(_direction))
                return false;
            return true;
        }
    }
    Script.CowboyMainAttack = CowboyMainAttack;
})(Script || (Script = {}));
var Script;
(function (Script) {
    class CowboySpecialAttack extends Script.ComponentSpecialAttack {
        attack(_direction) {
            if (!super.attack(_direction))
                return false;
            return true;
        }
    }
    Script.CowboySpecialAttack = CowboySpecialAttack;
})(Script || (Script = {}));
///<reference path="../Damagable.ts"/>
var Script;
///<reference path="../Damagable.ts"/>
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class ComponentBrawler extends Script.Damagable {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = ƒ.Component.registerSubclass(ComponentBrawler);
        // Properties may be mutated by users in the editor via the automatically created user interface
        speed = 1;
        direction = new ƒ.Vector3();
        rotationWrapperMatrix;
        attackMain;
        attackSpecial;
        #timer;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
        // Activate the functions of this component as response to events
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* ƒ.EVENT.COMPONENT_ADD */:
                    break;
                case "componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    this.rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
                    this.rigidbody.effectRotation = new ƒ.Vector3();
                    this.rotationWrapperMatrix = this.node.getChild(0).mtxLocal;
                    this.findAttacks();
                    break;
            }
        };
        findAttacks() {
            let components = this.node.getAllComponents();
            this.attackMain = components.find(c => c instanceof Script.ComponentMainAttack);
            this.attackSpecial = components.find(c => c instanceof Script.ComponentSpecialAttack);
            if (!this.attackMain || !this.attackSpecial)
                console.error(`${this.node.name} doesn't have attacks attached.`);
        }
        setMovement(_direction) {
            this.direction = _direction;
        }
        update() {
            if (!this.rigidbody)
                return;
            if (!this.rigidbody.isActive)
                this.rigidbody.activate(true);
            this.move();
        }
        move() {
            this.rigidbody.setVelocity(ƒ.Vector3.SCALE(this.direction, this.speed));
            if (this.direction.magnitudeSquared > 0)
                this.rotationWrapperMatrix.lookIn(this.direction);
        }
        attack(_atk, _direction) {
            switch (_atk) {
                case ATTACK_TYPE.MAIN:
                    this.attackMain.attack(_direction);
                    break;
                case ATTACK_TYPE.SPECIAL:
                    this.attackSpecial.attack(_direction);
                    break;
            }
        }
        death() {
            console.log("I died.", this);
        }
        reduceMutator(_mutator) {
            super.reduceMutator(_mutator);
            delete _mutator.direction;
            delete _mutator.rotationWrapperMatrix;
            delete _mutator.attackMain;
            delete _mutator.attackSpecial;
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                speed: this.speed
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.speed != null)
                this.speed = _serialization.speed;
            return this;
        }
    }
    Script.ComponentBrawler = ComponentBrawler;
    let ATTACK_TYPE;
    (function (ATTACK_TYPE) {
        ATTACK_TYPE[ATTACK_TYPE["MAIN"] = 0] = "MAIN";
        ATTACK_TYPE[ATTACK_TYPE["SPECIAL"] = 1] = "SPECIAL";
    })(ATTACK_TYPE = Script.ATTACK_TYPE || (Script.ATTACK_TYPE = {}));
})(Script || (Script = {}));
var Script;
(function (Script) {
    class Cowboy extends Script.ComponentBrawler {
        move() {
            super.move();
        }
        reduceMutator(_mutator) {
            super.reduceMutator(_mutator);
        }
    }
    Script.Cowboy = Cowboy;
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map