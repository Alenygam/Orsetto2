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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.play = exports.stop = void 0;
const voice_1 = require("@discordjs/voice");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
var queues = {};
var audioplayers = {};
function stop(_client, msg, _parsedMessage) {
    var connection = (0, voice_1.getVoiceConnection)(msg.member.voice.channel.guild.id);
    audioplayers[msg.guild.id].stop();
    audioplayers[msg.guild.id] = undefined;
    connection.disconnect();
    connection.destroy();
}
exports.stop = stop;
function play(client, msg, parsedMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        addToQueue(client, msg, parsedMessage);
        if (!audioplayers[msg.guild.id]) {
            startPlaying(msg);
        }
    });
}
exports.play = play;
function addToQueue(_client, msg, parsedMessage) {
    if (!queues[msg.guild.id]) {
        queues[msg.guild.id] = [];
    }
    const url = parsedMessage.slice(2).join('');
    queues[msg.guild.id].push(url);
}
function startPlaying(msg) {
    var connection = (0, voice_1.getVoiceConnection)(msg.member.voice.channel.guild.id);
    if (!connection) {
        connection = (0, voice_1.joinVoiceChannel)({
            channelId: msg.member.voice.channel.id,
            guildId: msg.member.voice.channel.guild.id,
            adapterCreator: msg.member.voice.channel.guild.voiceAdapterCreator
        });
    }
    var audioPlayer = (0, voice_1.createAudioPlayer)();
    audioPlayer.play(nextInQueue(msg.guild.id));
    connection.subscribe(audioPlayer);
    audioPlayer.on(voice_1.AudioPlayerStatus.Idle, () => {
        const newResource = nextInQueue(msg.guild.id);
        if (!newResource) {
            audioPlayer.stop();
            connection.disconnect();
            connection.destroy();
            return;
        }
        audioPlayer.play(newResource);
    });
    audioplayers[msg.guild.id] = audioPlayer;
}
function nextInQueue(guildId) {
    var _a;
    const shiftedObj = (_a = queues[guildId]) === null || _a === void 0 ? void 0 : _a.shift();
    if (!shiftedObj) {
        return null;
    }
    return (0, voice_1.createAudioResource)((0, ytdl_core_1.default)(shiftedObj, { filter: "audioonly" }));
}
//# sourceMappingURL=index.js.map