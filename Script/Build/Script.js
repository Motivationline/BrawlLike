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
            _event.preventDefault();
            console.log("leftclick", _event);
        };
        rightclick = (_event) => {
            _event.preventDefault();
            console.log("rightclick", _event);
        };
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
    class ComponentProjectile extends ƒ.Component {
        gravity = false;
        rotateInDirection = true;
        damage = 100;
        speed = 10;
        range = 10;
        #rb;
        #owner;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.init);
        }
        init = () => {
            this.#rb = this.node.getComponent(ƒ.ComponentRigidbody);
            this.#rb.effectGravity = Number(this.gravity);
            this.#rb.addEventListener("TriggerEnteredCollision" /* ƒ.EVENT_PHYSICS.TRIGGER_ENTER */, this.onTriggerEnter);
        };
        fire(_direction, _owner) {
            this.#rb.setVelocity(new ƒ.Vector3(_direction.x, 0, _direction.y).scale(this.speed));
            this.#owner = _owner;
        }
        onTriggerEnter = (_event) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody)
                return;
            //TODO do team check
            _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Damagable).health -= this.damage;
            this.explode();
        };
        explode() {
            this.node.getParent().removeChild(this.node);
        }
    }
    Script.ComponentProjectile = ComponentProjectile;
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
                    break;
            }
        };
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
        death() {
            console.log("I died.", this);
        }
        reduceMutator(_mutator) {
            super.reduceMutator(_mutator);
            delete _mutator.direction;
            delete _mutator.rotationWrapperMatrix;
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                speed: this.speed
            };
            return serialization;
        }
        async deserialize(_serialization) {
            await super.deserialize(_serialization[super.constructor.name]);
            this.speed = _serialization.speed;
            return this;
        }
    }
    Script.ComponentBrawler = ComponentBrawler;
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