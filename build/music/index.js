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
exports.play = exports.stop = exports.skip = void 0;
const discord_js_1 = __importDefault(require("discord.js"));
const sendMessage_1 = __importDefault(require("../sendMessage"));
const voice_1 = require("@discordjs/voice");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const youtube_search_1 = __importDefault(require("youtube-search"));
var queues = {};
var audioplayers = {};
const YoutubeHosts = [
    "www.youtube.com",
    "m.youtube.com",
    "youtube.com",
    "youtu.be",
    "music.youtube.com"
];
function skip(client, msg, _parsedMessage) {
    audioplayers[msg.guild.id].stop();
    var connection = (0, voice_1.getVoiceConnection)(msg.member.voice.channel.guild.id);
    if (!connection) {
        (0, sendMessage_1.default)(client, msg, "Beep Boop non sono connesso a nessun canale vocale.");
        return;
    }
    createPlayer(client, msg, connection);
}
exports.skip = skip;
function stop(client, msg, _parsedMessage) {
    var connection = (0, voice_1.getVoiceConnection)(msg.member.voice.channel.guild.id);
    if (!connection) {
        (0, sendMessage_1.default)(client, msg, "Beep Boop non sono connesso a nessun canale vocale.");
        return;
    }
    stopPlaying(audioplayers[msg.guild.id], connection, msg.guild.id);
}
exports.stop = stop;
function play(client, msg, parsedMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        yield addToQueue(client, msg, parsedMessage);
        if (!audioplayers[msg.guild.id] && !!queues[msg.guild.id] && !!queues[msg.guild.id][0]) {
            startPlaying(client, msg);
        }
    });
}
exports.play = play;
function addToQueue(client, msg, parsedMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!queues[msg.guild.id]) {
            queues[msg.guild.id] = [];
        }
        let message = parsedMessage.slice(2).join('');
        let isurl = false;
        try {
            new URL(message);
            isurl = true;
        }
        catch (_a) {
            isurl = false;
        }
        let url;
        if (isurl) {
            url = new URL(message);
            if (!YoutubeHosts.includes(url.hostname)) {
                (0, sendMessage_1.default)(client, msg, "Possiamo processare solo video da youtube");
                return;
            }
        }
        else {
            url = new URL(yield ytSearch(message));
        }
        queues[msg.guild.id].push(url.href);
        const info = (yield ytdl_core_1.default.getInfo(url.href)).videoDetails;
        const thumbnails = info.thumbnails;
        const thumbnail = thumbnails[thumbnails.length - 1].url;
        var embed = new discord_js_1.default.MessageEmbed()
            .setColor('#ff8000')
            .setTitle('Aggiunto...')
            .setDescription(info.title)
            .setThumbnail(thumbnail)
            .setURL(url.href);
        msg.channel.send({ embeds: [embed] });
    });
}
function ytSearch(searchTerm) {
    var opts = {
        maxResults: 5,
        key: process.env.YT_KEY
    };
    return new Promise((resolve) => {
        (0, youtube_search_1.default)(searchTerm, opts, (_err, results) => {
            var _a;
            resolve((_a = results[0]) === null || _a === void 0 ? void 0 : _a.link);
        });
    });
}
function startPlaying(client, msg) {
    var connection = (0, voice_1.getVoiceConnection)(msg.member.voice.channel.guild.id);
    if (!connection) {
        connection = (0, voice_1.joinVoiceChannel)({
            channelId: msg.member.voice.channel.id,
            guildId: msg.member.voice.channel.guild.id,
            adapterCreator: msg.member.voice.channel.guild.voiceAdapterCreator
        });
    }
    createPlayer(client, msg, connection);
}
function createPlayer(client, msg, connection) {
    var audioPlayer = (0, voice_1.createAudioPlayer)();
    let { newResource, url } = nextInQueue(msg.guild.id);
    if (!newResource) {
        (0, sendMessage_1.default)(client, msg, "Aggiungi qualcosa alla coda!");
        audioPlayer.stop();
        return;
    }
    playingMessage(msg, url);
    connection.subscribe(audioPlayer);
    audioPlayer.play(newResource);
    audioPlayer.on(voice_1.AudioPlayerStatus.Idle, () => {
        var { newResource, url } = nextInQueue(msg.guild.id);
        if (!newResource) {
            stopPlaying(audioPlayer, connection, msg.guild.id);
            return;
        }
        audioPlayer.play(newResource);
        playingMessage(msg, url);
    });
    connection.on(voice_1.VoiceConnectionStatus.Disconnected, () => {
        stopPlaying(audioPlayer, connection, msg.guild.id);
    });
    audioplayers[msg.guild.id] = audioPlayer;
}
function stopPlaying(audioPlayer, connection, guildId) {
    audioPlayer.stop();
    audioplayers[guildId] = undefined;
    connection.disconnect();
    try {
        connection.destroy();
    }
    catch (_a) { }
    queues[guildId] = undefined;
}
function nextInQueue(guildId) {
    var _a;
    const shiftedObj = (_a = queues[guildId]) === null || _a === void 0 ? void 0 : _a.shift();
    if (!shiftedObj) {
        return {};
    }
    return {
        newResource: (0, voice_1.createAudioResource)((0, ytdl_core_1.default)(shiftedObj, { filter: "audioonly", quality: 'lowestaudio' })),
        url: shiftedObj
    };
}
function playingMessage(msg, url) {
    return __awaiter(this, void 0, void 0, function* () {
        const info = (yield ytdl_core_1.default.getInfo(url)).videoDetails;
        const thumbnails = info.thumbnails;
        const thumbnail = thumbnails[thumbnails.length - 1].url;
        var embed = new discord_js_1.default.MessageEmbed()
            .setColor('#ff8000')
            .setTitle('Riproducendo...')
            .setDescription(info.title)
            .setThumbnail(thumbnail)
            .setURL(url);
        msg.channel.send({ embeds: [embed] });
    });
}
//# sourceMappingURL=index.js.map