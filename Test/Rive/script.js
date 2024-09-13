const r = new rive.Rive({
    src: "./Spidey.riv",
    canvas: document.getElementById("canvas"),
    autoplay: true,
    stateMachines: "Spidey",
    onLoad: () => {r.resizeDrawingSurfaceToCanvas();}
});