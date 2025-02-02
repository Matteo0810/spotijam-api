import { WebSocket } from "@fastify/websocket";
import { FastifyInstance, FastifyRequest } from "fastify";
import logger from "./logger";

const webSocketConnections: {[key: string]: WebSocket} = {};

const fastifyWs = (fastify: FastifyInstance) => {
    fastify.get('/ws/:id', { websocket: true }, (connection: WebSocket, request: FastifyRequest) => {
        const userId = request.url.split("/").pop();
        
        if(!userId) {
            logger.error('No user ID found in the request')
            connection.close()
            return;
        }
        
        //logger.info(`[Websocket] new socket connection: ` + userId);
        webSocketConnections[userId] = connection;
    
        connection.on('close', () => {
            delete webSocketConnections[userId];
            //logger.info(`[Websocket] socket connection closed: ` + userId);
        })

        connection.on('message', (message) => {
            const msg = message.toString();
            if (msg === "__ping__") {
                connection.send("__pong__")
            }
        });

    });
}

export default fastifyWs;
export { webSocketConnections };
