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
    class ServerSync extends ƒ.Component {
        id;
        ownerId;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
        }
        setupId(_id) {
            this.id = _id;
            if (!_id) {
                this.id = Script.MultiplayerManager.client.id + "+" + Math.floor(ƒ.Time.game.get()) + "+" + Math.floor(Math.random() * 10000 + 1);
            }
            this.ownerId = Script.MultiplayerManager.getOwnerIdFromId(this.id);
            Script.MultiplayerManager.register(this);
        }
        syncSelf() {
            Script.MultiplayerManager.updateOne(this.getInfo(), this.id);
        }
        getInfo() {
            let info = {};
            info.position = this.node.mtxLocal.translation;
            return info;
        }
        putInfo(_data) {
            if (this.ownerId === Script.MultiplayerManager.client.id && !_data.override)
                return;
            if (!_data)
                return;
            this.applyData(_data);
        }
        applyData(data) {
            if (data.type) {
                return;
            }
            let rb = this.node.getComponent(ƒ.ComponentRigidbody);
            rb.activate(false);
            this.node.mtxLocal.translation = new ƒ.Vector3(data.position.x, data.position.y, data.position.z);
            rb.activate(true);
        }
    }
    Script.ServerSync = ServerSync;
})(Script || (Script = {}));
/// <reference path="Misc/ServerSync.ts" />
var Script;
/// <reference path="Misc/ServerSync.ts" />
(function (Script) {
    var ƒ = FudgeCore;
    class Damagable extends Script.ServerSync {
        #health = 500;
        rigidbody;
        #healthBar;
        #maxHealth = 500;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.initDamagable);
        }
        initDamagable = () => {
            // this.removeEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.initDamagable);
            this.node.addEventListener("graphInstantiated" /* ƒ.EVENT.GRAPH_INSTANTIATED */, this.initHealthbar, true);
            this.rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
            this.#maxHealth = this.#health;
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
        dealDamage(_amt, _broadcast) {
            if (_amt === 0)
                return;
            this.#health = Math.min(this.#health - _amt, this.#maxHealth);
            if (this.#health <= 0)
                this.death();
            if (!this.#healthBar)
                return;
            let scale = this.#health / this.#maxHealth;
            this.#healthBar.mtxPivot.scaling = new ƒ.Vector3(scale, this.#healthBar.mtxPivot.scaling.y, this.#healthBar.mtxPivot.scaling.z);
            this.#healthBar.mtxPivot.translation = new ƒ.Vector3(scale / 2 - 0.5, this.#healthBar.mtxPivot.translation.y, this.#healthBar.mtxPivot.translation.z);
            if (_broadcast)
                Script.MultiplayerManager.updateOne({ type: "damage", override: true, amt: _amt }, this.id);
        }
        set health(_amt) {
            this.dealDamage(this.#health - _amt, false);
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
        getInfo() {
            let info = super.getInfo();
            info.health = this.#health;
            info.maxHealth = this.#maxHealth;
            return info;
        }
        applyData(data) {
            super.applyData(data);
            if (data.type) {
                switch (data.type) {
                    case "damage": {
                        this.dealDamage(data.amt, false);
                        break;
                    }
                }
                return;
            }
            this.health = data.health;
            this.#maxHealth = data.maxHealth;
        }
    }
    Script.Damagable = Damagable;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class Destructible extends ƒ.Component {
        static destrcutibles = [];
        replaceWith = "";
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, () => {
                this.node.addEventListener("destruction", this.destroy.bind(this));
            });
            Destructible.destrcutibles.push(this);
        }
        async destroy(_fromNetwork = false) {
            let index = Destructible.destrcutibles.indexOf(this);
            if (index < 0)
                return;
            Destructible.destrcutibles.splice(index, 1);
            if (!_fromNetwork) {
                Script.MultiplayerManager.broadcastDestructible(this);
            }
            let parent = this.node.getParent();
            parent.removeChild(this.node);
            if (this.replaceWith) {
                let replacement = ƒ.Project.getResourcesByName(this.replaceWith)[0];
                if (replacement) {
                    let instance = await ƒ.Project.createGraphInstance(replacement);
                    instance.mtxLocal.translation = this.node.mtxLocal.translation.clone;
                    instance.mtxLocal.scaling = this.node.mtxLocal.scaling.clone;
                    instance.mtxLocal.rotation = this.node.mtxLocal.rotation.clone;
                    parent.addChild(instance);
                }
            }
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                replaceWith: this.replaceWith,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.replaceWith !== undefined)
                this.replaceWith = _serialization.replaceWith;
            return this;
        }
    }
    Script.Destructible = Destructible;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    let MENU_TYPE;
    (function (MENU_TYPE) {
        MENU_TYPE[MENU_TYPE["NONE"] = 0] = "NONE";
        MENU_TYPE[MENU_TYPE["START"] = 1] = "START";
        MENU_TYPE[MENU_TYPE["LOADING"] = 2] = "LOADING";
        MENU_TYPE[MENU_TYPE["LOBBY"] = 3] = "LOBBY";
        MENU_TYPE[MENU_TYPE["GAME_LOBBY"] = 4] = "GAME_LOBBY";
        MENU_TYPE[MENU_TYPE["SELECTION"] = 5] = "SELECTION";
        MENU_TYPE[MENU_TYPE["GAME_OVERLAY"] = 6] = "GAME_OVERLAY";
    })(MENU_TYPE = Script.MENU_TYPE || (Script.MENU_TYPE = {}));
    class MenuManager {
        overlays = new Map();
        constructor() {
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Project.addEventListener("resourcesLoaded" /* ƒ.EVENT.RESOURCES_LOADED */, this.resourcesLoaded);
            document.addEventListener("DOMContentLoaded", () => {
                this.overlays.set(MENU_TYPE.START, document.getElementById("start-overlay"));
                this.overlays.set(MENU_TYPE.LOADING, document.getElementById("loading-overlay"));
                this.overlays.set(MENU_TYPE.LOBBY, document.getElementById("lobby-overlay"));
                this.overlays.set(MENU_TYPE.GAME_LOBBY, document.getElementById("game-lobby-overlay"));
                this.overlays.set(MENU_TYPE.SELECTION, document.getElementById("selection-overlay"));
                this.overlays.set(MENU_TYPE.GAME_OVERLAY, document.getElementById("game-overlay"));
                document.getElementById("start").addEventListener("click", () => {
                    this.showOverlay(MENU_TYPE.LOADING);
                    Script.startViewport();
                });
                document.getElementById("brawler").querySelectorAll("button").forEach((button) => {
                    button.addEventListener("click", async () => {
                        document.getElementById("brawler").querySelectorAll("button").forEach((button) => button.classList.remove("selected"));
                        button.classList.add("selected");
                        // GameManager.Instance.selectBrawler(button.dataset.brawler, LobbyManager.client.id);
                        Script.LobbyManager.selectBrawler(button.dataset.brawler);
                    });
                    // await GameManager.Instance.startGame();
                    // this.showOverlay(MENU_TYPE.NONE);
                });
                document.getElementById("lobby-host").addEventListener("click", () => {
                    this.showOverlay(MENU_TYPE.GAME_LOBBY);
                    document.getElementById("game-settings").hidden = false;
                    document.getElementById("game-lobby-start").hidden = false;
                    document.getElementById("start_game").hidden = false;
                    document.getElementById("start_game").disabled = true;
                    document.getElementById("lobby-client-settings").hidden = true;
                });
                document.getElementById("lobby-join").addEventListener("click", () => {
                    this.showOverlay(MENU_TYPE.GAME_LOBBY);
                    document.getElementById("game-settings").hidden = true;
                    document.getElementById("game-lobby-start").hidden = true;
                    document.getElementById("start_game").hidden = true;
                    document.getElementById("start_game").disabled = true;
                    document.getElementById("lobby-client-settings").hidden = false;
                });
                document.getElementById("game-lobby-cancel").addEventListener("click", () => {
                    this.showOverlay(MENU_TYPE.LOBBY);
                });
                document.getElementById("game-lobby-start").addEventListener("click", () => {
                    let form = document.getElementById("game-settings");
                    form.querySelectorAll("select").forEach(el => {
                        if (el.disabled)
                            el.dataset.disabled = "true";
                        el.disabled = false;
                    });
                    let data = new FormData(form);
                    form.querySelectorAll("select").forEach(el => {
                        if (el.dataset.disabled)
                            el.disabled = true;
                        el.dataset.disabled = "";
                    });
                    let respawnTypeSetting = data.get("setting-respawn");
                    let respawnType = [Script.RESPAWN_TYPE.AT_DEATH_LOCATION];
                    switch (respawnTypeSetting) {
                        case "initial":
                            respawnType.unshift(Script.RESPAWN_TYPE.AT_FIXED_RESPAWN_POINT);
                            break;
                        case "random":
                            respawnType.unshift(Script.RESPAWN_TYPE.AT_RANDOM_RESPAWN_POINT);
                            break;
                        case "teammate":
                            respawnType.unshift(Script.RESPAWN_TYPE.AT_TEAMMATE_LOCATION);
                            break;
                        case "death":
                        default:
                            respawnType.unshift(Script.RESPAWN_TYPE.AT_DEATH_LOCATION);
                            break;
                    }
                    let selectedMap = document.getElementById("setting-map").querySelector(`option[value="${data.get("setting-map")}"]`);
                    let arena = selectedMap.dataset.arena;
                    let gameData = {
                        amtRounds: Number(data.get("setting-rounds")),
                        maxRespawnsPerRoundAndPlayer: Number(data.get("setting-lives")),
                        maxRespawnsPerRoundAndTeam: Number(data.get("setting-team-lives")),
                        respawnTime: Number(data.get("setting-respawn-timer")),
                        timer: Number(data.get("setting-timer")),
                        respawnType,
                        arena,
                    };
                    let teams = [];
                    let playerIDs = Object.keys(Script.LobbyManager.client.clientsInfoFromServer);
                    switch (data.get("setting-team")) {
                        case "team":
                            switch (arena) {
                                case "TrainingMap": {
                                    teams = createTeams(playerIDs, { maxTeams: 1 });
                                    break;
                                }
                                case "Map":
                                    teams = createTeams(playerIDs, { maxTeams: 2, maxPlayersPerTeam: 3, fillMode: "CREATE_TEAMS" });
                                    break;
                                case "BigMap":
                                default:
                                    teams = createTeams(playerIDs, { maxPlayersPerTeam: 2, fillMode: "FILL_TEAMS", maxTeams: 8 });
                                    break;
                            }
                            break;
                        case "ffa":
                            teams = createTeams(playerIDs, { maxPlayersPerTeam: 1 });
                            break;
                    }
                    if (arena !== "TrainingMap") {
                        if (teams.length <= 1) {
                            alert("You need at least two players for this map.");
                            return;
                        }
                    }
                    // LobbyManager.client.dispatch({command: FudgeNet.COMMAND.UNDEFINED, route: FudgeNet.ROUTE.VIA_SERVER, content: {command: "initGameManager", data: {teams, gameData}}})
                    Script.GameManager.Instance.init(teams, gameData);
                    Script.LobbyManager.switchView(MENU_TYPE.SELECTION);
                    this.showOverlay(MENU_TYPE.SELECTION);
                });
                document.getElementById("setting-map").addEventListener("change", (_event) => {
                    let value = _event.target.value;
                    switch (value) {
                        case "training":
                            document.getElementById("setting-respawn").disabled = true;
                            document.getElementById("setting-respawn").value = "initial";
                            document.getElementById("setting-team").disabled = true;
                            document.getElementById("setting-team").value = "team";
                            break;
                        case "small":
                            document.getElementById("setting-respawn").disabled = true;
                            document.getElementById("setting-respawn").value = "initial";
                            document.getElementById("setting-team").disabled = true;
                            document.getElementById("setting-team").value = "team";
                            break;
                        case "large":
                            document.getElementById("setting-respawn").disabled = false;
                            document.getElementById("setting-respawn").value = "random";
                            document.getElementById("setting-team").disabled = false;
                            document.getElementById("setting-team").value = "ffa";
                            break;
                        default:
                            break;
                    }
                });
                document.getElementById("start_game").addEventListener("click", (_event) => {
                    Script.LobbyManager.startGame();
                });
            });
        }
        resourcesLoaded = () => {
            console.log("resources loaded");
            this.showOverlay(MENU_TYPE.LOBBY);
        };
        showOverlay(_type) {
            if (!this.overlays.has(_type) && _type !== MENU_TYPE.NONE)
                return;
            this.overlays.forEach(overlay => {
                overlay.classList.add("hidden");
            });
            this.overlays.get(_type)?.classList.remove("hidden");
        }
    }
    Script.MenuManager = MenuManager;
    function createTeams(_clients, _options) {
        const options = {
            ...{ maxTeams: Infinity, maxPlayersPerTeam: Infinity, fillMode: "CREATE_TEAMS" }, ..._options
        };
        let teams = [];
        if (options.fillMode === "CREATE_TEAMS") {
            for (let i = 0; i < _clients.length; i++) {
                let player = _clients[i];
                if (teams.length < options.maxTeams) {
                    teams.push({ players: [{ id: player }] });
                }
                else {
                    let team = teams[i % options.maxTeams];
                    if (!team || team.players.length >= options.maxPlayersPerTeam)
                        return teams;
                    team.players.push({ id: player });
                }
            }
        }
        else if (options.fillMode === "FILL_TEAMS") {
            for (let i = 0; i < _clients.length; i++) {
                let player = _clients[i];
                let team = teams[teams.length - 1];
                if (!team || team.players.length >= options.maxPlayersPerTeam) {
                    team = { players: [{ id: player }] };
                    teams.push(team);
                }
                else {
                    team.players.push({ id: player });
                }
            }
        }
        for (let t = 0; t < teams.length; t++) {
            for (let player of teams[t].players) {
                player.team = t;
            }
        }
        return teams;
    }
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
            let direction = ƒ.Recycler.reuse(ƒ.Vector3).set(0, 0, 0);
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.A, ƒ.KEYBOARD_CODE.ARROW_LEFT]))
                direction.x += -1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.D, ƒ.KEYBOARD_CODE.ARROW_RIGHT]))
                direction.x += 1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.S, ƒ.KEYBOARD_CODE.ARROW_DOWN]))
                direction.z += 1;
            if (ƒ.Keyboard.isPressedOne([ƒ.KEYBOARD_CODE.W, ƒ.KEYBOARD_CODE.ARROW_UP]))
                direction.z += -1;
            if (direction.equals(Script.EntityManager.Instance.playerBrawler.getDirection())) {
                ƒ.Recycler.store(direction);
                return;
            }
            let mgtSqrt = direction.magnitudeSquared;
            if (mgtSqrt === 0) {
                Script.EntityManager.Instance.playerBrawler?.setMovement(direction);
                ƒ.Recycler.store(direction);
                return;
            }
            if (mgtSqrt > 1) {
                direction.normalize(1);
            }
            Script.EntityManager.Instance.playerBrawler?.setMovement(direction);
            ƒ.Recycler.store(direction);
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
            Script.EntityManager.Instance.playerBrawler.mousePosition = new ƒ.Vector2(_event.clientX, _event.clientY);
        };
        tryToAttack(_atk, _event) {
            _event.preventDefault();
            let pb = Script.EntityManager.Instance.playerBrawler;
            if (!pb)
                return;
            Script.viewport.pointClientToProjection;
            // let playerPos = viewport.pointWorldToClient(pb.node.mtxWorld.translation);
            // let clientPos = viewport.pointClientToSource(new ƒ.Vector2(_event.clientX, _event.clientY));
            let clickPos = InputManager.mousePositionToWorldPlanePosition(new ƒ.Vector2(_event.clientX, _event.clientY));
            let direction = ƒ.Vector3.DIFFERENCE(clickPos, pb.node.mtxWorld.translation);
            Script.EntityManager.Instance.playerBrawler?.attack(_atk, direction);
        }
        static mousePositionToWorldPlanePosition(_mousePosition) {
            let ray = Script.viewport.getRayFromClient(_mousePosition);
            let clickPos = ray.intersectPlane(ƒ.Vector3.ZERO(), ƒ.Vector3.Y(1));
            return clickPos;
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
        loadBrawler = async (_playerBrawler) => {
            console.log("load Brawler");
            if (!_playerBrawler)
                return;
            let playerBrawler = ƒ.Project.getResourcesByName(_playerBrawler.chosenBrawler)[0];
            let spawnPoint = Script.GameManager.Instance.getSpawnPointForPlayer(Script.LobbyManager.client.id);
            this.playerBrawler = await this.initBrawler(playerBrawler, spawnPoint);
            let cameraGraph = ƒ.Project.getResourcesByName("CameraBrawler")[0];
            let cameraInstance = await ƒ.Project.createGraphInstance(cameraGraph);
            this.playerBrawler.node.addChild(cameraInstance);
            let camera = cameraInstance.getComponent(ƒ.ComponentCamera);
            Script.viewport.camera = camera;
            this.playerBrawler.setupId();
            _playerBrawler.brawler = this.playerBrawler;
        };
        async initBrawler(_g, _pos) {
            let instance = await ƒ.Project.createGraphInstance(_g);
            this.node.addChild(instance);
            instance.mtxLocal.translation = _pos;
            let cb = instance.getAllComponents().find(c => c instanceof Script.ComponentBrawler);
            this.brawlers.push(cb);
            return cb;
        }
        addObjectThroughNetwork(_instance) {
            let components = _instance.getAllComponents();
            let brawler = components.find(c => c instanceof Script.ComponentBrawler);
            if (brawler)
                this.brawlers.push(brawler);
            let proj = components.find(c => c instanceof Script.ComponentProjectile);
            if (proj)
                this.addProjectile(_instance, proj);
            this.node.addChild(_instance);
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
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    var ƒNet = FudgeNet;
    let MessageCommand;
    (function (MessageCommand) {
        MessageCommand[MessageCommand["SYNC"] = 0] = "SYNC";
        MessageCommand[MessageCommand["DESTROY"] = 1] = "DESTROY";
        MessageCommand[MessageCommand["CREATE"] = 2] = "CREATE";
        MessageCommand[MessageCommand["JOIN"] = 3] = "JOIN";
        MessageCommand[MessageCommand["DESTRUCT"] = 4] = "DESTRUCT";
    })(MessageCommand || (MessageCommand = {}));
    class MultiplayerManager {
        static Instance = new MultiplayerManager();
        static client;
        static #ownElementsToSync = new Map();
        static #otherElementsToSync = new Map();
        static #otherClients = {};
        constructor() {
            if (MultiplayerManager.Instance)
                return MultiplayerManager.Instance;
        }
        static register(_syncComp) {
            if (_syncComp.ownerId === this.client.id) {
                this.#ownElementsToSync.set(_syncComp.id, _syncComp);
                this.broadcastCreation(_syncComp.creationData());
            }
            else if (_syncComp.ownerId !== this.client.id) {
                this.#otherElementsToSync.set(_syncComp.id, _syncComp);
            }
        }
        static installListeners() {
            this.client.addEventListener(ƒNet.EVENT.MESSAGE_RECEIVED, this.messageHandler.bind(this));
            setInterval(() => {
                if (!Script.GameManager.Instance.gameActive)
                    return;
                let updateData = this.getUpdate();
                if (Object.keys(updateData).length == 0)
                    return;
                this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.SYNC, data: updateData } });
            }, 1000);
        }
        static broadcastCreation(_data) {
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.CREATE, data: _data } });
        }
        static getUpdate() {
            let data = {};
            for (let element of this.#ownElementsToSync.values()) {
                if (element.node.getParent()) {
                    data[element.id] = element.getInfo();
                }
            }
            return data;
        }
        static async applyUpdate(_data) {
            // console.log("apply Update", { _data })
            for (let element of this.#otherElementsToSync.values()) {
                let data = _data[element.id];
                if (data) {
                    element.putInfo(data);
                }
                delete _data[element.id];
            }
            for (let id in _data) {
                let data = _data[id];
                if (!data.override)
                    continue;
                this.#ownElementsToSync.get(id)?.putInfo(data);
            }
        }
        static async createObject(_data) {
            let graph = ƒ.Project.getResourcesByName(_data.resourceName)[0];
            let instance = await ƒ.Project.createGraphInstance(graph);
            Script.EntityManager.Instance.addObjectThroughNetwork(instance);
            let ssc = instance.getAllComponents().find(c => c instanceof Script.ServerSync);
            ssc.setupId(_data.id);
            ssc.applyData(_data.initData);
        }
        static async destroyObject(_data) {
            if (!this.#otherElementsToSync.has(_data.id))
                return;
            let element = this.#otherElementsToSync.get(_data.id);
            element.node.getParent()?.removeChild(element.node);
            this.#otherElementsToSync.delete(_data.id);
        }
        static updateOne(_data, _id) {
            let updateData = {};
            updateData[_id] = _data;
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.SYNC, data: updateData } });
        }
        static broadcastJoin() {
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.JOIN } });
        }
        static broadcastDestructible(d) {
            let translation = d.node.mtxWorld.translation;
            let translationToSend = { x: translation.x, y: translation.y, z: translation.z };
            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, content: { command: MessageCommand.DESTRUCT, data: translationToSend } });
        }
        static messageHandler(_event) {
            if (_event instanceof MessageEvent) {
                let message = JSON.parse(_event.data);
                if (message.command === ƒNet.COMMAND.UNDEFINED) {
                    if (message.idSource == this.client.id)
                        return;
                    if (message.content.command === MessageCommand.SYNC) {
                        this.applyUpdate(message.content.data);
                    }
                    else if (message.content.command === MessageCommand.CREATE) {
                        this.createObject(message.content.data);
                    }
                    else if (message.content.command === MessageCommand.DESTROY) {
                        this.destroyObject(message.content.data);
                    }
                    else if (message.content.command === MessageCommand.JOIN) {
                        for (let element of this.#ownElementsToSync.values()) {
                            let creationData = element.creationData();
                            this.client.dispatch({ command: ƒNet.COMMAND.UNDEFINED, route: ƒNet.ROUTE.VIA_SERVER, idTarget: message.idSource, content: { command: MessageCommand.CREATE, data: creationData } });
                        }
                    }
                    else if (message.content.command === MessageCommand.DESTRUCT) {
                        let newPosData = message.content.data;
                        let posV = new ƒ.Vector3(newPosData.x, newPosData.y, newPosData.z);
                        for (let d of Script.Destructible.destrcutibles) {
                            if (d.node.mtxWorld.translation.equals(posV, 0.6)) {
                                d.destroy(true);
                                return;
                            }
                        }
                    }
                }
            }
            else {
                console.warn("unexpected event", _event);
            }
            for (let id in this.client.clientsInfoFromServer) {
                delete this.#otherClients[id];
            }
            for (let id in this.#otherClients) {
                for (let entityId of this.#otherElementsToSync.keys()) {
                    let ownerId = this.getOwnerIdFromId(entityId);
                    if (ownerId === id) {
                        this.destroyObject({ id: entityId });
                    }
                }
            }
            this.#otherClients = { ...this.client.clientsInfoFromServer };
        }
        static getOwnerIdFromId(_id) {
            return _id.split("+")[0];
        }
    }
    Script.MultiplayerManager = MultiplayerManager;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒNet = FudgeNet;
    class LobbyManager {
        static client;
        static rooms;
        static refreshInterval;
        static selectedRoom = "";
        static installListeners() {
            this.client.addEventListener(ƒNet.EVENT.MESSAGE_RECEIVED, this.messageHandler.bind(this));
            this.refreshRooms();
            this.refreshInterval = setInterval(this.refreshRooms, 5000);
            document.getElementById("lobby-host").addEventListener("click", this.hostRoom);
            document.getElementById("lobby-join").addEventListener("click", this.joinRoom);
            document.getElementById("game-lobby-cancel").addEventListener("click", this.leaveRoom);
        }
        static refreshRooms = () => {
            this.client.dispatch({ command: FudgeNet.COMMAND.ROOM_GET_IDS, route: FudgeNet.ROUTE.SERVER });
        };
        static messageHandler(_event) {
            if (_event instanceof MessageEvent) {
                let message = JSON.parse(_event.data);
                switch (message.command) {
                    case ƒNet.COMMAND.ROOM_GET_IDS:
                        this.rooms = message.content.rooms;
                        this.updateVisibleRooms();
                        break;
                    case ƒNet.COMMAND.ROOM_ENTER:
                    case ƒNet.COMMAND.SERVER_HEARTBEAT:
                        this.updateRoom();
                        break;
                    case ƒNet.COMMAND.UNDEFINED:
                        this.handleUndefined(message);
                        break;
                    // case ƒNet.COMMAND.ERROR:
                    // case ƒNet.COMMAND.ASSIGN_ID:
                    // case ƒNet.COMMAND.LOGIN_REQUEST:
                    // case ƒNet.COMMAND.LOGIN_RESPONSE:
                    // case ƒNet.COMMAND.SERVER_HEARTBEAT:
                    // case ƒNet.COMMAND.CLIENT_HEARTBEAT:
                    // case ƒNet.COMMAND.RTC_OFFER:
                    // case ƒNet.COMMAND.RTC_ANSWER:
                    // case ƒNet.COMMAND.ICE_CANDIDATE:
                    // case ƒNet.COMMAND.CREATE_MESH:
                    // case ƒNet.COMMAND.CONNECT_HOST:
                    // case ƒNet.COMMAND.CONNECT_PEERS:
                    // case ƒNet.COMMAND.DISCONNECT_PEERS:
                    // case ƒNet.COMMAND.ROOM_CREATE:
                }
            }
        }
        static updateVisibleRooms() {
            if (this.client.idRoom !== "Lobby")
                return;
            document.getElementById("client-id").innerText = this.client.id;
            document.getElementById("client-name").innerText = this.client.name;
            let listElement = document.getElementById("open-lobbies");
            let newChildren = [];
            if (Object.keys(this.rooms).length <= 1) {
                let span = document.createElement("span");
                span.innerText = "No games going on. Why don't you host yourself?";
                newChildren.push(span);
            }
            else {
                for (let room in this.rooms) {
                    if (room === "Lobby")
                        continue;
                    let li = document.createElement("li");
                    li.innerText = `${room} - ${this.rooms[room]} Players`;
                    li.dataset.room = room;
                    li.addEventListener("click", this.selectRoom);
                    li.classList.add("room");
                    if (room === this.selectedRoom)
                        li.classList.add("selected");
                    newChildren.push(li);
                }
            }
            listElement.replaceChildren(...newChildren);
        }
        static hostRoom = () => {
            this.client.dispatch({ command: FudgeNet.COMMAND.ROOM_CREATE, route: FudgeNet.ROUTE.SERVER });
        };
        static selectRoom = (_event) => {
            let target = _event.target;
            document.querySelectorAll("li.room").forEach(el => el.classList.remove("selected"));
            this.selectedRoom = target.dataset.room;
            target.classList.add("selected");
            document.getElementById("lobby-join").disabled = false;
        };
        static joinRoom = () => {
            document.getElementById("lobby-join").disabled = true;
            if (!this.selectedRoom)
                return;
            Script.client.dispatch({ command: FudgeNet.COMMAND.ROOM_ENTER, route: FudgeNet.ROUTE.SERVER, content: { room: this.selectedRoom } });
            this.selectedRoom = "";
        };
        static leaveRoom = () => {
            Script.client.dispatch({ command: FudgeNet.COMMAND.ROOM_ENTER, route: FudgeNet.ROUTE.SERVER, content: { room: "Lobby" } });
            this.selectedRoom = "";
        };
        static updateRoom = () => {
            if (this.client.idRoom === "Lobby")
                return;
            document.getElementById("game-lobby-id").innerText = `Room id: ${this.client.idRoom}`;
            let players = [];
            for (let client in this.client.clientsInfoFromServer) {
                let li = document.createElement("li");
                li.innerText = `${this.client.clientsInfoFromServer[client].name} (id: ${client}) ${client === this.client.id ? "(you)" : ""}`;
                players.push(li);
            }
            document.getElementById("connected-players").replaceChildren(...players);
        };
        static handleUndefined(_message) {
            switch (_message.content.command) {
                case "switchView":
                    Script.menuManager.showOverlay(_message.content.data);
                    break;
                case "selectBrawler":
                    Script.GameManager.Instance.selectBrawler(_message.content.data, _message.idSource);
                    break;
                case "startGame":
                    Script.GameManager.Instance.settings = _message.content.data.settings;
                    Script.GameManager.Instance.teams = _message.content.data.teams;
                    Script.GameManager.Instance.startGame();
                    break;
            }
        }
        static switchView(_view) {
            this.client.dispatch({ command: FudgeNet.COMMAND.UNDEFINED, route: FudgeNet.ROUTE.VIA_SERVER, content: { command: "switchView", data: _view } });
        }
        static selectBrawler(_brawler) {
            this.client.dispatch({ command: FudgeNet.COMMAND.UNDEFINED, route: FudgeNet.ROUTE.VIA_SERVER, content: { command: "selectBrawler", data: _brawler } });
        }
        static startGame() {
            this.client.dispatch({ command: FudgeNet.COMMAND.UNDEFINED, route: FudgeNet.ROUTE.VIA_SERVER, content: { command: "startGame", data: { settings: Script.GameManager.Instance.settings, teams: Script.GameManager.Instance.teams } } });
        }
    }
    Script.LobbyManager = LobbyManager;
})(Script || (Script = {}));
///<reference path="Managers/MenuManager.ts" />
///<reference path="Managers/InputManager.ts" />
///<reference path="Managers/EntityManager.ts" />
///<reference path="Managers/MultiplayerManager.ts" />
///<reference path="Managers/LobbyManager.ts" />
var Script;
///<reference path="Managers/MenuManager.ts" />
///<reference path="Managers/InputManager.ts" />
///<reference path="Managers/EntityManager.ts" />
///<reference path="Managers/MultiplayerManager.ts" />
///<reference path="Managers/LobbyManager.ts" />
(function (Script) {
    var ƒ = FudgeCore;
    var ƒNet = FudgeNet;
    document.addEventListener("interactiveViewportStarted", start);
    Script.menuManager = new Script.MenuManager();
    Script.inputManager = new Script.InputManager();
    Script.client = initClient();
    Script.MultiplayerManager.client = Script.client;
    Script.LobbyManager.client = Script.client;
    document.addEventListener("DOMContentLoaded", preStart);
    function preStart() {
        Script.MultiplayerManager.installListeners();
        Script.LobbyManager.installListeners();
    }
    function start(_event) {
        Script.viewport = _event.detail;
        // viewport.physicsDebugMode = ƒ.PHYSICS_DEBUGMODE.COLLIDERS;
        Script.viewport.addEventListener("renderEnd" /* ƒ.EVENT.RENDER_END */, drawAttackPreviews);
        ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, update);
        // ƒ.Loop.start();  // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
    }
    function update(_event) {
        ƒ.Physics.simulate(); // if physics is included and used
        Script.viewport.draw();
        ƒ.AudioManager.default.update();
    }
    async function startViewport() {
        // document.getElementById("start").removeEventListener("click", startViewport);
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
    function initClient() {
        const client = new ƒNet.FudgeClient();
        let serverURL = "wss://motivationline.plagiatus.net/brawler/";
        if (window.location.hostname.startsWith("localhost") || window.location.hostname.startsWith("127.0.0.1")) {
            serverURL = "ws://localhost:8000";
        }
        client.connectToServer(serverURL);
        return client;
    }
    /** Draw the attack previews after all other rendering with disabled depth test */
    function drawAttackPreviews() {
        if (Script.ComponentAttack.activePreviews.size == 0)
            return;
        ƒ.Render.setDepthTest(false);
        for (const previewNode of Script.ComponentAttack.activePreviews) {
            previewNode.activate(true);
            ƒ.Render.prepare(previewNode, { ignorePhysics: true }, previewNode.getParent().mtxWorld);
            ƒ.Render.draw(Script.viewport.camera);
            previewNode.activate(false);
        }
        ƒ.Render.setDepthTest(true);
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
        durationDamage = 1;
        durationVisual = 1;
        areaVisible = true;
        #rb;
        #damagables = [];
        #owner;
        #circle;
        #endTimeDamage;
        #endTimeVisual;
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
            this.#endTimeDamage = ƒ.Time.game.get() + this.durationDamage * 1000;
            this.#endTimeVisual = ƒ.Time.game.get() + this.durationVisual * 1000;
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
            if (this.#owner === Script.EntityManager.Instance.playerBrawler) {
                for (let pair of this.#damagables) {
                    if (pair.nextDamage <= currentTime && pair.amtTicks < this.maxTicksPerEnemy) {
                        pair.target.dealDamage(this.damage, true);
                        this.#owner.dealDamageToOthers(this.damage);
                        pair.nextDamage = currentTime + this.delayBetweenTicksInMS;
                        pair.amtTicks++;
                    }
                }
            }
            if (this.#endTimeDamage < currentTime) {
                this.#circle.activate(false);
                this.#rb.activate(false);
            }
            if (this.#endTimeVisual < currentTime) {
                for (let child of this.node.getChildren()) {
                    child.activate(false);
                }
            }
            if (this.#endTimeDamage < currentTime && this.#endTimeVisual < currentTime) {
                this.node.getParent()?.removeChild(this.node);
                ƒ.Loop.removeEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.loop);
            }
        };
        onTriggerEnter = (_event) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody)
                return;
            if (this.#owner !== Script.EntityManager.Instance.playerBrawler)
                return; // don't do anything if owner isn't own brawler
            // team check
            let otherBrawler = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.ComponentBrawler);
            if (otherBrawler) {
                let otherPlayer = Script.GameManager.Instance.getPlayer(Script.MultiplayerManager.getOwnerIdFromId(otherBrawler.id));
                let owner = Script.GameManager.Instance.getPlayer(Script.MultiplayerManager.getOwnerIdFromId(Script.EntityManager.Instance.playerBrawler.ownerId));
                if (otherPlayer && owner && otherPlayer.id !== owner.id && otherPlayer.team === owner.team)
                    return;
            }
            // check if damagable
            let damagable = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Damagable);
            if (damagable) {
                let amtTicks = 0;
                if (this.delayBeforeFirstTickInMS === 0) {
                    damagable.dealDamage(this.damage, true);
                    this.#owner.dealDamageToOthers(this.damage);
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
                durationDamage: this.durationDamage,
                durationVisual: this.durationVisual,
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
            if (_serialization.durationDamage !== undefined)
                this.durationDamage = _serialization.durationDamage;
            if (_serialization.durationVisual !== undefined)
                this.durationVisual = _serialization.durationVisual;
            if (_serialization.areaVisible !== undefined)
                this.areaVisible = _serialization.areaVisible;
            return this;
        }
    }
    Script.ComponentAOE = ComponentAOE;
})(Script || (Script = {}));
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
    let ChargeType;
    (function (ChargeType) {
        ChargeType[ChargeType["PASSIVE"] = 0] = "PASSIVE";
        ChargeType[ChargeType["DAMAGE_DEALT"] = 1] = "DAMAGE_DEALT";
        ChargeType[ChargeType["DAMAGE_RECEIVED"] = 2] = "DAMAGE_RECEIVED";
    })(ChargeType = Script.ChargeType || (Script.ChargeType = {}));
    class ComponentAttack extends ƒ.Component {
        static activePreviews = new Set();
        previewType = AttackPreviewType.LINE;
        previewWidth = 1;
        range = 5;
        attackType = AttackType.MAIN;
        maxCharges = 3;
        damage = 100;
        minDelayBetweenAttacks = 0.3;
        energyGenerationPerSecond = 0;
        energyNeededPerCharge = 1;
        energyGeneratedPerDamageDealt = 0;
        energyGeneratedPerDamageReceived = 0;
        castingTime = 0;
        lockBrawlerForAnimationTime = false;
        lockTime = 0;
        recoil = 0;
        invulerableTime = 0;
        effect = "";
        effectDelay = 0;
        singleton = false;
        maxEnergy = 0;
        currentEnergy = 0;
        nextAttackAllowedAt = -1;
        #attackBars = [];
        #attackBarColor;
        #previewNode;
        #previewActive = false;
        #previewMaterial;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, () => {
                this.node.addEventListener("graphInstantiated" /* ƒ.EVENT.GRAPH_INSTANTIATED */, this.initAttack, true);
            });
        }
        showPreview() {
            this.#previewActive = true;
            ComponentAttack.activePreviews.add(this.#previewNode);
        }
        hidePreview() {
            this.#previewActive = false;
            ComponentAttack.activePreviews.delete(this.#previewNode);
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
            if (!this.#previewMaterial)
                return;
            let { g } = this.#previewMaterial.clrPrimary;
            let charges = Math.floor(this.currentEnergy / this.energyNeededPerCharge);
            if (charges < 1 && g === 1) {
                // can't attack
                this.#previewMaterial.clrPrimary.g = 0;
                this.#previewMaterial.clrPrimary.b = 0;
            }
            else if (charges >= 1 && g !== 1) {
                // can attack
                this.#previewMaterial.clrPrimary.g = 1;
                this.#previewMaterial.clrPrimary.b = 1;
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
            this.#previewMaterial = mat;
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
            this.#previewNode.activate(false);
            this.node.addChild(this.#previewNode);
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
            ƒ.Time.game.setTimer(this.castingTime * 1000, 1, this.executeRecoil, _direction);
            ƒ.Time.game.setTimer(this.effectDelay * 1000, 1, this.executeEffect, _direction);
            let brawlerComp = this.node.getAllComponents().find(c => c instanceof Script.ComponentBrawler);
            if (this.invulerableTime)
                brawlerComp.makeInvulnerableFor(this.invulerableTime * 1000);
            return true;
        }
        executeAttack = (_event) => {
        };
        executeRecoil = (_event) => {
            let direction = _event.arguments[0];
            let brawlerComp = this.node.getAllComponents().find(c => c instanceof Script.ComponentBrawler);
            if (this.recoil !== 0) {
                let recoil = new ƒ.Vector3(-direction.x, 0, -direction.z).normalize(this.recoil);
                brawlerComp.addVelocity(recoil, 0.25);
            }
        };
        executeEffect = async (_event) => {
            if (!this.effect)
                return;
            let direction = _event.arguments[0];
            if (!direction)
                return;
            let obj = ƒ.Project.getResourcesByName(this.effect)[0];
            if (!obj)
                return;
            let instance = await ƒ.Project.createGraphInstance(obj);
            this.node.addChild(instance);
            let comp = instance.getAllComponents().find(c => c instanceof Script.ComponentEffect);
            ;
            comp.setup(direction);
        };
        update() {
            let charges = Math.floor(this.currentEnergy / this.energyNeededPerCharge);
            if (charges < this.maxCharges) {
                let deltaTime = ƒ.Loop.timeFrameGame / 1000;
                let energyCharge = deltaTime * this.energyGenerationPerSecond;
                this.charge(energyCharge, ChargeType.PASSIVE);
            }
        }
        charge(_amt, type) {
            if (!isFinite(_amt))
                return;
            switch (type) {
                case ChargeType.PASSIVE: {
                    this.currentEnergy += _amt;
                    break;
                }
                case ChargeType.DAMAGE_DEALT: {
                    this.currentEnergy += _amt * this.energyGeneratedPerDamageDealt;
                    break;
                }
                case ChargeType.DAMAGE_RECEIVED: {
                    this.currentEnergy += _amt * this.energyGeneratedPerDamageReceived;
                    break;
                }
            }
            this.currentEnergy = Math.min(this.currentEnergy, this.maxEnergy);
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
                energyGeneratedPerDamageDealt: this.energyGeneratedPerDamageDealt,
                energyGeneratedPerDamageReceived: this.energyGeneratedPerDamageReceived,
                energyNeededPerCharge: this.energyNeededPerCharge,
                castingTime: this.castingTime,
                lockBrawlerForAnimationTime: this.lockBrawlerForAnimationTime,
                lockTime: this.lockTime,
                recoil: this.recoil,
                invulerableTime: this.invulerableTime,
                effect: this.effect,
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
            if (_serialization.energyGeneratedPerDamageDealt !== undefined)
                this.energyGeneratedPerDamageDealt = _serialization.energyGeneratedPerDamageDealt;
            if (_serialization.energyGeneratedPerDamageReceived !== undefined)
                this.energyGeneratedPerDamageReceived = _serialization.energyGeneratedPerDamageReceived;
            if (_serialization.castingTime !== undefined)
                this.castingTime = _serialization.castingTime;
            if (_serialization.lockBrawlerForAnimationTime !== undefined)
                this.lockBrawlerForAnimationTime = _serialization.lockBrawlerForAnimationTime;
            if (_serialization.lockTime !== undefined)
                this.lockTime = _serialization.lockTime;
            if (_serialization.recoil !== undefined)
                this.recoil = _serialization.recoil;
            if (_serialization.invulerableTime !== undefined)
                this.invulerableTime = _serialization.invulerableTime;
            if (_serialization.effect !== undefined)
                this.effect = _serialization.effect;
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
/// <reference path="ComponentAttack.ts"/>
var Script;
/// <reference path="ComponentAttack.ts"/>
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentAOEAttack extends Script.ComponentAttack {
        offset = ƒ.Vector3.ZERO();
        aoeGraph = "";
        executeAttack = async (_event) => {
            let direction = _event.arguments[0];
            this.spawnAOE(direction);
        };
        async spawnAOE(direction) {
            if (!direction)
                return;
            if (!this.aoeGraph)
                return;
            let aoe = ƒ.Project.getResourcesByName(this.aoeGraph)[0];
            let instance = await ƒ.Project.createGraphInstance(aoe);
            let compAOE = instance.getAllComponents().find(c => c instanceof Script.ComponentAOE);
            let owner = this.node.getAllComponents().find(c => c instanceof Script.ComponentBrawler);
            let angle = ƒ.Vector3.ANGLE(new ƒ.Vector3(direction.x, 0, direction.z), ƒ.Vector3.Z());
            angle *= Math.PI / 180 * Math.sign(direction.x);
            // see https://stackoverflow.com/questions/14607640/rotating-a-vector-in-3d-space
            let rotatedOffset = new ƒ.Vector3(this.offset.x * Math.cos(angle) + this.offset.z * Math.sin(angle), this.offset.y, -this.offset.x * Math.sin(angle) + this.offset.z * Math.cos(angle));
            if (compAOE.attachedToBrawler) {
                this.node.addChild(instance);
                compAOE.setup(owner, rotatedOffset);
            }
            else {
                this.node.getParent().addChild(instance);
                compAOE.setup(owner, ƒ.Vector3.SUM(this.node.mtxLocal.translation, rotatedOffset));
            }
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                aoeGraph: this.aoeGraph,
                offset: this.offset.serialize(),
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.aoeGraph !== undefined)
                this.aoeGraph = _serialization.aoeGraph;
            if (_serialization.offset !== undefined)
                this.offset.deserialize(_serialization.offset);
            return this;
        }
    }
    Script.ComponentAOEAttack = ComponentAOEAttack;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentProjectile extends Script.ServerSync {
        gravity = false;
        rotateInDirection = true;
        damage = 100;
        speed = 10;
        range = 3;
        destructive = false;
        impactAOE = "";
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
        removeEventListeners() {
            this.removeEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.init);
            ƒ.Loop.removeEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.loop);
            this.#rb.removeEventListener("TriggerEnteredCollision" /* ƒ.EVENT_PHYSICS.TRIGGER_ENTER */, this.onTriggerEnter);
            this.node.removeEventListener("graphInstantiated" /* ƒ.EVENT.GRAPH_INSTANTIATED */, this.initShadow, true);
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
            this.setupId();
        }
        onTriggerEnter = (_event) => {
            if (_event.cmpRigidbody === this.#owner.rigidbody)
                return; // don't hit owner
            if (this.gravity && this.#rb.getVelocity().y > 0)
                return; // don't hit anything while going up
            if (this.#owner !== Script.EntityManager.Instance.playerBrawler)
                return; // don't do anything if owner isn't own brawler
            // team check
            let otherBrawler = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.ComponentBrawler);
            if (otherBrawler) {
                let otherPlayer = Script.GameManager.Instance.getPlayer(Script.MultiplayerManager.getOwnerIdFromId(otherBrawler.id));
                let owner = Script.GameManager.Instance.getPlayer(Script.MultiplayerManager.getOwnerIdFromId(Script.EntityManager.Instance.playerBrawler.ownerId));
                if (otherPlayer && owner && otherPlayer.id !== owner.id && otherPlayer.team === owner.team)
                    return;
            }
            // check if target has disable script
            let noProjectile = _event.cmpRigidbody.node.getComponent(Script.IgnoredByProjectiles);
            if (noProjectile && noProjectile.isActive)
                return;
            // check for damagable target
            let damagable = _event.cmpRigidbody.node.getAllComponents().find(c => c instanceof Script.Damagable);
            if (damagable) {
                damagable.dealDamage(this.damage, true);
                this.#owner.dealDamageToOthers(this.damage);
            }
            // check for destructible target
            if (this.destructive) {
                _event.cmpRigidbody.node.dispatchEvent(new CustomEvent("destruction", { bubbles: true }));
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
            this.removeEventListeners();
            if (this.#owner === Script.EntityManager.Instance.playerBrawler) {
                Script.MultiplayerManager.updateOne({ type: "explosion", data: this.getInfo() }, this.id);
            }
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
        creationData() {
            let initData = this.getInfo();
            return {
                id: this.id,
                initData,
                resourceName: this.node.name,
            };
        }
        getInfo() {
            let info = super.getInfo();
            info.owner = this.#owner.id;
            info.velo = {
                x: this.#rb.getVelocity().x,
                y: this.#rb.getVelocity().y,
                z: this.#rb.getVelocity().z,
            };
            info.gravity = this.gravity;
            return info;
        }
        applyData(_data) {
            if (_data.type) {
                switch (_data.type) {
                    case "explosion": {
                        super.applyData(_data.data);
                        this.#rb.setVelocity(new ƒ.Vector3(_data.data.velo.x, _data.data.velo.y, _data.data.velo.z));
                        let owner = Script.EntityManager.Instance.brawlers.find(b => b.id === _data.data.owner);
                        this.#owner = owner;
                        this.explode();
                        break;
                    }
                }
                return;
            }
            super.applyData(_data);
            this.#rb.setVelocity(new ƒ.Vector3(_data.velo.x, _data.velo.y, _data.velo.z));
            let owner = Script.EntityManager.Instance.brawlers.find(b => b.id === _data.owner);
            this.#owner = owner;
            this.gravity = _data.gravity;
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
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                speed: this.speed,
                range: this.range,
                rotateInDirection: this.rotateInDirection,
                attachedToBrawler: this.attachedToBrawler,
                projectile: this.projectile,
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
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class SpiderSpecialAttack extends Script.ComponentAOEAttack {
        moveColliderUpBy = 1;
        moveColliderUpForSeconds = 1;
        aoeDelay = 0;
        serialize() {
            let s = {
                [super.constructor.name]: super.serialize(),
                moveColliderUpBy: this.moveColliderUpBy,
                aoeDelay: this.aoeDelay,
            };
            return s;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] !== null) {
                await super.deserialize(_serialization[super.constructor.name]);
            }
            if (_serialization.moveColliderUpBy !== undefined)
                this.moveColliderUpBy = _serialization.moveColliderUpBy;
            if (_serialization.aoeDelay !== undefined)
                this.aoeDelay = _serialization.aoeDelay;
            return this;
        }
        executeAttack = async (_event) => {
            let direction = _event.arguments[0];
            ƒ.Time.game.setTimer(this.aoeDelay * 1000, 1, () => { this.spawnAOE(direction); });
            let rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
            rigidbody.activate(false);
            rigidbody.mtxPivot.translateY(this.moveColliderUpBy);
            rigidbody.activate(true);
            ƒ.Time.game.setTimer(this.moveColliderUpForSeconds * 1000, 1, () => {
                rigidbody.activate(false);
                rigidbody.mtxPivot.translateY(-this.moveColliderUpBy);
                rigidbody.activate(true);
            });
        };
    }
    Script.SpiderSpecialAttack = SpiderSpecialAttack;
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
        mousePosition = ƒ.Vector2.ZERO();
        animationIdleName = "";
        animationWalkName = "";
        animationAttackName = "";
        animationSpecialName = "";
        #invulnerable = false;
        #velocityOverrides = [];
        #playerMovementLockedUntil = -1;
        #dead = false;
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
            _options = { ...{ lockAndSwitchToIdleAfter: false, playFromStart: false, lockMovement: false, lockTime: 0 }, ..._options };
            if (_name === this.#currentlyActiveAnimation.name && !_options.lockAndSwitchToIdleAfter)
                return;
            if (this.#currentlyActiveAnimation.lock && !_options.lockAndSwitchToIdleAfter)
                return;
            Script.MultiplayerManager.updateOne({ type: "animation", name: _name, options: _options }, this.id);
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
            let newLockTime = _options.lockTime * 1000;
            if (_options.lockMovement)
                newLockTime = this.#animations.get(_name).totalTime;
            if (newLockTime > 0)
                this.lockPlayerFor(newLockTime);
        }
        findAttacks() {
            let components = this.node.getAllComponents();
            this.attackMain = components.find(c => c instanceof Script.ComponentAttack && c.attackType === Script.AttackType.MAIN);
            this.attackSpecial = components.find(c => c instanceof Script.ComponentAttack && c.attackType === Script.AttackType.SPECIAL);
            if (!this.attackMain || !this.attackSpecial)
                console.error(`${this.node.name} doesn't have a main and a special attack attached.`);
        }
        setMovement(_direction) {
            this.direction.copy(_direction);
            this.syncSelf();
        }
        getDirection() {
            return this.direction;
        }
        update() {
            if (this.#dead)
                return;
            if (!this.rigidbody)
                return;
            if (!this.rigidbody.isActive)
                this.rigidbody.activate(true);
            this.move();
            if (Script.EntityManager.Instance.playerBrawler === this) {
                let mouseWorldPosition = Script.InputManager.mousePositionToWorldPlanePosition(this.mousePosition);
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
        move() {
            let now = ƒ.Time.game.get();
            let combinedVelocity = ƒ.Recycler.get(ƒ.Vector3);
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
            ƒ.Recycler.store(combinedVelocity);
        }
        dealDamage(_amt, _broadcast) {
            if (!this.#invulnerable) {
                super.dealDamage(_amt, _broadcast);
                this.attackMain?.charge(_amt, Script.ChargeType.DAMAGE_RECEIVED);
                this.attackSpecial?.charge(_amt, Script.ChargeType.DAMAGE_RECEIVED);
            }
        }
        attack(_atk, _direction) {
            if (this.#currentlyActiveAnimation.lock)
                return;
            switch (_atk) {
                case ATTACK_TYPE.MAIN:
                    if (this.attackMain.attack(_direction)) {
                        let options = { lockAndSwitchToIdleAfter: true, playFromStart: true, lockMovement: this.attackMain.lockBrawlerForAnimationTime, lockTime: this.attackMain.lockTime };
                        this.playAnimation("attack", options);
                        Script.MultiplayerManager.updateOne({ type: "animation", name: "attack", options, direction: JSON.parse(JSON.stringify(_direction)) }, this.id);
                    }
                    break;
                case ATTACK_TYPE.SPECIAL:
                    if (this.attackSpecial.attack(_direction)) {
                        let options = { lockAndSwitchToIdleAfter: true, playFromStart: true, lockMovement: this.attackSpecial.lockBrawlerForAnimationTime, lockTime: this.attackSpecial.lockTime };
                        this.playAnimation("special", options);
                        Script.MultiplayerManager.updateOne({ type: "animation", name: "special", options, direction: JSON.parse(JSON.stringify(_direction)) }, this.id);
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
            this.syncSelf();
        }
        lockPlayerFor(_time) {
            this.#playerMovementLockedUntil = Math.max(ƒ.Time.game.get() + _time, this.#playerMovementLockedUntil);
        }
        #invulUntil;
        makeInvulnerableFor(_timeInMS) {
            this.#invulnerable = true;
            this.#invulUntil = Math.max(this.#invulUntil, ƒ.Time.game.get() + _timeInMS);
        }
        dealDamageToOthers(_amt) {
            this.attackMain?.charge(_amt, Script.ChargeType.DAMAGE_DEALT);
            this.attackSpecial?.charge(_amt, Script.ChargeType.DAMAGE_DEALT);
        }
        death() {
            if (this.#dead)
                return;
            this.#dead = true;
            Script.GameManager.Instance.playerDied(this);
            this.node.activate(false);
            // document.getElementById(MultiplayerManager.getOwnerIdFromId(this.id))?.classList.add("dead");
        }
        respawn(_position) {
            this.node.mtxLocal.translate(ƒ.Vector3.DIFFERENCE(_position, this.node.mtxWorld.translation));
            this.node.activate(true);
            this.health = Infinity;
            this.#dead = false;
            // document.getElementById(MultiplayerManager.getOwnerIdFromId(this.id))?.classList.remove("dead");
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
        creationData() {
            return {
                id: this.id,
                initData: this.getInfo(),
                resourceName: this.node.name,
            };
        }
        getInfo() {
            let info = super.getInfo();
            info.direction = {
                x: this.direction.x,
                y: this.direction.y,
                z: this.direction.z,
            };
            info.velOverride = [];
            this.#velocityOverrides.forEach(value => {
                info.velOverride.push({ until: value.until, velocity: { x: value.velocity.x, y: value.velocity.y, z: value.velocity.z } });
            });
            info.active = this.node.isActive;
            info.dead = this.#dead;
            return info;
        }
        applyData(data) {
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
            data.velOverride.forEach((value) => {
                this.#velocityOverrides.push({
                    until: value.until,
                    velocity: new ƒ.Vector3(value.velocity.x, value.velocity.y, value.velocity.z),
                });
            });
            if (this.node.isActive !== data.active) {
                this.node.activate(data.active);
            }
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
    class DummyBrawler extends Script.ComponentBrawler {
        respawnTime = 5;
        walkRandom = false;
        #respawnPos = new ƒ.Vector3();
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.update.bind(this));
            // this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, ()=>{
            //     let rigidbody = this.node.getComponent(ƒ.ComponentRigidbody);
            //     rigidbody.addEventListener(ƒ.EVENT_PHYSICS.COLLISION_ENTER, this.changeDirection);
            // })
        }
        death() {
            this.#respawnPos.copy(this.node.mtxLocal.translation);
            ƒ.Time.game.setTimer(this.respawnTime * 1000, 1, () => {
                this.respawn();
            });
            this.node.activate(false);
        }
        respawn() {
            super.respawn(this.#respawnPos);
        }
        changeDirection = () => {
            // this.setMovement(new ƒ.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
        };
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                respawnTime: this.respawnTime,
                walkRandom: this.walkRandom,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null) {
                await super.deserialize(_serialization[super.constructor.name]);
            }
            if (_serialization.respawnTime !== undefined) {
                this.respawnTime = _serialization.respawnTime;
            }
            if (_serialization.walkRandom !== undefined) {
                this.walkRandom = _serialization.walkRandom;
            }
            return this;
        }
        update() {
            if (this.walkRandom && this.direction.magnitudeSquared === 0) {
                this.changeDirection();
            }
            super.update();
        }
    }
    Script.DummyBrawler = DummyBrawler;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    let RESPAWN_TYPE;
    (function (RESPAWN_TYPE) {
        RESPAWN_TYPE[RESPAWN_TYPE["AT_FIXED_RESPAWN_POINT"] = 0] = "AT_FIXED_RESPAWN_POINT";
        RESPAWN_TYPE[RESPAWN_TYPE["AT_RANDOM_RESPAWN_POINT"] = 1] = "AT_RANDOM_RESPAWN_POINT";
        RESPAWN_TYPE[RESPAWN_TYPE["AT_DEATH_LOCATION"] = 2] = "AT_DEATH_LOCATION";
        RESPAWN_TYPE[RESPAWN_TYPE["AT_TEAMMATE_LOCATION"] = 3] = "AT_TEAMMATE_LOCATION";
    })(RESPAWN_TYPE = Script.RESPAWN_TYPE || (Script.RESPAWN_TYPE = {}));
    class GameManager {
        static Instance = new GameManager();
        teams;
        settings;
        gameActive = false;
        #allSpawnPoints = [];
        defaultSettings = {
            amtRounds: 1,
            maxRespawnsPerRoundAndPlayer: 3,
            maxRespawnsPerRoundAndTeam: -1,
            respawnTime: 3,
            respawnType: [RESPAWN_TYPE.AT_TEAMMATE_LOCATION, RESPAWN_TYPE.AT_FIXED_RESPAWN_POINT, RESPAWN_TYPE.AT_DEATH_LOCATION],
            timer: 120,
            arena: "TrainingMap"
        };
        constructor() {
            if (GameManager.Instance)
                return GameManager.Instance;
        }
        init(_teams, _settings, _gameActive = false) {
            if (this.gameActive)
                throw new Error("Game is already in progress");
            this.gameActive = _gameActive;
            this.settings = { ...this.defaultSettings, ..._settings };
            this.teams = _teams;
        }
        async startGame() {
            await this.startRound();
            ƒ.Loop.start();
            this.gameActive = true;
            Script.menuManager.showOverlay(Script.MENU_TYPE.GAME_OVERLAY);
            // ƒ.Time.game.setScale(0.2);
            if (this.timerId !== undefined)
                ƒ.Time.game.deleteTimer(this.timerId);
            this.timerId = ƒ.Time.game.setTimer(1000, 0, () => {
                this.remainingTime--;
                this.timeDiv.innerText = `${Math.floor(this.remainingTime / 60)} : ${Math.floor(this.remainingTime % 60)}`;
            });
        }
        timerId;
        timeDiv;
        remainingTime = 0;
        async startRound() {
            let gameOverElement = document.getElementById("game-over-wrapper");
            gameOverElement.parentElement.classList.add("hidden");
            this.timeDiv = document.getElementById("game-time");
            let graph = ƒ.Project.getResourcesByName(this.settings.arena)[0];
            Script.viewport.setBranch(graph);
            let em = new Script.EntityManager();
            let entityNode = graph.getChildrenByName("Terrain")[0].getChildrenByName("Entities")[0];
            entityNode.removeAllChildren();
            entityNode.addComponent(em);
            this.initSpawnPoints();
            this.remainingTime = this.settings.timer;
            let teamDisplays = [document.getElementById("game-team-1"), document.getElementById("game-team-2")];
            teamDisplays.forEach(td => td.innerHTML = "");
            let scores = [];
            for (let team of this.teams) {
                team.remainingRespawns = this.settings.maxRespawnsPerRoundAndTeam;
                if (team.remainingRespawns < 0)
                    team.remainingRespawns = Infinity;
                for (let player of team.players) {
                    player.remainingRespawns = this.settings.maxRespawnsPerRoundAndPlayer;
                    if (player.remainingRespawns < 0)
                        player.remainingRespawns = Infinity;
                    let imgSrc = document.getElementById("brawler").querySelector(`button[data-brawler="${player.chosenBrawler}"] img`).src;
                    teamDisplays[player.team % teamDisplays.length].innerHTML += `<div class="brawler-display" id="${player.id}"><img src="${imgSrc}"></div>`;
                }
                scores.push(team.wonRounds ?? 0);
            }
            document.getElementById("game-score").innerText = scores.join(" : ");
            await Script.EntityManager.Instance.loadBrawler(this.getPlayer(Script.LobbyManager.client.id));
        }
        selectBrawler(_brawler, _player) {
            let totalPlayers = 0;
            let totalSelected = 0;
            if (!this.teams)
                return;
            for (let team of this.teams) {
                for (let player of team.players) {
                    totalPlayers++;
                    if (player.id === _player) {
                        player.chosenBrawler = _brawler;
                    }
                    if (player.chosenBrawler) {
                        totalSelected++;
                    }
                }
            }
            document.getElementById("brawler-ready-text").innerText = `${totalSelected} / ${totalPlayers} players selected a brawler`;
            if (totalPlayers === totalSelected) {
                document.getElementById("start_game").disabled = false;
            }
        }
        getPlayer(_playerID) {
            if (!this.teams)
                return undefined;
            for (let team of this.teams) {
                for (let p of team.players) {
                    if (p.id === _playerID)
                        return p;
                }
            }
            return undefined;
        }
        getChosenBrawlerOfPlayer(_player) {
            return this.getPlayer(_player)?.chosenBrawler ?? "Brawler";
        }
        playerDied(cp) {
            let ownerId = Script.MultiplayerManager.getOwnerIdFromId(cp.id);
            let player = this.getPlayer(ownerId);
            player.remainingRespawns--;
            let team = this.getTeamOfPlayer(player);
            team.remainingRespawns--;
            if (player.remainingRespawns <= 0 || team.remainingRespawns <= 0) {
                // player was eliminated
                if (ownerId == Script.MultiplayerManager.client.id) {
                    let gameOverElement = document.getElementById("game-over-wrapper");
                    gameOverElement.parentElement.classList.remove("hidden");
                    gameOverElement.innerText = "ELIMINATED";
                }
                let roundWinner = this.getRoundWinner();
                if (roundWinner) {
                    roundWinner.wonRounds = (roundWinner.wonRounds ?? 0) + 1;
                    let gameOverElement = document.getElementById("game-over-wrapper");
                    gameOverElement.parentElement.classList.remove("hidden");
                    gameOverElement.innerText = "ROUND OVER";
                    let gameWinner = this.getGameWinner();
                    if (gameWinner) {
                        if (gameWinner.players.find(p => p.brawler === Script.EntityManager.Instance.playerBrawler)) {
                            gameOverElement.innerText = "YOU WIN";
                        }
                        else {
                            gameOverElement.innerText = "YOU LOOSE";
                        }
                        setTimeout(() => { this.resetGame(); }, 3000);
                    }
                    else {
                        setTimeout(() => { this.startRound(); }, 3000);
                    }
                }
                // document.getElementById(ownerId)?.classList.remove("dead");
                // document.getElementById(ownerId)?.classList.add("eliminated");
                return;
            }
            ƒ.Time.game.setTimer(this.settings.respawnTime * 1000, 1, () => {
                this.respawnPlayer(player);
            });
        }
        getRoundWinner() {
            let winnerTeam;
            for (let team of this.teams) {
                if (isFinite(team.remainingRespawns) && team.remainingRespawns > 0) {
                    if (winnerTeam)
                        return undefined;
                    winnerTeam = team;
                    continue;
                }
                for (let player of team.players) {
                    if (isFinite(player.remainingRespawns) && player.remainingRespawns > 0) {
                        if (winnerTeam && winnerTeam !== team)
                            return undefined;
                        winnerTeam = team;
                        break;
                    }
                }
            }
            return winnerTeam;
        }
        getGameWinner() {
            let roundsNeededToWin = Math.ceil(this.settings.amtRounds / 2);
            for (let team of this.teams) {
                if (team.wonRounds >= roundsNeededToWin) {
                    return team;
                }
            }
            return undefined;
        }
        respawnPlayer(_player) {
            if (Script.MultiplayerManager.client.id !== Script.MultiplayerManager.getOwnerIdFromId(_player.id))
                return;
            let spawnPoint = this.getSpawnPointForPlayer(_player);
            _player.brawler.respawn(spawnPoint);
        }
        getTeamOfPlayer(_player) {
            return this.teams.find(t => t.players.includes(_player));
        }
        initSpawnPoints() {
            let spawnPointNodes = Script.EntityManager.Instance.node.getParent().getChildrenByName("Spawnpoints")[0].getChildren();
            for (let team of this.teams) {
                team.respawnPoints = [];
            }
            for (let node of spawnPointNodes) {
                let sp = node.getComponent(Script.SpawnPoint);
                if (!sp)
                    continue;
                if (this.teams.length > sp.team) {
                    this.teams[sp.team].respawnPoints.push(node);
                }
            }
            this.#allSpawnPoints = spawnPointNodes;
        }
        getSpawnPointForPlayer(_player) {
            let player;
            if (typeof _player === "string") {
                player = this.getPlayer(_player);
            }
            else {
                player = _player;
            }
            if (!player)
                return new ƒ.Vector3();
            for (let type of this.settings.respawnType) {
                switch (type) {
                    case RESPAWN_TYPE.AT_DEATH_LOCATION: {
                        return player.brawler.node.mtxLocal.translation.clone;
                    }
                    case RESPAWN_TYPE.AT_FIXED_RESPAWN_POINT: {
                        let rPoints = this.teams[player.team].respawnPoints;
                        if (!rPoints || rPoints.length === 0)
                            continue;
                        return rPoints[Math.floor(Math.random() * rPoints.length)].mtxLocal.translation.clone;
                    }
                    case RESPAWN_TYPE.AT_RANDOM_RESPAWN_POINT: {
                        let rPoints = this.#allSpawnPoints;
                        if (!rPoints || rPoints.length === 0)
                            continue;
                        return rPoints[Math.floor(Math.random() * rPoints.length)].mtxLocal.translation.clone;
                    }
                    case RESPAWN_TYPE.AT_TEAMMATE_LOCATION: {
                        let team = this.teams[player.team];
                        //TODO make sure not to select dead players
                        let otherPlayer = team.players.find((p) => p.id !== player.id);
                        if (!otherPlayer)
                            continue;
                        return otherPlayer.brawler?.node.mtxLocal.translation.clone;
                    }
                }
            }
            return new ƒ.Vector3();
        }
        resetGame() {
            let gameOverElement = document.getElementById("game-over-wrapper");
            gameOverElement.parentElement.classList.add("hidden");
            Script.menuManager.showOverlay(Script.MENU_TYPE.GAME_LOBBY);
            Script.viewport.setBranch(undefined);
            document.getElementById("brawler-ready-text").innerText = `waiting for players`;
            document.getElementById("start_game").disabled = true;
            document.getElementById("brawler").querySelectorAll("button").forEach(b => b.classList.remove("selected"));
            this.gameActive = false;
            ƒ.Loop.stop();
        }
    }
    Script.GameManager = GameManager;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class ComponentEffect extends ƒ.Component {
        duration = 1;
        offset = new ƒ.Vector3();
        offsetIsLocal = true;
        #endTime = Infinity;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.init);
            ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.loop);
        }
        init = () => {
            this.removeEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.init);
            if (!this.node.getComponent(ƒ.ComponentTransform))
                this.node.addComponent(new ƒ.ComponentTransform());
        };
        setup(_direction) {
            let angle = ƒ.Vector3.ANGLE(new ƒ.Vector3(_direction.x, 0, _direction.z), ƒ.Vector3.Z());
            angle *= Math.PI / 180 * Math.sign(_direction.x);
            let rotatedOffset = new ƒ.Vector3(this.offset.x * Math.cos(angle) + this.offset.z * Math.sin(angle), this.offset.y, -this.offset.x * Math.sin(angle) + this.offset.z * Math.cos(angle));
            this.node.mtxLocal.translate(this.offsetIsLocal ? rotatedOffset : this.offset);
            if (this.offsetIsLocal)
                this.node.mtxLocal.rotateY(angle * 180 / Math.PI);
            this.#endTime = ƒ.Time.game.get() + this.duration * 1000;
        }
        loop = () => {
            let currentTime = ƒ.Time.game.get();
            if (currentTime > this.#endTime) {
                ƒ.Loop.removeEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, this.loop);
                this.node.getParent()?.removeChild(this.node);
            }
        };
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                duration: this.duration,
                offset: this.offset.serialize(),
                offsetIsLocal: this.offsetIsLocal,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.duration !== undefined)
                this.duration = _serialization.duration;
            if (_serialization.offset !== undefined)
                this.offset.deserialize(_serialization.offset);
            if (_serialization.offsetIsLocal !== undefined)
                this.offsetIsLocal = _serialization.offsetIsLocal;
            return this;
        }
    }
    Script.ComponentEffect = ComponentEffect;
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
    class ComponentRandomRotation extends ƒ.Component {
        static iSubclass = ƒ.Component.registerSubclass(ComponentRandomRotation);
        rotationY = 5;
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
                    this.node.getChild(0).mtxLocal.rotateY(this.randomizeRotation(this.rotationY));
                    break;
            }
        };
        randomizeRotation(_number) {
            let rangeNumber = Math.random() * _number;
            let randNumber = Math.random();
            if (randNumber < 0.5) {
                return rangeNumber * -1;
            }
            else {
                return rangeNumber;
            }
        }
    }
    Script.ComponentRandomRotation = ComponentRandomRotation;
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
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    class SpawnPoint extends ƒ.Component {
        team = 0;
        constructor() {
            super();
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
        }
        serialize() {
            let serialization = {
                [super.constructor.name]: super.serialize(),
                team: this.team,
            };
            return serialization;
        }
        async deserialize(_serialization) {
            if (_serialization[super.constructor.name] != null)
                await super.deserialize(_serialization[super.constructor.name]);
            if (_serialization.team != null)
                this.team = _serialization.team;
            return this;
        }
    }
    Script.SpawnPoint = SpawnPoint;
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map