namespace Script {
    import ƒ = FudgeCore;
    export enum MENU_TYPE {
        NONE,
        START,
        LOADING,
        LOBBY,
        GAME_LOBBY,
        SELECTION,
        GAME_OVERLAY,
    }

    interface BrawlerInfo {
        name: string,
        stats: {
            damage: number,
            speed: number,
            range: number,
            health: number,
        },
        shake: "shakeX" | "shakeYUp" | "shakeYDown",
        img: string,
    }

    const brawlerInfo: Map<string, BrawlerInfo> = new Map<string, BrawlerInfo>(
        [
            ["BrawlerFrogger", { name: "Frogger", stats: { damage: 0.75, health: 0.75, range: 0.5, speed: 0.25 }, img: "UI/BrawlerPicking/Frogger.png" , shake: "shakeYUp" }],
            ["BrawlerBugsy", { name: "Bugsy", stats: { damage: 0.5, health: 0.25, range: 0.75, speed: 0.5 }, img: "UI/BrawlerPicking/Bugsy_2.png" , shake: "shakeX" }],
            ["BrawlerSpider", { name: "Spidey", stats: { damage: 0.75, health: 1, range: 0.25, speed: 0.5 }, img: "UI/BrawlerPicking/Spider.png" , shake: "shakeYDown" }],
            ["BrawlerSniper", { name: "Sniper", stats: { damage: 1, health: 0.25, range: 1, speed: 0.75 }, img: "UI/BrawlerPicking/Bunny.png" , shake: "shakeX" }],
        ]
    )

    export class MenuManager {
        overlays: Map<MENU_TYPE, HTMLElement> = new Map();

        constructor() {

            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            ƒ.Project.addEventListener(ƒ.EVENT.RESOURCES_LOADED, this.resourcesLoaded);
            document.addEventListener("DOMContentLoaded", () => {
                this.overlays.set(MENU_TYPE.START, document.getElementById("start-overlay"));
                this.overlays.set(MENU_TYPE.LOADING, document.getElementById("loading-overlay"));
                this.overlays.set(MENU_TYPE.LOBBY, document.getElementById("lobby-overlay"));
                this.overlays.set(MENU_TYPE.GAME_LOBBY, document.getElementById("game-lobby-overlay"));
                this.overlays.set(MENU_TYPE.SELECTION, document.getElementById("selection-overlay"));
                this.overlays.set(MENU_TYPE.GAME_OVERLAY, document.getElementById("game-overlay"));

                document.getElementById("start").addEventListener("click", () => {
                    this.showOverlay(MENU_TYPE.LOADING)
                    startViewport();
                });
                document.getElementById("brawler").querySelectorAll("button").forEach((button) => {
                    button.addEventListener("click", async () => {
                        document.getElementById("brawler").querySelectorAll("button").forEach((button) => button.classList.remove("selected"));
                        button.classList.add("selected");
                        // GameManager.Instance.selectBrawler(button.dataset.brawler, LobbyManager.client.id);
                        this.selectBrawler(button);
                    });
                    // await GameManager.Instance.startGame();
                    // this.showOverlay(MENU_TYPE.NONE);
                });
                document.getElementById("lobby-host").addEventListener("click", () => {
                    this.showOverlay(MENU_TYPE.GAME_LOBBY);
                    document.getElementById("game-settings")!.classList.remove("hidden");
                    document.getElementById("game-lobby-start")!.hidden = false;
                    document.getElementById("start_game")!.hidden = false;
                    (<HTMLInputElement>document.getElementById("start_game")).disabled = true;
                    document.getElementById("lobby-client-settings")!.hidden = true;
                });
                document.getElementById("game-lobby-cancel").addEventListener("click", () => {
                    this.showOverlay(MENU_TYPE.LOBBY);
                });
                document.getElementById("game-lobby-start").addEventListener("click", () => {
                    let form = <HTMLFormElement>document.getElementById("game-settings");
                    form.querySelectorAll("select").forEach(el => {
                        if (el.disabled) el.dataset.disabled = "true";
                        el.disabled = false;
                    })
                    let data = new FormData(form);
                    form.querySelectorAll("select").forEach(el => {
                        if (el.dataset.disabled)
                            el.disabled = true;
                        el.dataset.disabled = "";
                    })

                    let respawnTypeSetting = data.get("setting-respawn");
                    let respawnType: RESPAWN_TYPE[] = [RESPAWN_TYPE.AT_DEATH_LOCATION];
                    switch (respawnTypeSetting) {
                        case "initial":
                            respawnType.unshift(RESPAWN_TYPE.AT_FIXED_RESPAWN_POINT);
                            break;
                        case "random":
                            respawnType.unshift(RESPAWN_TYPE.AT_RANDOM_RESPAWN_POINT);
                            break;
                        case "teammate":
                            respawnType.unshift(RESPAWN_TYPE.AT_TEAMMATE_LOCATION);
                            break;
                        case "death":
                        default:
                            respawnType.unshift(RESPAWN_TYPE.AT_DEATH_LOCATION);
                            break;
                    }

                    let selectedMap: HTMLOptionElement = document.getElementById("setting-map").querySelector(`option[value="${data.get("setting-map")}"]`);
                    let arena = selectedMap.dataset.arena;

                    let gameData: GameSettings = {
                        amtRounds: Number(data.get("setting-rounds")),
                        maxRespawnsPerRoundAndPlayer: Number(data.get("setting-lives")),
                        maxRespawnsPerRoundAndTeam: Number(data.get("setting-team-lives")),
                        respawnTime: Number(data.get("setting-respawn-timer")),
                        timer: Number(data.get("setting-timer")),
                        respawnType,
                        arena,
                    }

                    let teams: Team[] = [];
                    let playerIDs: string[] = Object.keys(LobbyManager.client.clientsInfoFromServer);
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
                    GameManager.Instance.init(teams, gameData);
                    LobbyManager.switchView(MENU_TYPE.SELECTION);
                    this.showOverlay(MENU_TYPE.SELECTION);
                });
                document.getElementById("setting-map").addEventListener("change", (_event) => {
                    let value: string = (<HTMLSelectElement>_event.target).value;
                    switch (value) {
                        case "training":
                            (<HTMLSelectElement>document.getElementById("setting-respawn")).disabled = true;
                            (<HTMLSelectElement>document.getElementById("setting-respawn")).value = "initial";
                            (<HTMLSelectElement>document.getElementById("setting-team")).disabled = true;
                            (<HTMLSelectElement>document.getElementById("setting-team")).value = "team";
                            break;
                        case "small":
                            (<HTMLSelectElement>document.getElementById("setting-respawn")).disabled = true;
                            (<HTMLSelectElement>document.getElementById("setting-respawn")).value = "initial";
                            (<HTMLSelectElement>document.getElementById("setting-team")).disabled = true;
                            (<HTMLSelectElement>document.getElementById("setting-team")).value = "team";
                            break;
                        case "large":
                            (<HTMLSelectElement>document.getElementById("setting-respawn")).disabled = false;
                            (<HTMLSelectElement>document.getElementById("setting-respawn")).value = "random";
                            (<HTMLSelectElement>document.getElementById("setting-team")).disabled = false;
                            (<HTMLSelectElement>document.getElementById("setting-team")).value = "ffa";
                            break;

                        default:
                            break;
                    }
                });

                document.getElementById("start_game").addEventListener("click", (_event) => {
                    LobbyManager.startGame();
                });

            });
        }

