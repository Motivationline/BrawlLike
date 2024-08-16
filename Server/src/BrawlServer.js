"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrawlServer = void 0;
const FudgeServer_1 = require("../fudge_modules/FudgeServer");
const Message_1 = require("../fudge_modules/Message");
class BrawlServer extends FudgeServer_1.FudgeServer {
    handleMessage(_message, _wsConnection) {
        const _super = Object.create(null, {
            handleMessage: { get: () => super.handleMessage }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let message = JSON.parse(_message);
            switch (message.command) {
                case Message_1.FudgeNet.COMMAND.ROOM_CREATE:
                    _super.handleMessage.call(this, _message, _wsConnection);
                    let newRoom = "Lobby";
                    for (let room in this.rooms) {
                        if (Object.keys(this.rooms[room].clients).length === 0) {
                            newRoom = room;
                            break;
                        }
                    }
                    message.command = Message_1.FudgeNet.COMMAND.ROOM_ENTER;
                    if (!message.content) {
                        message.content = {};
                    }
                    message.content.room = newRoom;
                    this.handleMessage(JSON.stringify(message), _wsConnection);
                    break;
                case Message_1.FudgeNet.COMMAND.ROOM_GET_IDS:
                    let roomInfo = {};
                    for (let room in this.rooms) {
                        roomInfo[room] = Object.keys(this.rooms[room].clients).length;
                    }
                    this.dispatch({
                        idRoom: message.idRoom,
                        command: Message_1.FudgeNet.COMMAND.ROOM_GET_IDS,
                        idTarget: message.idSource,
                        content: {
                            rooms: roomInfo
                        }
                    });
                    break;
                case Message_1.FudgeNet.COMMAND.ROOM_ENTER:
                    _super.handleMessage.call(this, _message, _wsConnection);
                    this.checkAndRemoveEmptyRooms();
                    break;
                default:
                    _super.handleMessage.call(this, _message, _wsConnection);
                    break;
            }
        });
    }
    logMessage(_text, _message) {
        super.logMessage(_text, _message);
    }
    logClients(_room) {
        super.logClients(_room);
        this.checkAndRemoveEmptyRooms();
    }
    checkAndRemoveEmptyRooms() {
        for (let id in this.rooms) {
            if (id === "Lobby")
                continue;
            if (Object.keys(this.rooms[id].clients).length === 0) {
                delete this.rooms[id];
            }
        }
    }
}
exports.BrawlServer = BrawlServer;
