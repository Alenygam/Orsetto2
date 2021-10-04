"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
function sendMessage(client, msg, str) {
    var avatarURL = {
        href: ""
    };
    try {
        avatarURL = new URL(`https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`);
    }
    catch (_a) { }
    var message = new discord_js_1.default.MessageEmbed()
        .setColor('#ff8000')
        .setTitle('Orsetto')
        .setDescription(str)
        .setThumbnail(avatarURL.href);
    msg.channel.send({ embeds: [message] });
}
exports.default = sendMessage;
//# sourceMappingURL=sendMessage.js.map