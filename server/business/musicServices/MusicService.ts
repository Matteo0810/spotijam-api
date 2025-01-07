import queryString from "query-string";
import EventEmitter from "events";
import Rooms, { RoomEvents } from "../../dataSources/rooms";
import { sleep } from "../../helpers/globalUtils";

export type IMusicService = "SPOTIFY";
export interface IMusicToken {
    type: IMusicService;
    authorization: string;
}

interface IRequestParams {
    endpoint: string;     
    query?: Record<string, unknown>;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";  
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
}

export interface ITrack {
    id: string;
    name: string;
    artists: Array<string>;
    image: string;
    duration: number;
}

export interface IPlayer {
    isPlaying: boolean;
    deviceName: string;
    musicTimeRemaing: number;
}

export type TQueue = { queue: Array<ITrack>, currentPlaying: ITrack|null };
export type IQuerySearch = Array<ITrack>;

export default abstract class MusicService {

    private readonly token: IMusicToken;
    private readonly baseURL: string;

    protected readonly rooms: Rooms;

    public constructor(baseURL: string, token: IMusicToken) {
        this.token = token;
        this.baseURL = baseURL;
        this.rooms = new Rooms();
    }

    public async request<T = {}>({ endpoint, body, query, headers, method = "GET" }: IRequestParams): Promise<T|null> {
        let url = this.baseURL;
        if(!url.endsWith("/") && !endpoint.startsWith("/")) 
            url+="/";

        url+= endpoint;
        if(query) {
            url+=`?${queryString.stringify(query)}`;
        }

        const response = await fetch(url, {
            method,
            headers: {
                ...headers,
                'Authorization': this.token.authorization
            },
            ...body && { body: JSON.stringify(body) }
        });

        const text = await response.text();
        if(!text?.trim())
            return null;
        
        try {
            const data = JSON.parse(text);
            if(!response.ok) {
                throw new Error(data?.error?.message ?? "HTTP ERROR ! " + response.statusText);
            }
            
            return data as T;
        } catch(e) {} // ignore
        return null;
    }

    // listeners
    public abstract startListeners(roomId: string): void;
    public abstract removeListeners(roomId: string): void;

    // user's queue
    public abstract addToQueue(id: string): Promise<void>;
    public abstract getQueue(): Promise<TQueue>;
    
    // api search musics
    public abstract search(query: string): Promise<IQuerySearch>;
    
    // player
    public abstract skipNext(): Promise<TQueue>;
    public abstract skipPrevious(): Promise<TQueue>;

    public abstract pause(): Promise<TQueue>;
    public abstract play(): Promise<TQueue>;

    public abstract getPlayer(): Promise<IPlayer|null>;
}