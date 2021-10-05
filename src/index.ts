import Discord from 'discord.js';
import sendMessage from './sendMessage';
const client = new Discord.Client({intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
]});
const envVar = process.env;

client.login(envVar.LOGIN_TOKEN)
client.on("ready", () => console.log(`${client.user.tag} è operativo.`));
client.on("messageCreate", (msg) => runCommand(msg));

function runCommand(msg : Discord.Message) {
    const parsedMessage = parseMessage(msg);
    if (!parsedMessage) return;
    try {
        const command = require(`./${parsedMessage[0]}/index`);
        command[parsedMessage[1]](client, msg, parsedMessage);
    } catch (err) {
        console.log(err);
        sendMessage(client, msg, "Impossibile trovare questo comando");
    }
}

function parseMessage(msg : Discord.Message) {
    if (!msg.content.startsWith(envVar.BOT_PREFIX)) return;

    var msgContent = msg.content
        .substring(envVar.BOT_PREFIX.length)
        .split(/ +/);
    return msgContent;
}
