"use strict";
// /<reference path="rive.d.ts" />
// import * as rive from "./rive/rive";
// import * as rive from "@rive-app/canvas";
let inputs;
const r = new rive.Rive({
    src: "./mainmenu.riv",
    // src: 'https://cdn.rive.app/animations/vehicles.riv',
    canvas: document.getElementById("canvas"),
    autoplay: true,
    stateMachines: "StateMachineMainMenu",
    // stateMachines: 'bumpy',
    onLoad: () => {
        r.resizeDrawingSurfaceToCanvas();
        // inputs = r.stateMachineInputs("TitleScreenStateMachine");
        inputs = r.stateMachineInputs("StateMachineMainMenu");
        // r.enableFPSCounter();
        console.log(inputs);
        setTimeout(() => {
            r.setTextRunValueAtPath("MainMenuButton", "Click Me", "ButtonHost");
        }, 1000);
        setTimeout(() => {
            r.setTextRunValueAtPath("MainMenuButton", "Not Me", "ButtonJoin");
        }, 2000);
    }
});
// setTimeout(()=>{inputs.find(i => i.name === "StartAnimation")?.fire()}, 2000);
// setTimeout(()=>{inputs.find(i => i.name === "bump")?.fire()}, 2000);
// setTimeout(()=>{inputs.find(i => i.name === "bump")?.fire()}, 3000);
// setTimeout(()=>{inputs.find(i => i.name === "bump")?.fire()}, 3500);
// setTimeout(()=>{r.pause()}, 2000);
// setTimeout(()=>{r.play()}, 3000);
// setTimeout(()=>{r.fireStateAtPath("Bump", "")}, 2000);
window.addEventListener("resize", () => {
    r.resizeDrawingSurfaceToCanvas();
});
r.on(rive.EventType.RiveEvent, (_event) => {
    console.log("Event!", _event);
    if (_event.data.name == "AmpelGreen") {
        let hostClicked = inputs.find(i => i.name === "HostClicked");
        hostClicked.value = false;
    }
    r.setBooleanStateAtPath("On", true, "Switch");
    r.setBooleanStateAtPath("On", true, "Switch 2");
    setTimeout(() => {
        r.setBooleanStateAtPath("On", false, "Switch");
        r.setBooleanStateAtPath("On", false, "Switch 2");
    }, 1000);
});
