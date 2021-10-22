import Discord from 'discord.js';
import sendMessage from '../sendMessage';
import insulti from './insulti.json';

export function insulta(client: Discord.Client, msg: Discord.Message, parsedMessage: Array<string>) {
    if (!parsedMessage[2]) {
        sendMessage(client, msg, "Devi pingare qualcuno.");
        return;
    }
    if (!/<\@\!.*>/.test(parsedMessage[2])) {
        sendMessage(client, msg, "Devi pingare un utente.");
        return;
    }

    const insultoCasuale = insulti[randomNumber(insulti.length - 1)];
    sendMessage(client, msg, `${parsedMessage[2]}${insultoCasuale}`);
}

function randomNumber(max : number) {
    return Math.floor(Math.random() * (max + 1));
}
