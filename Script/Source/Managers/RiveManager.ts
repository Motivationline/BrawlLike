namespace Script {
    import ƒ = FudgeCore;
    export enum RIVE_SCENE {
        INTRO,
        MAIN_MENU,
        WIREFRAME,
    }

    enum INPUTS {
        INTRO_END = "IntroEnd",
        SELECT_CHARACTER = "SelectCharacter",
        ASSETS_LOADED = "AssetsLoaded",
        PLAYER_READY = "PlayerReady",
        ROOM_CREATED = "RoomCreated",
        MENU_STATE = "MenuState",
    }

    export const RiveMap: Map<RIVE_SCENE, { src: string, stateMachine: string }> = new Map(
        [
            [RIVE_SCENE.INTRO, { src: "./UI/Rive/intromenu.riv", stateMachine: "TitleScreenStateMachine" }],
            [RIVE_SCENE.MAIN_MENU, { src: "./UI/Rive/mainmenu.riv", stateMachine: "StateMachineMainMenu" }],
            [RIVE_SCENE.WIREFRAME, { src: "./UI/Rive/wireframe.riv", stateMachine: "MainStateMachine" }],
        ]
    );

    export class RiveManager {
        static rive: rive.Rive;
        static inputs: Map<string, rive.StateMachineInput>;
        static init(_scene: RIVE_SCENE) {
            if (this.rive)
                this.rive.cleanup();

            let sceneInfo = RiveMap.get(_scene);
            this.rive = new rive.Rive({
                src: sceneInfo.src,
                canvas: document.getElementsByTagName("canvas")[0],
                autoplay: true,
                stateMachines: sceneInfo.stateMachine,
                onLoad: () => {
                    this.rive.resizeDrawingSurfaceToCanvas();
                    let inputs = this.rive.stateMachineInputs(sceneInfo.stateMachine);
                    this.inputs = new Map<string, rive.StateMachineInput>();
                    for (let input of inputs) {
                        this.inputs.set(input.name, input);
                    }
                    console.log(this.inputs);
                }
            });

            window.addEventListener("resize", () => {
                this.rive.resizeDrawingSurfaceToCanvas();
            });

            this.rive.on(rive.EventType.RiveEvent, this.eventHandler);
            this.rive

            ƒ.Project.addEventListener(ƒ.EVENT.RESOURCES_LOADED, this.loadMainMenu);
        }

        static eventHandler = (_event: rive.Event) => {
            console.log("Rive Event!", _event, _event.data.name);
            switch(_event.data.name){
                case "IntroEnd": {
                    startViewport();
                    // menuManager.resourcesLoaded();
                    // this.loadMainMenu();
                    break;
                }
                case "MainMenuHostButton": {
                    LobbyManager.hostRoom();
                    break;
                }
                case "MainMenuJoinButton": {
                    break;
                }
                case "JoinMenuJoinButton": {
                    break;
                }
                case "JoinMenuBackButton": {
                    LobbyManager.leaveRoom();
                    break;
                }
                case "HostMenuBackButton": {
                    LobbyManager.leaveRoom();
                    break;
                }
                case "HostMenuStartButton": {
                    break;
                }
                case "CharacterSelectionPlayerNotReady": {
                    break;
                }
                case "CharacterSelectionPlayerReady": {
                    break;
                }
                case "CharacterSelectionBackButton": {
                    break;
                }
                case "Reset": {
                    LobbyManager.leaveRoom();
                    break;
                }
            }
        }

        static loadMainMenu = () => {
            // this.inputs.get(INPUTS.ASSETS_LOADED).value = true;
            this.rive.removeAllRiveEventListeners();
            this.rive.removeRiveListeners();
            this.rive.cleanup();
            document.getElementsByTagName("canvas")[0].getContext("2d").reset();
        }


        // static joinRoom(_code: string) {
        //     this.inputs.get(INPUTS.ROOM_CREATED).fire();
        //     this.rive.setTextRunValueAtPath("Code", _code, "Solo/HostMenu")
        // }

    }
}