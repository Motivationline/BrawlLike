"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentOffsetAnimation extends ƒ.Component {
        offsetFactor = 1;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* ƒ.EVENT.COMPONENT_ADD */:
                    break;
                case "componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */:
                    let animator = this.node.getComponent(ƒ.ComponentAnimator);
                    let randomTime = Math.round(Math.random() * animator.animation.totalTime * this.offsetFactor);
                    animator.jumpTo(randomTime);
                    break;
            }
        };
    }
    Script.ComponentOffsetAnimation = ComponentOffsetAnimation;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class CustomMaterial extends ƒ.Material {
    }
    Script.CustomMaterial = CustomMaterial;
    class ComponentPhongToToon extends ƒ.Component {
        static iSubclass = ƒ.Component.registerSubclass(ComponentPhongToToon);
        static materials = {};
        constructor() {
            super();
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
        hndEvent = (_event) => {
            switch (_event.type) {
                case "nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */:
                    for (const node of this.node) {
                        let cmpMaterial = node.getComponent(ƒ.ComponentMaterial);
                        if (!cmpMaterial || !cmpMaterial.material)
                            continue;
                        cmpMaterial.material = this.materialToToon(cmpMaterial.material);
                    }
                    break;
            }
        };
        materialToToon(_material) {
            if (!_material.getShader().name.includes("Phong"))
                return _material;
            if (ComponentPhongToToon.materials[_material.idResource])
                return ComponentPhongToToon.materials[_material.idResource];
            let material;
            let coatClassName = _material.coat.type
                .replace("Normals", "")
                .replace("Remissive", "Toon");
            let coatClass = FudgeCore[coatClassName];
            let coat = new coatClass();
            this.coatToToon(_material.coat, coat);
            let shaderClassName = _material.getShader().name
                .replace("Normals", "")
                .replace("Phong", "Toon");
            let shaderClass = FudgeCore[shaderClassName];
            material = new ƒ.Material("Toon", shaderClass, coat);
            material.alphaClip = _material.alphaClip;
            ƒ.Project.deregister(material);
            material.idResource = _material.idResource;
            ComponentPhongToToon.materials[_material.idResource] = material;
            return material;
        }
        coatToToon(_coatRemissive, _coatToon) {
            _coatToon.color = _coatRemissive.color;
            _coatToon.diffuse = _coatRemissive.diffuse;
            _coatToon.specular = _coatRemissive.specular;
            _coatToon.intensity = _coatRemissive.intensity;
            _coatToon.metallic = _coatRemissive.metallic;
            _coatToon.texture = _coatRemissive.texture;
        }
    }
    Script.ComponentPhongToToon = ComponentPhongToToon;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class Damagable extends ƒ.Component {
        #health = 500;
        rigidbody;
        #healthBar;
        #maxHealth = 500;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.initDamagable);
            this.#maxHealth = this.#health;
        }
        initDamagable = () => {
            // this.removeEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.initDamagable);
            this.node.addEventListener("graphInstantiated" /* ƒ.EVENT.GRAPH_INSTANTIATED */, this.initHealthbar, true);
            this.rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
        };
        initHealthbar = async () => {
            // this.node.removeEventListener(ƒ.EVENT.GRAPH_INSTANTIATED, this.initHealthbar, true);
            let healthbar = ƒ.Project.getResourcesByName("Healthbar")[0];
            let instance = await ƒ.Project.createGraphInstance(healthbar);
            this.node.addChild(instance);
            this.#healthBar = instance.getChild(0).getComponent(ƒ.ComponentMesh);
        };
        get health() {
            return this.#health;
        }
        set health(_amt) {
            this.#health = Math.min(_amt, this.#maxHealth);
            if (this.#health <= 0)
                this.death();
            if (!this.#healthBar)
                return;
            let scale = this.#health / this.#maxHealth;
            this.#healthBar.mtxPivot.scaling = new ƒ.Vector3(scale, this.#healthBar.mtxPivot.scaling.y, this.#healthBar.mtxPivot.scaling.z);
            this.#healthBar.mtxPivot.translation = new ƒ.Vector3(scale / 2 - 0.5, this.#healthBar.mtxPivot.translation.y, this.#healthBar.mtxPivot.translation.z);
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
    class Destructible extends ƒ.Component {
        destroy() {
            this.node.getParent().removeChild(this.node);
        }
    }
    Script.Destructible = Destructible;
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
                        // ƒ.Time.game.setScale(0.2);
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
        mainPreviewTimeout;
        specialPreviewTimeout;
        mousedown = (_event) => {
            _event.preventDefault();
            if (_event.button == 0) {
                this.mainPreviewTimeout = setTimeout(() => {
                    Script.EntityManager.Instance.playerBrawler.showPreview(Script.ATTACK_TYPE.MAIN);
                }, 100);
            }
            else if (_event.button == 2) {
                this.specialPreviewTimeout = setTimeout(() => {
                    Script.EntityManager.Instance.playerBrawler.showPreview(Script.ATTACK_TYPE.SPECIAL);
                }, 100);
            }
        };
        mouseup = (_event) => {
            _event.preventDefault();
            if (_event.button == 0) {
                clearTimeout(this.mainPreviewTimeout);
                this.tryToAttack(Script.ATTACK_TYPE.MAIN, _event);
                Script.EntityManager.Instance.playerBrawler.hidePreview(Script.ATTACK_TYPE.MAIN);
            }
            else if (_event.button == 2) {
                clearTimeout(this.specialPreviewTimeout);
                this.tryToAttack(Script.ATTACK_TYPE.SPECIAL, _event);
                Script.EntityManager.Instance.playerBrawler.hidePreview(Script.ATTACK_TYPE.SPECIAL);
            }
        };
        mousemove = (_event) => {
            _event.preventDefault();
            let ray = Script.viewport.getRayFromClient(new ƒ.Vector2(_event.clientX, _event.clientY));
            let clickPos = ray.intersectPlane(ƒ.Vector3.ZERO(), ƒ.Vector3.Y(1));
            Script.EntityManager.Instance.playerBrawler.mousePosition = clickPos;
        };
        tryToAttack(_atk, _event) {
            _event.preventDefault();
            let pb = Script.EntityManager.Instance.playerBrawler;
            if (!pb)
                return;
            Script.viewport.pointClientToProjection;
            // let playerPos = viewport.pointWorldToClient(pb.node.mtxWorld.translation);
            // let clientPos = viewport.pointClientToSource(new ƒ.Vector2(_event.clientX, _event.clientY));
            let ray = Script.viewport.getRayFromClient(new ƒ.Vector2(_event.clientX, _event.clientY));
            let clickPos = ray.intersectPlane(ƒ.Vector3.ZERO(), ƒ.Vector3.Y(1));
            let direction = ƒ.Vector3.DIFFERENCE(clickPos, pb.node.mtxWorld.translation);
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
                await this.initBrawler(defaultBrawler, spawnPoints[i].mtxLocal.translation.clone);
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
        removeProjectile(_proj) {
            _proj.node?.getParent()?.removeChild(_proj.node);
            let index = this.projectiles.indexOf(_proj);
            if (index >= 0) {
                this.projectiles.splice(index, 1);
            }
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
        canvas.addEventListener("mousedown", Script.InputManager.Instance.mousedown);
        canvas.addEventListener("mouseup", Script.InputManager.Instance.mouseup);
        canvas.addEventListener("mousemove", Script.InputManager.Instance.mousemove);
        canvas.addEventListener("contextmenu", (_e) => { _e.preventDefault(); });
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
    class ComponentAOE extends ƒ.Component {
        damage = 50;
        maxTicksPerEnemy = 1000;
        delayBetweenTicksInMS = 500;
        delayBeforeFirstTickInMS = 0;
        attachedToBrawler = false;
        radius = 1;
        destructive = false;
        duration = 1;
        areaVisible = true;
        #rb;
        #damagables = [];
        #owner;
        #circle;
        #endTime;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.init);
            ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.loop);
        }
        init = () => {
            this.#rb = this.node.getComponent(ƒ.ComponentRigidbody);
            this.#rb.addEventListener("TriggerEnteredCollision" /* ƒ.EVENT_PHYSICS.TRIGGER_ENTER */, this.onTriggerEnter);
            this.#rb.addEventListener("TriggerLeftCollision" /* ƒ.EVENT_PHYSICS.TRIGGER_EXIT */, this.onTriggerExit);
            this.node.addEventListener("graphInstantiated" /* ƒ.EVENT.GRAPH_INSTANTIATED */, this.initVisuals, true);
        };
        setup(_owner, _pos) {
            this.#owner = _owner;
            this.node.mtxLocal.translation = new ƒ.Vector3(_pos.x, 0, _pos.z);
            this.#endTime = ƒ.Time.game.get() + this.duration * 1000;
        }
        initVisuals = async () => {
            let aoeCircle = ƒ.Project.getResourcesByName("AOECircle")[0];
            let instance = await ƒ.Project.createGraphInstance(aoeCircle);
            this.node.addChild(instance);
            this.node.mtxLocal.scale(ƒ.Vector3.ONE(this.radius));
            this.#circle = instance;
            if (this.areaVisible) {
                this.#circle.activate(true);
                let mat = this.#circle.getComponent(ƒ.ComponentMaterial);
                if (this.#owner === Script.EntityManager.Instance.playerBrawler) {
                    mat.clrPrimary = ƒ.Color.CSS("aqua");
                }
                else {
                    mat.clrPrimary = ƒ.Color.CSS("crimson");
                }
            }
            else {
                this.#circle.activate(false);
            }
        };
        loop = () => {
            if (this.maxTicksPerEnemy === null || this.maxTicksPerEnemy === undefined)
                this.maxTicksPerEnemy = Infinity;
            let currentTime = ƒ.Time.game.get();
            for (let pair of this.#damagables) {
                if (pair.nextDamage <= currentTime && pair.amtTicks < this.maxTicksPerEnemy) {
                    pair.target.health -= this.damage;
                    pair.nextDamage = currentTime + this.delayBetweenTicksInMS;
                    pair.amtTicks++;
                }
            }
            if (this.#endTime < currentTime) {
                this.node.getParent()?.removeChild(this.node);
                ƒ.Loop.removeEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.loop);
            }
        };
        onTriggerEnter = (_event) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody)
                return;
            // TODO: Team check
            // check if damagable
            let damagable = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Damagable);
            if (damagable) {
                let amtTicks = 0;
                if (this.delayBeforeFirstTickInMS === 0) {
                    damagable.health -= this.damage;
                    amtTicks++;
                }
                let dInArray = this.#damagables.find((d) => d.target === damagable);
                if (!dInArray) {
                    this.#damagables.push({
                        target: damagable,
                        nextDamage: this.delayBeforeFirstTickInMS > 0 ? ƒ.Time.game.get() + this.delayBeforeFirstTickInMS : ƒ.Time.game.get() + this.delayBetweenTicksInMS,
                        amtTicks,
                    });
                }
            }
            // check for destructible target
            if (this.destructive) {
                let destructible = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Destructible);
                if (destructible) {
                    destructible.destroy();
                }
            }
        };
        onTriggerExit = (_event) => {
            let damagable = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Damagable);
            if (damagable) {
                for (let i = 0; i < this.#damagables.length; i++) {
                    let d = this.#damagables[i].target;
                    if (d === damagable) {
                        this.#damagables.splice(i, 1);
                        break;
                    }
                }
            }
        };
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                damage: this.damage,
                maxTicksPerEnemy: this.maxTicksPerEnemy,
                delayBetweenTicksInMS: this.delayBetweenTicksInMS,
                delayBeforeFirstTickInMS: this.delayBeforeFirstTickInMS,
                attachedToBrawler: this.attachedToBrawler,
                radius: this.radius,
                destructive: this.destructive,
                duration: this.duration,
                areaVisible: this.areaVisible,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.damage !== undefined)
                this.damage = _serialization.damage;
            if (_serialization.maxTicksPerEnemy !== undefined)
                this.maxTicksPerEnemy = _serialization.maxTicksPerEnemy;
            if (_serialization.delayBetweenTicksInMS !== undefined)
                this.delayBetweenTicksInMS = _serialization.delayBetweenTicksInMS;
            if (_serialization.delayBeforeFirstTickInMS !== undefined)
                this.delayBeforeFirstTickInMS = _serialization.delayBeforeFirstTickInMS;
            if (_serialization.attachedToBrawler !== undefined)
                this.attachedToBrawler = _serialization.attachedToBrawler;
            if (_serialization.radius !== undefined)
                this.radius = _serialization.radius;
            if (_serialization.destructive !== undefined)
                this.destructive = _serialization.destructive;
            if (_serialization.duration !== undefined)
                this.duration = _serialization.duration;
            if (_serialization.areaVisible !== undefined)
                this.areaVisible = _serialization.areaVisible;
            return this;
        }
    }
    Script.ComponentAOE = ComponentAOE;
})(Script || (Script = {}));
// /// <reference path="ComponentAttack.ts"/>
// namespace Script {
//     import ƒ = FudgeCore;
//     export class ComponentAOEAttack extends ComponentAttack {
//         offset: ƒ.Vector3 = ƒ.Vector3.ZERO();
//         executeAttack: ƒ.TimerHandler;
//     }
// }
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    let AttackPreviewType;
    (function (AttackPreviewType) {
        AttackPreviewType[AttackPreviewType["LINE"] = 0] = "LINE";
        AttackPreviewType[AttackPreviewType["CONE"] = 1] = "CONE";
        AttackPreviewType[AttackPreviewType["AREA"] = 2] = "AREA";
    })(AttackPreviewType = Script.AttackPreviewType || (Script.AttackPreviewType = {}));
    let AttackType;
    (function (AttackType) {
        AttackType[AttackType["MAIN"] = 0] = "MAIN";
        AttackType[AttackType["SPECIAL"] = 1] = "SPECIAL";
    })(AttackType = Script.AttackType || (Script.AttackType = {}));
    class ComponentAttack extends ƒ.Component {
        previewType = AttackPreviewType.LINE;
        previewWidth = 1;
        range = 5;
        attackType = AttackType.MAIN;
        maxCharges = 3;
        damage = 100;
        minDelayBetweenAttacks = 0.3;
        energyGenerationPerSecond = 0;
        energyNeededPerCharge = 1;
        castingTime = 0;
        lockBrawlerDuringAttack = false;
        singleton = false;
        maxEnergy = 0;
        currentEnergy = 0;
        nextAttackAllowedAt = -1;
        #attackBars = [];
        #attackBarColor;
        #previewNode;
        #previewActive = false;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, () => {
                this.node.addEventListener("graphInstantiated" /* ƒ.EVENT.GRAPH_INSTANTIATED */, this.initAttack, true);
            });
        }
        showPreview() {
            this.#previewNode.activate(true);
            this.#previewActive = true;
        }
        hidePreview() {
            this.#previewNode.activate(false);
            this.#previewActive = false;
        }
        updatePreview(_brawlerPosition, _mousePosition) {
            if (!this.#previewActive)
                return;
            switch (this.previewType) {
                case AttackPreviewType.LINE:
                case AttackPreviewType.CONE:
                    let newRotation = ƒ.Matrix4x4.LOOK_AT(_brawlerPosition, _mousePosition).rotation;
                    this.#previewNode.mtxLocal.rotation = ƒ.Vector3.Y(newRotation.y);
                    break;
                case AttackPreviewType.AREA:
                    let newPosition = ƒ.Vector3.DIFFERENCE(_mousePosition, _brawlerPosition);
                    if (newPosition.magnitude > this.range)
                        newPosition.normalize(this.range);
                    this.#previewNode.mtxLocal.translation = newPosition;
                    break;
            }
        }
        initAttack = async () => {
            // Preview
            let quad = ƒ.Project.getResourcesByType(ƒ.MeshQuad)[0];
            let texture;
            switch (this.previewType) {
                case AttackPreviewType.LINE:
                    texture = ƒ.Project.getResourcesByName("PreviewLine")[0];
                    break;
                case AttackPreviewType.CONE:
                    texture = ƒ.Project.getResourcesByName("PreviewCone")[0];
                    break;
                case AttackPreviewType.AREA:
                    texture = ƒ.Project.getResourcesByName("PreviewArea")[0];
                    break;
            }
            if (!quad || !texture) {
                console.error("Failed to load preview resources.");
                return;
            }
            let node = new ƒ.Node("preview");
            node.addComponent(new ƒ.ComponentTransform());
            let childNode = new ƒ.Node("previewInner");
            let mesh = new ƒ.ComponentMesh(quad);
            childNode.addComponent(mesh);
            let mat = new ƒ.ComponentMaterial(texture);
            childNode.addComponent(mat);
            mat.sortForAlpha = true;
            if (this.previewType === AttackPreviewType.CONE || this.previewType === AttackPreviewType.LINE) {
                mesh.mtxPivot.scaleX(this.previewWidth);
                mesh.mtxPivot.translateZ(0.5);
                node.mtxLocal.scaling.z = this.range;
            }
            else if (this.previewType === AttackPreviewType.AREA) {
                mesh.mtxPivot.scaleX(this.previewWidth);
                mesh.mtxPivot.scaleZ(this.previewWidth);
            }
            mesh.mtxPivot.rotateX(-90);
            node.addChild(childNode);
            this.#previewNode = node;
            this.node.addChild(node);
            this.hidePreview();
            // Chargebar
            this.maxEnergy = this.maxCharges * this.energyNeededPerCharge;
            this.currentEnergy = this.maxEnergy;
            if (this.attackType === AttackType.SPECIAL)
                this.currentEnergy = 0;
            let attackbar = ƒ.Project.getResourcesByName("BasicAttackBar")[0];
            let width = 1 / this.maxCharges;
            let gap = width * 0.1;
            let visibleWidth = (1 - (this.maxCharges - 1) * gap) / this.maxCharges;
            this.#attackBarColor = ƒ.Color.CSS("Orange");
            if (this.attackType === AttackType.SPECIAL)
                this.#attackBarColor = ƒ.Color.CSS("Gold");
            for (let i = 0; i < this.maxCharges; i++) {
                let instance = await ƒ.Project.createGraphInstance(attackbar);
                this.node.addChild(instance);
                let translateBy = width * i - 0.5 + 0.5 * width;
                instance.mtxLocal.translateX(translateBy);
                if (this.attackType === AttackType.SPECIAL)
                    instance.mtxLocal.translateY(-0.1);
                instance.mtxLocal.scaleX(visibleWidth);
                this.#attackBars.push(instance.getChild(0));
                if (i * this.energyNeededPerCharge < this.currentEnergy)
                    instance.getChild(0).getComponent(ƒ.ComponentMaterial).clrPrimary = this.#attackBarColor;
            }
        };
        attack(_direction) {
            let charges = Math.floor(this.currentEnergy / this.energyNeededPerCharge);
            if (charges < 1)
                return false;
            let timeNow = ƒ.Time.game.get();
            if (this.nextAttackAllowedAt > timeNow)
                return false;
            if (charges < this.#attackBars.length) {
                let pivot = this.#attackBars[charges].getComponent(ƒ.ComponentMesh).mtxPivot;
                pivot.scaling = new ƒ.Vector3(0, pivot.scaling.y, pivot.scaling.z);
            }
            this.currentEnergy -= this.energyNeededPerCharge;
            this.#attackBars[charges - 1].getComponent(ƒ.ComponentMaterial).clrPrimary = ƒ.Color.CSS("gray");
            this.nextAttackAllowedAt = timeNow + this.minDelayBetweenAttacks * 1000;
            ƒ.Time.game.setTimer(this.castingTime * 1000, 1, this.executeAttack, _direction);
            return true;
        }
        update() {
            let charges = Math.floor(this.currentEnergy / this.energyNeededPerCharge);
            if (charges < this.maxCharges) {
                let deltaTime = ƒ.Loop.timeFrameGame / 1000;
                let energyCharge = deltaTime * this.energyGenerationPerSecond;
                this.currentEnergy = Math.min(this.maxEnergy, energyCharge + this.currentEnergy);
                for (let charge = 0; charge < this.maxCharges; charge++) {
                    let scaling = this.#attackBars[charge].getComponent(ƒ.ComponentMesh).mtxPivot.scaling;
                    let thisChargePercentage = Math.min(1, Math.max(0, (this.currentEnergy - (charge * this.energyNeededPerCharge)) / this.energyNeededPerCharge));
                    this.#attackBars[charge].getComponent(ƒ.ComponentMesh).mtxPivot.scaling = new ƒ.Vector3(Math.min(1, thisChargePercentage), scaling.y, scaling.z);
                    let translation = this.#attackBars[charge].getComponent(ƒ.ComponentMesh).mtxPivot.translation;
                    this.#attackBars[charge].getComponent(ƒ.ComponentMesh).mtxPivot.translation = new ƒ.Vector3(Math.min(1, thisChargePercentage) / 2 - 0.5, translation.y, translation.z);
                    if (thisChargePercentage >= 1) {
                        this.#attackBars[charge].getComponent(ƒ.ComponentMaterial).clrPrimary = this.#attackBarColor;
                    }
                }
            }
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                previewType: this.previewType,
                previewWidth: this.previewWidth,
                range: this.range,
                attackType: this.attackType,
                maxCharges: this.maxCharges,
                damage: this.damage,
                minDelayBetweenAttacks: this.minDelayBetweenAttacks,
                energyGenerationPerSecond: this.energyGenerationPerSecond,
                energyNeededPerCharge: this.energyNeededPerCharge,
                castingTime: this.castingTime,
                lockBrawlerDuringAttack: this.lockBrawlerDuringAttack,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.previewType !== undefined)
                this.previewType = _serialization.previewType;
            if (_serialization.previewWidth !== undefined)
                this.previewWidth = _serialization.previewWidth;
            if (_serialization.attackType !== undefined)
                this.attackType = _serialization.attackType;
            if (_serialization.range !== undefined)
                this.range = _serialization.range;
            if (_serialization.maxCharges !== undefined)
                this.maxCharges = _serialization.maxCharges;
            if (_serialization.damage !== undefined)
                this.damage = _serialization.damage;
            if (_serialization.minDelayBetweenAttacks !== undefined)
                this.minDelayBetweenAttacks = _serialization.minDelayBetweenAttacks;
            if (_serialization.energyGenerationPerSecond !== undefined)
                this.energyGenerationPerSecond = _serialization.energyGenerationPerSecond;
            if (_serialization.energyNeededPerCharge !== undefined)
                this.energyNeededPerCharge = _serialization.energyNeededPerCharge;
            if (_serialization.castingTime !== undefined)
                this.castingTime = _serialization.castingTime;
            if (_serialization.lockBrawlerDuringAttack !== undefined)
                this.lockBrawlerDuringAttack = _serialization.lockBrawlerDuringAttack;
            return this;
        }
        getMutatorAttributeTypes(_mutator) {
            let types = super.getMutatorAttributeTypes(_mutator);
            if (types.previewType)
                types.previewType = AttackPreviewType;
            if (types.attackType)
                types.attackType = AttackType;
            return types;
        }
        reduceMutator(_mutator) {
            delete _mutator.maxEnergy;
            delete _mutator.currentEnergy;
            delete _mutator.nextAttackAllowedAt;
            delete _mutator.singleton;
        }
    }
    Script.ComponentAttack = ComponentAttack;
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
        destructive = false;
        impactAOE;
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
            this.#rb.addEventListener("TriggerEnteredCollision" /* ƒ.EVENT_PHYSICS.TRIGGER_ENTER */, this.onTriggerEnter);
            this.node.addEventListener("graphInstantiated" /* ƒ.EVENT.GRAPH_INSTANTIATED */, this.initShadow, true);
        };
        fire(_direction, _owner) {
            this.#owner = _owner;
            this.#rb.effectGravity = Number(this.gravity);
            if (this.rotateInDirection) {
                this.node.mtxLocal.lookIn(_direction);
            }
            if (this.gravity) {
                // calculate arc as desired
                let timeToImpact = this.speed;
                let desiredHeight = 3;
                let g = ƒ.Physics.getGravity().y;
                let desiredG = -8 * desiredHeight / Math.pow(timeToImpact, 2);
                this.#rb.effectGravity = desiredG / g;
                let velocityY = -desiredG * timeToImpact / 2;
                _direction.scale(1 / timeToImpact);
                _direction.y = velocityY;
                this.#rb.setVelocity(_direction);
            }
            else {
                this.#rb.setVelocity(_direction.scale(this.speed));
            }
        }
        onTriggerEnter = (_event) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody)
                return;
            // TODO do team check
            // check if target has disable script
            let noProjectile = _event.cmpRigidbody.node.getComponent(Script.IgnoredByProjectiles);
            if (noProjectile && noProjectile.isActive)
                return;
            // check for damagable target
            let damagable = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Damagable);
            if (damagable) {
                damagable.health -= this.damage;
            }
            // check for destructible target
            if (this.destructive) {
                let destructible = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Destructible);
                if (destructible) {
                    destructible.destroy();
                }
            }
            this.explode();
        };
        async explode() {
            if (this.impactAOE) {
                let aoe = ƒ.Project.getResourcesByName(this.impactAOE)[0];
                let instance = await ƒ.Project.createGraphInstance(aoe);
                this.node.getParent().addChild(instance);
                let compAOE = instance.getAllComponents().find(c => c instanceof Script.ComponentAOE);
                compAOE.setup(this.#owner, this.node.mtxLocal.translation);
            }
            Script.EntityManager.Instance.removeProjectile(this);
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
            if (this.gravity)
                return;
            let distance = ƒ.Vector3.DIFFERENCE(this.node.mtxWorld.translation, this.#startPosition).magnitudeSquared;
            if (distance > this.range * this.range) {
                this.explode();
            }
        };
        reduceMutator(_mutator) {
            delete _mutator.damage;
            delete _mutator.speed;
            delete _mutator.range;
            delete _mutator.rotateInDirection;
            delete _mutator.destructive;
        }
        initShadow = async () => {
            let shadow = ƒ.Project.getResourcesByName("Shadow")[0];
            let instance = await ƒ.Project.createGraphInstance(shadow);
            instance.mtxLocal.scaling = ƒ.Vector3.ONE(0.5);
            this.node.addChild(instance);
        };
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                impactAOE: this.impactAOE,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.impactAOE !== undefined)
                this.impactAOE = _serialization.impactAOE;
            return this;
        }
    }
    Script.ComponentProjectile = ComponentProjectile;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentProjectileAttack extends Script.ComponentAttack {
        speed = 2;
        range = 10;
        recoil = 0;
        rotateInDirection = true;
        attachedToBrawler = false;
        projectile = "DefaultProjectile";
        gravity = false;
        destructive = false;
        executeAttack = (_event) => {
            let direction = _event.arguments[0];
            this.shootProjectile(direction);
        };
        async shootProjectile(_direction, _ignoreRange = false) {
            let projectile = ƒ.Project.getResourcesByName(this.projectile)[0];
            let instance = await ƒ.Project.createGraphInstance(projectile);
            let projectileComponent = instance.getAllComponents().find(c => c instanceof Script.ComponentProjectile);
            projectileComponent.damage = this.damage;
            projectileComponent.speed = this.speed;
            projectileComponent.range = this.range;
            projectileComponent.rotateInDirection = this.rotateInDirection;
            projectileComponent.gravity = this.gravity;
            projectileComponent.destructive = this.destructive;
            let parent = this.attachedToBrawler ? this.node : undefined;
            Script.EntityManager.Instance.addProjectile(instance, projectileComponent, parent);
            projectileComponent.moveToPosition(this.node.mtxWorld.translation.clone.add(ƒ.Vector3.Y(0.5)));
            let brawlerComp = this.node.getAllComponents().find(c => c instanceof Script.ComponentBrawler);
            if (this.gravity) {
                if (_direction.magnitude > this.range && !_ignoreRange)
                    _direction.normalize(this.range);
            }
            else {
                _direction.normalize();
            }
            projectileComponent.fire(_direction, brawlerComp);
            if (this.recoil !== 0) {
                let recoil = new ƒ.Vector3(-_direction.x, 0, -_direction.z).normalize(this.recoil);
                brawlerComp.addVelocity(recoil, 0.25);
            }
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                speed: this.speed,
                range: this.range,
                rotateInDirection: this.rotateInDirection,
                attachedToBrawler: this.attachedToBrawler,
                projectile: this.projectile,
                recoil: this.recoil,
                gravity: this.gravity,
                destructive: this.destructive,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.speed !== undefined)
                this.speed = _serialization.speed;
            if (_serialization.range !== undefined)
                this.range = _serialization.range;
            if (_serialization.rotateInDirection !== undefined)
                this.rotateInDirection = _serialization.rotateInDirection;
            if (_serialization.attachedToBrawler !== undefined)
                this.attachedToBrawler = _serialization.attachedToBrawler;
            if (_serialization.projectile !== undefined)
                this.projectile = _serialization.projectile;
            if (_serialization.recoil !== undefined)
                this.recoil = _serialization.recoil;
            if (_serialization.gravity !== undefined)
                this.gravity = _serialization.gravity;
            if (_serialization.destructive !== undefined)
                this.destructive = _serialization.destructive;
            return this;
        }
    }
    Script.ComponentProjectileAttack = ComponentProjectileAttack;
})(Script || (Script = {}));
///<reference path="../ComponentProjectileAttack.ts" />
var Script;
///<reference path="../ComponentProjectileAttack.ts" />
(function (Script) {
    class CowboyMainAttack extends Script.ComponentProjectileAttack {
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
    class CowboySpecialAttack extends Script.ComponentAttack {
        attack(_direction) {
            if (!super.attack(_direction))
                return false;
            return true;
        }
    }
    Script.CowboySpecialAttack = CowboySpecialAttack;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class FroggerSpecialAttack extends Script.ComponentProjectileAttack {
        radius = 1.5;
        amtProjectiles = 5;
        executeAttack = (_event) => {
            let direction = _event.arguments[0];
            this.shootProjectiles(direction);
        };
        async shootProjectiles(_direction) {
            if (_direction.magnitude > this.range)
                _direction.normalize(this.range);
            //shoot one in the center
            await this.shootProjectile(_direction.clone);
            //shoot other projectiles in radius around with random start angle
            let projAmt = this.amtProjectiles - 1;
            let angle = Math.random() * Math.PI;
            let angleBetweenProjectiles = Math.PI * 2 / projAmt;
            for (let proj = 0; proj < projAmt; proj++) {
                let newPosition = ƒ.Vector3.SUM(_direction, new ƒ.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize(this.radius));
                await this.shootProjectile(newPosition, true);
                angle += angleBetweenProjectiles;
            }
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                radius: this.radius,
                amtProjectiles: this.amtProjectiles,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.radius !== undefined)
                this.radius = _serialization.radius;
            if (_serialization.amtProjectiles !== undefined)
                this.amtProjectiles = _serialization.amtProjectiles;
            return this;
        }
    }
    Script.FroggerSpecialAttack = FroggerSpecialAttack;
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
        #animator;
        #animations = new Map();
        #currentlyActiveAnimation = { name: "idle", lock: false };
        mousePosition = ƒ.Vector3.ZERO();
        animationIdleName;
        animationWalkName;
        animationAttackName;
        animationSpecialName;
        #velocityOverrides = [];
        #playerMovementLockedUntil = -1;
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
                    this.node.addEventListener("childAppend" /* ƒ.EVENT.CHILD_APPEND */, this.resourcesLoaded);
                    break;
            }
        };
        resourcesLoaded = () => {
            this.node.removeEventListener("childAppend" /* ƒ.EVENT.CHILD_APPEND */, this.resourcesLoaded);
            this.#animator = this.node.getChild(0).getChild(0).getComponent(ƒ.ComponentAnimator);
        };
        #animationTimeout = -1;
        playAnimation(_name, _options) {
            _options = { ...{ lockAndSwitchToIdleAfter: false, playFromStart: false, lockMovement: false }, ..._options };
            if (_name === this.#currentlyActiveAnimation.name && !_options.lockAndSwitchToIdleAfter)
                return;
            if (this.#currentlyActiveAnimation.lock && !_options.lockAndSwitchToIdleAfter)
                return;
            if (!this.#animations.has(_name)) {
                let animationName = this.animationIdleName;
                if (_name == "walk")
                    animationName = this.animationWalkName;
                if (_name == "attack")
                    animationName = this.animationAttackName;
                if (_name == "special")
                    animationName = this.animationSpecialName;
                if (!animationName)
                    return;
                let animation = ƒ.Project.getResourcesByName(animationName)[0];
                if (!animation)
                    return;
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
            if (_options.lockMovement)
                this.lockPlayerFor(this.#animations.get(_name).totalTime);
        }
        findAttacks() {
            let components = this.node.getAllComponents();
            this.attackMain = components.find(c => c instanceof Script.ComponentAttack && c.attackType === Script.AttackType.MAIN);
            this.attackSpecial = components.find(c => c instanceof Script.ComponentAttack && c.attackType === Script.AttackType.SPECIAL);
            if (!this.attackMain || !this.attackSpecial)
                console.error(`${this.node.name} doesn't have a main and a special attack attached.`);
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
            if (Script.EntityManager.Instance.playerBrawler === this) {
                this.attackSpecial?.updatePreview(this.node.mtxLocal.translation, this.mousePosition);
                this.attackSpecial?.update();
                this.attackMain?.updatePreview(this.node.mtxLocal.translation, this.mousePosition);
                this.attackMain?.update();
            }
        }
        move() {
            let now = ƒ.Time.game.get();
            let combinedVelocity = new ƒ.Vector3();
            for (let i = 0; i < this.#velocityOverrides.length; i++) {
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
            }
            else {
                this.playAnimation("idle");
            }
        }
        attack(_atk, _direction) {
            if (this.#currentlyActiveAnimation.lock)
                return;
            switch (_atk) {
                case ATTACK_TYPE.MAIN:
                    if (this.attackMain.attack(_direction)) {
                        this.playAnimation("attack", { lockAndSwitchToIdleAfter: true, playFromStart: true, lockMovement: this.attackMain.lockBrawlerDuringAttack });
                    }
                    break;
                case ATTACK_TYPE.SPECIAL:
                    if (this.attackSpecial.attack(_direction)) {
                        this.playAnimation("special", { lockAndSwitchToIdleAfter: true, playFromStart: true, lockMovement: this.attackSpecial.lockBrawlerDuringAttack });
                    }
                    break;
            }
            this.rotationWrapperMatrix.lookIn(_direction);
        }
        showPreview(_atk) {
            switch (_atk) {
                case ATTACK_TYPE.MAIN:
                    this.attackMain.showPreview();
                    break;
                case ATTACK_TYPE.SPECIAL:
                    this.attackSpecial.showPreview();
                    break;
            }
        }
        hidePreview(_atk) {
            switch (_atk) {
                case ATTACK_TYPE.MAIN:
                    this.attackMain.hidePreview();
                    break;
                case ATTACK_TYPE.SPECIAL:
                    this.attackSpecial.hidePreview();
                    break;
            }
        }
        addVelocity(_velocity, _duration) {
            _duration *= 1000;
            this.#velocityOverrides.push({
                velocity: _velocity,
                until: ƒ.Time.game.get() + _duration,
            });
        }
        lockPlayerFor(_time) {
            this.#playerMovementLockedUntil = Math.max(ƒ.Time.game.get() + _time, this.#playerMovementLockedUntil);
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
            delete _mutator.mousePosition;
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                speed: this.speed,
                animationIdleName: this.animationIdleName,
                animationWalkName: this.animationWalkName,
                animationAttackName: this.animationAttackName,
                animationSpecialName: this.animationSpecialName,
            };
            return serialization;
        }
        async deserialize(_serialization) {
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
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class IgnoredByProjectiles extends ƒ.Component {
    }
    Script.IgnoredByProjectiles = IgnoredByProjectiles;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class Shadow extends ƒ.Component {
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.moveShadow);
        }
        moveShadow = () => {
            let currentY = this.node.mtxWorld.translation.y;
            if (currentY !== 0) {
                this.node.mtxLocal.translateY(-currentY);
            }
        };
    }
    Script.Shadow = Shadow;
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map