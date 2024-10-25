namespace Script {
    import ƒ = FudgeCore;
    export interface Player {
        id: string,
        brawler?: ComponentBrawler,
        remainingRespawns?: number,
        chosenBrawler?: string,
        team?: number,
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
        #allSpawnPoints: ƒ.Node[] = [];

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
            this.initSpawnPoints();
            await EntityManager.Instance.loadBrawler(this.getChosenBrawlerOfPlayer(LobbyManager.client.id));
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

        getPlayer(_playerID: string): Player | undefined {
            if (!this.teams) return undefined;
            for (let team of this.teams) {
                for (let p of team.players) {
                    if (p.id === _playerID) return p;
                }
            }
            return undefined;
        }

        getChosenBrawlerOfPlayer(_player: string): string {
            return this.getPlayer(_player)?.chosenBrawler ?? "Brawler";
        }

        playerDied(cp: ComponentBrawler) {

        }

        private initSpawnPoints() {
            let spawnPointNodes = EntityManager.Instance.node.getParent().getChildrenByName("Spawnpoints")[0].getChildren();
            for (let team of this.teams) {
                team.respawnPoints = [];
            }
            for (let node of spawnPointNodes) {
                let sp = node.getComponent(SpawnPoint);
                if (!sp) continue;
                if (this.teams.length > sp.team) {
                    this.teams[sp.team].respawnPoints.push(node);
                }
            }
            this.#allSpawnPoints = spawnPointNodes;
        }

        getSpawnPointForPlayer(_playerId: string): ƒ.Vector3 {
            let player = this.getPlayer(_playerId);
            if (!player) return new ƒ.Vector3();
            for (let type of this.settings.respawnType) {
                switch (type) {
                    case RESPAWN_TYPE.AT_DEATH_LOCATION: {
                        return player.brawler.node.mtxLocal.translation.clone;
                    }
                    case RESPAWN_TYPE.AT_FIXED_RESPAWN_POINT: {
                        let rPoints: ƒ.Node[] = this.teams[player.team].respawnPoints;
                        if(!rPoints || rPoints.length === 0) continue;
                        return rPoints[Math.floor(Math.random() * rPoints.length)].mtxLocal.translation.clone;
                    }
                    case RESPAWN_TYPE.AT_RANDOM_RESPAWN_POINT: {
                        let rPoints: ƒ.Node[] = this.#allSpawnPoints;
                        if(!rPoints || rPoints.length === 0) continue;
                        return rPoints[Math.floor(Math.random() * rPoints.length)].mtxLocal.translation.clone;    
                    }
                    case RESPAWN_TYPE.AT_TEAMMATE_LOCATION: {
                        let team = this.teams[player.team];
                        //TODO make sure not to select dead players
                        let otherPlayer = team.players.find((p) => p.id !== player.id);
                        if(!otherPlayer) continue;
                        return otherPlayer.brawler?.node.mtxLocal.translation.clone;
                    }
                }
            }
            return new ƒ.Vector3();
        }
    }
}