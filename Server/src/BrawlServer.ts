import { FudgeServer, Room } from "../fudge_modules/FudgeServer";
import { FudgeNet } from "../fudge_modules/Message";

export class BrawlServer extends FudgeServer {
    protected async handleMessage(_message: string, _wsConnection: WebSocket): Promise<void> {
        let message: FudgeNet.Message = JSON.parse(_message);
        switch (message.command) {
            case FudgeNet.COMMAND.ROOM_CREATE:
                super.handleMessage(_message, _wsConnection);

                let newRoom: string = "Lobby";
                for(let room in this.rooms){
                    if(Object.keys(this.rooms[room].clients).length === 0){
                        newRoom = room;
                        break;
                    }
                }
                message.command = FudgeNet.COMMAND.ROOM_ENTER;
                if(!message.content) {
                    message.content = {};
                }
                message.content.room = newRoom;
                
                this.handleMessage(JSON.stringify(message), _wsConnection);
                break;
            case FudgeNet.COMMAND.ROOM_GET_IDS:
                let roomInfo: { [roomId: string]: number } = {};
                for (let room in this.rooms) {
                    roomInfo[room] = Object.keys(this.rooms[room].clients).length;
                }
                this.dispatch({
                    idRoom: message.idRoom,
                    command: FudgeNet.COMMAND.ROOM_GET_IDS,
                    idTarget: message.idSource,
                    content: {
                        rooms: roomInfo
                    }
                });
                break;
            case FudgeNet.COMMAND.ROOM_ENTER:
                super.handleMessage(_message, _wsConnection);
                this.checkAndRemoveEmptyRooms();
                break;
            default:
                super.handleMessage(_message, _wsConnection);
                break;
        }
    }

    logMessage(_text: string, _message: FudgeNet.Message): void {
        super.logMessage(_text, _message);
    }

    logClients(_room: Room): void {
        super.logClients(_room);
        this.checkAndRemoveEmptyRooms();
    }

    checkAndRemoveEmptyRooms(){
        for(let id in this.rooms) {
            if(id === "Lobby") continue;
            if(Object.keys(this.rooms[id].clients).length === 0){
                delete this.rooms[id];
            }
        }
    }
}