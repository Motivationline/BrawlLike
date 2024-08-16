import { BrawlServer } from "./BrawlServer";

let port: number | string | undefined = process.env.PORT;
if (port == undefined)
    port = parseInt(process.argv[2]);
if (!port) {
    port = 8000;
}

let server: BrawlServer = new BrawlServer();
server.startUp(Number(port));
