namespace Script {
    import ƒ = FudgeCore;
    export interface Player {
        id: string,
        brawler?: ComponentBrawler,
        remainingRespawns?: number,
        chosenBrawler?: string,
    }
    export interface Team {
        players: Player[],
        remainingRespawns?: number,
        respawnPoints?: ƒ.Node[],
    }
    export enum RESPAWN_TYPE {
        AT_FIXED_RESPAWN_POINT,
        AT_RANDOM_RESPAWN_POINT,
        AT_DEATH_LOCATION,
        AT_TEAMMATE_LOCATION,
    }
    export interface GameSettings {
        timer: number,
        maxRespawnsPerRoundAndTeam: number,
        maxRespawnsPerRoundAndPlayer: number,
        amtRounds: number,
        respawnTime: number,
        respawnType: RESPAWN_TYPE[],
        arena: string,
    }
    export class GameManager {
        static Instance: GameManager = new GameManager();
        teams: Team[];
        settings: GameSettings;
        gameActive: boolean = false;

        private defaultSettings: GameSettings = {
            amtRounds: 1,
            maxRespawnsPerRoundAndPlayer: 3,
            maxRespawnsPerRoundAndTeam: -1,
            respawnTime: 3,
            respawnType: [RESPAWN_TYPE.AT_TEAMMATE_LOCATION, RESPAWN_TYPE.AT_FIXED_RESPAWN_POINT, RESPAWN_TYPE.AT_DEATH_LOCATION],
            timer: 120,
            arena: "TrainingMap"
        }

        constructor() {
            if (GameManager.Instance) return GameManager.Instance;
        }

        init(_teams: Team[], _settings: Partial<GameSettings>, _gameActive: boolean = false) {
            if (this.gameActive) throw new Error("Game is already in progress");
            this.gameActive = _gameActive;
            this.settings = { ...this.defaultSettings, ..._settings };
            this.teams = _teams;
        }

        async startGame() {
            await this.startRound();
            ƒ.Loop.start();
            menuManager.showOverlay(MENU_TYPE.NONE);
            // ƒ.Time.game.setScale(0.2);
        }

        async startRound() {
            let graph = <ƒ.Graph>ƒ.Project.getResourcesByName(this.settings.arena)[0];
            viewport.setBranch(graph);
            let em = new EntityManager();
            let entityNode = graph.getChildrenByName("Terrain")[0].getChildrenByName("Entities")[0];
            entityNode.removeAllChildren();
            entityNode.addComponent(em);
            await EntityManager.Instance.loadBrawler(this.getBrawlerOfPlayer(LobbyManager.client.id));
        }

        selectBrawler(_brawler: string, _player: string) {
            let totalPlayers: number = 0;
            let totalSelected: number = 0;
            if (!this.teams) return;

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
                (<HTMLInputElement>document.getElementById("start_game")).disabled = false;
            }

        }

        getBrawlerOfPlayer(_player: string): string {
            if (!this.teams) return "Brawler";
            for (let team of this.teams) {
                for (let p of team.players) {
                    if (p.id === _player) return p.chosenBrawler;
                }
            }
            return "Brawler";
        }

        playerDied(cp: ComponentBrawler) {

        }
    }
}