        resourcesLoaded = () => {
            console.log("resources loaded");
            this.showOverlay(MENU_TYPE.LOBBY);
        }

        joinRoom() {
            this.showOverlay(MENU_TYPE.GAME_LOBBY);
            document.getElementById("game-settings")!.classList.add("hidden");
            document.getElementById("game-lobby-start")!.hidden = true;
            document.getElementById("start_game")!.hidden = true;
            (<HTMLInputElement>document.getElementById("start_game")).disabled = true;
            document.getElementById("lobby-client-settings")!.hidden = false;
        }

        showOverlay(_type: MENU_TYPE) {
            if (!this.overlays.has(_type) && _type !== MENU_TYPE.NONE) return;
            this.overlays.forEach(overlay => {
                overlay.classList.add("hidden");
            });
            this.overlays.get(_type)?.classList.remove("hidden");
        }


        selectBrawler(_button: HTMLButtonElement) {
            LobbyManager.selectBrawler(_button.dataset.brawler);
            let brawler = brawlerInfo.get(_button.dataset.brawler);

            let img: HTMLImageElement = <HTMLImageElement>document.getElementById("selected-character-img");
            img.src = brawler.img;
            img.classList.remove("shakeX", "shakeYUp", "shakeYDown");
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    img.classList.add(brawler.shake);
                })
            })

            document.getElementById("selected-character-name").innerText = brawler.name;
            document.getElementById("selected-character-name").classList.add("selected");
            for (let stat in brawler.stats) {
                let element: HTMLDivElement = document.querySelector(`div.brawler-stat-preview[data-info="${stat}"]`);
                if (!element) continue;
                //@ts-ignore
                element.style.width = `${brawler.stats[stat] * 100}%`;
                //@ts-ignore
                element.style.backgroundColor = lerpColors([203, 140, 87], [53, 94, 49], brawler.stats[stat]);
            }

            function lerpColors(a: number[], b: number[], p: number) {
                let final = {
                    r: a[0] + (b[0] - a[0]) * p,
                    g: a[1] + (b[1] - a[1]) * p,
                    b: a[2] + (b[2] - a[2]) * p,
                }
                return `rgb(${final.r}, ${final.g}, ${final.b})`;
            }
        }
    }

    interface TeamCreationOptions {
        maxTeams: number,
        maxPlayersPerTeam: number,
        fillMode: "FILL_TEAMS" | "CREATE_TEAMS",
    }

    function createTeams(_clients: string[], _options: Partial<TeamCreationOptions>): Team[] {
        const options: TeamCreationOptions = {
            ...{ maxTeams: Infinity, maxPlayersPerTeam: Infinity, fillMode: "CREATE_TEAMS" }, ..._options
        }

        let teams: Team[] = [];

        if (options.fillMode === "CREATE_TEAMS") {
            for (let i: number = 0; i < _clients.length; i++) {
                let player = _clients[i];

                if (teams.length < options.maxTeams) {
                    teams.push({ players: [{ id: player }] });
                } else {
                    let team = teams[i % options.maxTeams];
                    if (!team || team.players.length >= options.maxPlayersPerTeam) return teams;
                    team.players.push({ id: player });
                }
            }
        } else if (options.fillMode === "FILL_TEAMS") {
            for (let i: number = 0; i < _clients.length; i++) {
                let player = _clients[i];
                let team = teams[teams.length - 1];
                if (!team || team.players.length >= options.maxPlayersPerTeam) {
                    team = { players: [{ id: player }] };
                    teams.push(team);
                } else {
                    team.players.push({ id: player });
                }
            }
        }

        for (let t: number = 0; t < teams.length; t++) {
            for (let player of teams[t].players) {
                player.team = t;
            }
        }

        return teams;
    }
}
