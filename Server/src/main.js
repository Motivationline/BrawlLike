"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BrawlServer_1 = require("./BrawlServer");
let port = process.env.PORT;
if (port == undefined)
    port = parseInt(process.argv[2]);
if (!port) {
    port = 8000;
}
let server = new BrawlServer_1.BrawlServer();
server.startUp(Number(port));
