"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const sendMessage_1 = __importDefault(require("./sendMessage"));
const client = new discord_js_1.default.Client({ intents: [
        discord_js_1.default.Intents.FLAGS.GUILDS,
        discord_js_1.default.Intents.FLAGS.GUILD_MESSAGES,
    ] });
const envVar = process.env;
client.login(envVar.LOGIN_TOKEN);
client.on("ready", () => console.log(`${client.user.tag} è operativo.`));
client.on("messageCreate", (msg) => runCommand(msg));
function runCommand(msg) {
    const parsedMessage = parseMessage(msg);
    if (!parsedMessage)
        return;
    try {
        const command = require(`./${parsedMessage[0]}/index.ts`);
        command[parsedMessage[1]](client, msg, parsedMessage);
    }
    catch (err) {
        console.log(err);
        (0, sendMessage_1.default)(client, msg, "Impossibile trovare questo comando");
    }
}
function parseMessage(msg) {
    if (!msg.content.startsWith(envVar.BOT_PREFIX))
        return;
    var msgContent = msg.content
        .substring(envVar.BOT_PREFIX.length)
        .split(/ +/);
    return msgContent;
}
//# sourceMappingURL=index.js.map