import Discord from 'discord.js'
import sendMessage from '../sendMessage';
import {
    AudioPlayerStatus,
    getVoiceConnection,
    joinVoiceChannel,
    AudioPlayer,
    createAudioPlayer,
    createAudioResource,
    StreamType
} from '@discordjs/voice'
import ytdl from 'ytdl-core';

interface QueuesObj {
    [index: string]: Array<string> | null;
}
var queues : QueuesObj = {};

interface AudioPlayersObj {
    [index: string]: AudioPlayer | null;
}
var audioplayers : AudioPlayersObj = {};

export function stop(_client : Discord.Client, msg : Discord.Message, _parsedMessage : Array<string>) {
    var connection = getVoiceConnection(msg.member.voice.channel.guild.id);

    audioplayers[msg.guild.id].stop();
    audioplayers[msg.guild.id] = undefined;
    connection.disconnect();
    connection.destroy();
}

export async function play(client: Discord.Client, msg : Discord.Message, parsedMessage : Array<string>) {
    addToQueue(client, msg, parsedMessage);
    if (!audioplayers[msg.guild.id]) {
        startPlaying(msg);
    }
}

function addToQueue(_client : Discord.Client, msg : Discord.Message, parsedMessage : Array<string>) {
    if (!queues[msg.guild.id]) {
        queues[msg.guild.id] = [];
    }
    const url = parsedMessage.slice(2).join('');
    queues[msg.guild.id].push(url);
}

function startPlaying(msg: Discord.Message) {
    var connection = getVoiceConnection(msg.member.voice.channel.guild.id);
    if (!connection) {
        connection = joinVoiceChannel({
            channelId: msg.member.voice.channel.id,
            guildId: msg.member.voice.channel.guild.id,
            adapterCreator: msg.member.voice.channel.guild.voiceAdapterCreator
        });
    }

    var audioPlayer = createAudioPlayer();
    const resource = nextInQueue(msg.guild.id);

    connection.subscribe(audioPlayer);
    audioPlayer.play(resource);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
        const newResource = nextInQueue(msg.guild.id);
        if (!newResource) {
            audioPlayer.stop();
            connection.disconnect();
            connection.destroy();
            return;
        }
        audioPlayer.play(newResource);
    })

    audioplayers[msg.guild.id] = audioPlayer;
}

function nextInQueue(guildId : string) {
    const shiftedObj = queues[guildId]?.shift();
    if (!shiftedObj) {
        return null;
    }
    return createAudioResource(
        ytdl(shiftedObj, {filter: "audioonly"}),
    );
}
