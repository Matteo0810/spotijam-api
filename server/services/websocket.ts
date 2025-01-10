import { WebSocketServer } from "ws";
import http from "http";
import https from "https";
import fs from "fs";

const certPath = '/certs/ballon2zipette.com/fullchain.pem';
const keyPath = '/certs/ballon2zipette.com/privkey.pem';

const useSSL = fs.existsSync(certPath) && fs.existsSync(keyPath);

let server: https.Server|http.Server;
if(useSSL) {
    server = https.createServer({
     cert: fs.readFileSync(certPath),
     key: fs.readFileSync(keyPath)
    });
} else {
    console.warn('No certificate found ! Use no ssl certificate there.')
    server = http.createServer();
}
const wss = new WebSocketServer({ server });

const webSocketConnections: {[key: string]: WebSocket} = {};

wss.on("connection", (ws: WebSocket, request: Request) => {
    const userId = request.url.split("/").pop();
    if(!userId)
        return;
    console.log(`[Websocket] new socket connection: ` + userId);
    webSocketConnections[userId] = ws;

        // TODO, opti ???
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.send();  // Envoie un ping pour vérifier la connexion
        }
    }, 30000);  // Pinger toutes les 30 secondes
    wss.on('pong', () => {
        console.log(`[Websocket] pong from ${userId}`);
    });

    wss.on('close', () => {
        delete webSocketConnections[userId];
        console.log(`[Websocket] socket connection closed: ` + userId);
    })
});

export default server;
export { webSocketConnections };
