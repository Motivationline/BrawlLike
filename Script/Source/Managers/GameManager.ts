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
        wonRounds?: number,
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
            this.gameActive = true;
            menuManager.showOverlay(MENU_TYPE.GAME_OVERLAY);
            // ƒ.Time.game.setScale(0.2);
        }

        timerId: number;
        timeDiv: HTMLDivElement;
        remainingTime: number = 0;
        async startRound() {
            document.getElementsByTagName("canvas")[0].hidden = false;
            MultiplayerManager.clearObjects();
            
            let gameOverElement = document.getElementById("game-over-wrapper")!;
            gameOverElement.parentElement.classList.add("hidden");

            this.timeDiv = <HTMLDivElement>document.getElementById("game-time");
            let graph = <ƒ.Graph>ƒ.Project.getResourcesByName(this.settings.arena)[0];
            viewport.setBranch(graph);
            let em = new EntityManager();
            let entityNode = graph.getChildrenByName("Terrain")[0].getChildrenByName("Entities")[0];
            entityNode.removeAllChildren();
            entityNode.addComponent(em);
            this.initSpawnPoints();

            this.remainingTime = this.settings.timer;

            let teamDisplays = [document.getElementById("game-team-1"), document.getElementById("game-team-2")];
            teamDisplays.forEach(td => td.innerHTML = "");

            let scores: number[] = [];

            for (let team of this.teams) {
                team.remainingRespawns = this.settings.maxRespawnsPerRoundAndTeam;
                if (team.remainingRespawns < 0) team.remainingRespawns = Infinity;
                for (let player of team.players) {
                    player.remainingRespawns = this.settings.maxRespawnsPerRoundAndPlayer;
                    if (player.remainingRespawns < 0) player.remainingRespawns = Infinity;

                    let imgSrc = (<HTMLImageElement>document.getElementById("brawler").querySelector(`button[data-brawler="${player.chosenBrawler}"] img`)).src;

                    teamDisplays[player.team % teamDisplays.length].innerHTML += `<div class="brawler-display" id="${player.id}"><img src="${imgSrc}"></div>`
                }
                scores.push(team.wonRounds ?? 0);
            }

            document.getElementById("game-score").innerText = scores.join(" : ");

            await EntityManager.Instance.loadBrawler(this.getPlayer(LobbyManager.client.id));

            if (this.timerId !== undefined) ƒ.Time.game.deleteTimer(this.timerId);
            this.timerId = ƒ.Time.game.setTimer(1000, 0, () => {
                this.remainingTime--;
                this.timeDiv.innerText = formatMinutes(this.remainingTime);
                if (this.remainingTime <= 0) {
                    this.checkEndRound();
                }
            });

            function formatMinutes(timeInSeconds: number, leadingZero: boolean = true): string {
                let seconds = Math.floor(timeInSeconds % 60);
                let minutes = Math.floor(timeInSeconds / 60);

                let timeString: string = "";
                timeString += `${minutes < 10 && leadingZero ? "0" : ""}${minutes}`;
                timeString += ` : ${seconds < 10 ? "0" : ""}${seconds}`

                return timeString;
            }
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

            document.getElementById("brawler-ready-text").innerText = `${totalSelected} / ${totalPlayers} players`;
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
            let ownerId = MultiplayerManager.getOwnerIdFromId(cp.id);
            let player = this.getPlayer(ownerId);
            player.remainingRespawns--;
            let team = this.getTeamOfPlayer(player);
            team.remainingRespawns--;

            if (player.remainingRespawns <= 0 || team.remainingRespawns <= 0) {
                // player was eliminated
                if (ownerId == MultiplayerManager.client.id) {
                    let gameOverElement = document.getElementById("game-over-wrapper")!;
                    gameOverElement.parentElement.classList.remove("hidden");
                    gameOverElement.innerText = "ELIMINATED";
                }

                this.checkEndRound();
                // document.getElementById(ownerId)?.classList.remove("dead");
                // document.getElementById(ownerId)?.classList.add("eliminated");
                return;
            }

            ƒ.Time.game.setTimer(this.settings.respawnTime * 1000, 1, () => {
                this.respawnPlayer(player);
            });

        }

        private checkEndRound() {
            let roundWinner = this.getRoundWinner();

            if (!roundWinner && this.remainingTime > 0) return;
            
            let gameOverElement = document.getElementById("game-over-wrapper")!;
            if (roundWinner) {
                roundWinner.wonRounds = (roundWinner.wonRounds ?? 0) + 1;

                gameOverElement.parentElement.classList.remove("hidden");
                gameOverElement.innerText = "ROUND OVER";
            }
            if(this.remainingTime <= 0){
                gameOverElement.parentElement.classList.remove("hidden");
                gameOverElement.innerText = "TIME IS UP";
            }

            let gameWinner = this.getGameWinner();
            if (gameWinner) {
                if (gameWinner.players.find(p => p.brawler === EntityManager.Instance.playerBrawler)) {
                    gameOverElement.innerText = "YOU WIN"
                } else {
                    gameOverElement.innerText = "YOU LOOSE"
                }

                setTimeout(() => { this.resetGame() }, 3000)
            } else {
                setTimeout(() => { this.startRound() }, 3000)
            }
            ƒ.Time.game.deleteTimer(this.timerId);

        }

        private getRoundWinner(): Team | undefined {
            let winnerTeam: Team;
            for (let team of this.teams) {
                if (isFinite(team.remainingRespawns) && team.remainingRespawns > 0) {
                    if (winnerTeam) return undefined;
                    winnerTeam = team;
                    continue;
                }
                for (let player of team.players) {
                    if (isFinite(player.remainingRespawns) && player.remainingRespawns > 0) {
                        if (winnerTeam && winnerTeam !== team) return undefined;
                        winnerTeam = team;
                        break;
                    }
                }
            }

            return winnerTeam;
        }
        private getGameWinner(): undefined | Team {
            let roundsNeededToWin = Math.ceil(this.settings.amtRounds / 2);
            for (let team of this.teams) {
                if (team.wonRounds >= roundsNeededToWin) {
                    return team;
                }
            }

            return undefined;
        }

        private respawnPlayer(_player: Player) {
            if (MultiplayerManager.client.id !== MultiplayerManager.getOwnerIdFromId(_player.id)) return;
            let spawnPoint = this.getSpawnPointForPlayer(_player)
            _player.brawler.respawn(spawnPoint);
        }

        private getTeamOfPlayer(_player: Player) {
            return this.teams.find(t => t.players.includes(_player));
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

        getSpawnPointForPlayer(_player: string | Player): ƒ.Vector3 {
            let player: Player;
            if (typeof _player === "string") {
                player = this.getPlayer(_player);
            } else {
                player = _player;
            }
            if (!player) return new ƒ.Vector3();
            for (let type of this.settings.respawnType) {
                switch (type) {
                    case RESPAWN_TYPE.AT_DEATH_LOCATION: {
                        return player.brawler.node.mtxLocal.translation.clone;
                    }
                    case RESPAWN_TYPE.AT_FIXED_RESPAWN_POINT: {
                        let rPoints: ƒ.Node[] = this.teams[player.team].respawnPoints;
                        if (!rPoints || rPoints.length === 0) continue;
                        return rPoints[Math.floor(Math.random() * rPoints.length)].mtxLocal.translation.clone;
                    }
                    case RESPAWN_TYPE.AT_RANDOM_RESPAWN_POINT: {
                        let rPoints: ƒ.Node[] = this.#allSpawnPoints;
                        if (!rPoints || rPoints.length === 0) continue;
                        return rPoints[Math.floor(Math.random() * rPoints.length)].mtxLocal.translation.clone;
                    }
                    case RESPAWN_TYPE.AT_TEAMMATE_LOCATION: {
                        let team = this.teams[player.team];
                        //TODO make sure not to select dead players
                        let otherPlayer = team.players.find((p) => p.id !== player.id);
                        if (!otherPlayer) continue;
                        return otherPlayer.brawler?.node.mtxLocal.translation.clone;
                    }
                }
            }
            return new ƒ.Vector3();
        }

        resetGame() {
            let gameOverElement = document.getElementById("game-over-wrapper")!;
            gameOverElement.parentElement.classList.add("hidden");
            menuManager.showOverlay(MENU_TYPE.GAME_LOBBY);
            viewport.setBranch(undefined);

            document.getElementById("brawler-ready-text").innerText = `waiting for players`;
            (<HTMLInputElement>document.getElementById("start_game")).disabled = true;
            document.getElementById("brawler").querySelectorAll("button").forEach(b => b.classList.remove("selected"));

            this.gameActive = false;
            ƒ.Loop.stop();

            document.getElementsByTagName("canvas")[0].hidden = true;
        }
    }
}