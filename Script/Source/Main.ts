///<reference path="Managers/MenuManager.ts" />
///<reference path="Managers/InputManager.ts" />
///<reference path="Managers/EntityManager.ts" />
///<reference path="Managers/MultiplayerManager.ts" />
///<reference path="Managers/LobbyManager.ts" />

namespace Script {
  import ƒ = FudgeCore;
  import ƒNet = FudgeNet;

  export let viewport: ƒ.Viewport;
  document.addEventListener("interactiveViewportStarted", <EventListener>start);
  export const menuManager = new MenuManager();
  export const client: ƒNet.FudgeClient = initClient();
  MultiplayerManager.client = client;
  LobbyManager.client = client;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  document.addEventListener("DOMContentLoaded", preStart);
  
  function preStart() {
    MultiplayerManager.installListeners();
    LobbyManager.installListeners();
    RiveManager.init(RIVE_SCENE.WIREFRAME);
  }
  
  function start(_event: CustomEvent): void {
    const inputManager = new InputManager();
    viewport = _event.detail;
    // viewport.physicsDebugMode = ƒ.PHYSICS_DEBUGMODE.COLLIDERS;
    viewport.addEventListener(ƒ.EVENT.RENDER_END, drawAttackPreviews);

    ƒ.Loop.addEventListener(ƒ.EVENT.LOOP_FRAME, update);
    // ƒ.Loop.start();  // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
  }

  function update(_event: Event): void {
    ƒ.Physics.simulate();  // if physics is included and used
    viewport.draw();
    ƒ.AudioManager.default.update();
  }

  export async function startViewport() {
    // document.getElementById("start").removeEventListener("click", startViewport);
    let graphId = document.head.querySelector("meta[autoView]").getAttribute("autoView");
    if (isMobile)
      document.documentElement.requestFullscreen();

    await ƒ.Project.loadResourcesFromHTML();
    let graph: ƒ.Graph = <ƒ.Graph>ƒ.Project.resources[graphId];
    let canvas = document.querySelector("canvas");
    let viewport = new ƒ.Viewport();
    let camera = findFirstCameraInGraph(graph);

    viewport.initialize("GameViewport", graph, camera, canvas);

    canvas.dispatchEvent(new CustomEvent("interactiveViewportStarted", { bubbles: true, detail: viewport }));

    canvas.addEventListener("mousedown", InputManager.Instance.mousedown);
    canvas.addEventListener("mouseup", InputManager.Instance.mouseup);
    canvas.addEventListener("mousemove", InputManager.Instance.mousemove);
    canvas.addEventListener("contextmenu", (_e) => { _e.preventDefault(); });
  }

  function findFirstCameraInGraph(_graph: ƒ.Node): ƒ.ComponentCamera {
    let cam = _graph.getComponent(ƒ.ComponentCamera);
    if (cam) return cam;
    for (let child of _graph.getChildren()) {
      cam = findFirstCameraInGraph(child);
      if (cam) return cam;
    }
    return undefined;
  }

  function initClient() {

    const client = new ƒNet.FudgeClient();
    let serverURL: string = "wss://motivationline.plagiatus.net/brawler/";
    if (window.location.hostname.startsWith("localhost") || window.location.hostname.startsWith("127.0.0.1")) {
      serverURL = "ws://localhost:8000";
    }
    client.connectToServer(serverURL);
    return client;
  }

  /** Draw the attack previews after all other rendering with disabled depth test */
  function drawAttackPreviews(): void {
    if (ComponentAttack.activePreviews.size == 0)
      return;

    ƒ.Render.setDepthTest(false)
    for (const previewNode of ComponentAttack.activePreviews) {
      previewNode.activate(true);
      ƒ.Render.prepare(previewNode, { ignorePhysics: true }, previewNode.getParent().mtxWorld);
      ƒ.Render.draw(viewport.camera);
      previewNode.activate(false);
    }
    ƒ.Render.setDepthTest(true);
  }
}