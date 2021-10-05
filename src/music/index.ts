import Discord from 'discord.js'
import sendMessage from '../sendMessage';
import {
    AudioPlayerStatus,
    getVoiceConnection,
    joinVoiceChannel,
    AudioPlayer,
    createAudioPlayer,
    createAudioResource,
    VoiceConnectionStatus,
    VoiceConnection
} from '@discordjs/voice'
import ytdl from 'ytdl-core';
import youtubeSearch from 'youtube-search';

interface QueuesObj {
    [index: string]: Array<string> | null;
}
var queues : QueuesObj = {};

interface AudioPlayersObj {
    [index: string]: AudioPlayer | null;
}
var audioplayers : AudioPlayersObj = {};

const YoutubeHosts = [
    "www.youtube.com",
    "m.youtube.com",
    "youtube.com",
    "youtu.be",
    "music.youtube.com"
]
export function skip(client : Discord.Client, msg: Discord.Message, _parsedMessage: Array<string>): void {
    if (!audioplayers[msg.guild.id]) {
        sendMessage(client, msg, "Beep Boop non sto facendo nulla.");
        return;
    }

    var { newResource, url } = nextInQueue(msg.guild.id);
    if (!newResource) {
        sendMessage(client, msg, "Beep Boop non c'è nulla dopo in coda.");
        return;
    }
    audioplayers[msg.guild.id].play(newResource);
    playingMessage(msg, url);
}

export function stop(client : Discord.Client, msg : Discord.Message, _parsedMessage : Array<string>): void {
    var connection = getVoiceConnection(msg.member.voice.channel.guild.id);
    if (!connection) {
        sendMessage(client, msg, "Beep Boop non sono connesso a nessun canale vocale.");
        return;
    }
    stopPlaying(audioplayers[msg.guild.id], connection, msg.guild.id)
}

export async function play(client: Discord.Client, msg : Discord.Message, parsedMessage : Array<string>): Promise<void> {
    await addToQueue(client, msg, parsedMessage);
    if (!audioplayers[msg.guild.id] && !!queues[msg.guild.id] && !!queues[msg.guild.id][0]) {
        startPlaying(client, msg);
    }
}

async function addToQueue(client : Discord.Client, msg : Discord.Message, parsedMessage : Array<string>): Promise<void> {
    if (!queues[msg.guild.id]) {
        queues[msg.guild.id] = [];
    }
    let message = parsedMessage.slice(2).join('');
    let isurl : Boolean = false;
    try {
        new URL(message);
        isurl = true;
    } catch {
        isurl = false;
    }

    let url : URL;
    if (isurl) {
        url = new URL(message);
        if (!YoutubeHosts.includes(url.hostname)) {
            sendMessage(client, msg, "Possiamo processare solo video da youtube");
            return;
        }
    } else {
        url = new URL(await ytSearch(message));
    }
    queues[msg.guild.id].push(url.href);
    const info = (await ytdl.getInfo(url.href)).videoDetails
    const thumbnails = info.thumbnails;
    const thumbnail = thumbnails[thumbnails.length - 1].url;

    var embed = new Discord.MessageEmbed()
        .setColor('#ff8000')
        .setTitle('Aggiunto...')
        .setDescription(info.title)
        .setThumbnail(thumbnail)
        .setURL(url.href);

    msg.channel.send({ embeds: [embed] });
}

function ytSearch(searchTerm: string) : Promise<string> {
    var opts: youtubeSearch.YouTubeSearchOptions = {
        maxResults: 5,
        key: process.env.YT_KEY
    }

    return new Promise((resolve): void => {
        youtubeSearch(searchTerm, opts, (_err, results) => {
            resolve(results[0]?.link);
        })
    })
}

function startPlaying(client: Discord.Client, msg: Discord.Message) {
    var connection = getVoiceConnection(msg.member.voice.channel.guild.id);
    if (!connection) {
        connection = joinVoiceChannel({
            channelId: msg.member.voice.channel.id,
            guildId: msg.member.voice.channel.guild.id,
            adapterCreator: msg.member.voice.channel.guild.voiceAdapterCreator
        });
    }
    createPlayer(client, msg, connection);
}

function createPlayer(client: Discord.Client, msg: Discord.Message, connection : VoiceConnection) {
    var audioPlayer = createAudioPlayer();
    let { newResource, url } = nextInQueue(msg.guild.id);
    if (!newResource) {
        sendMessage(client, msg, "Aggiungi qualcosa alla coda!");
        return;
    }
    playingMessage(msg, url);

    connection.subscribe(audioPlayer);
    audioPlayer.play(newResource);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
        var { newResource, url } = nextInQueue(msg.guild.id);
        if (!newResource) {
            stopPlaying(audioPlayer, connection, msg.guild.id)
            return;
        }
        audioPlayer.play(newResource);
        playingMessage(msg, url);
    })
    connection.on(VoiceConnectionStatus.Disconnected, () => {
        stopPlaying(audioPlayer, connection, msg.guild.id)
    })

    audioplayers[msg.guild.id] = audioPlayer;
}

function stopPlaying(audioPlayer : AudioPlayer, connection : VoiceConnection, guildId : string): void {
    audioPlayer.stop();
    audioplayers[guildId] = undefined;
    connection.disconnect();
    try {
        connection.destroy();
    } catch {}
    queues[guildId] = undefined;
}

function nextInQueue(guildId : string) {
    const shiftedObj = queues[guildId]?.shift();
    if (!shiftedObj) {
        return {};
    }
    return {
        newResource: createAudioResource(
            ytdl(shiftedObj, {filter: "audioonly", quality: 'lowestaudio'})
        ),
        url: shiftedObj
    }
}

async function playingMessage(msg : Discord.Message, url : string) {
    const info = (await ytdl.getInfo(url)).videoDetails
    const thumbnails = info.thumbnails;
    const thumbnail = thumbnails[thumbnails.length - 1].url;

    var embed = new Discord.MessageEmbed()
        .setColor('#ff8000')
        .setTitle('Riproducendo...')
        .setDescription(info.title)
        .setThumbnail(thumbnail)
        .setURL(url);

    msg.channel.send({ embeds: [embed] });
}
