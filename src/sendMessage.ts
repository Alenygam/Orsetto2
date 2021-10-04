import Discord from 'discord.js';

function sendMessage(client : Discord.Client, msg : Discord.Message, str : string) {
    var avatarURL = {
        href: ""
    };
    try {
        avatarURL = new URL(`https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}`);
    } catch {}

    var message = new Discord.MessageEmbed()
        .setColor('#ff8000')
        .setTitle('Orsetto')
        .setDescription(str)
        .setThumbnail(avatarURL.href);

    msg.channel.send({embeds: [message]});
}

export default sendMessage;
