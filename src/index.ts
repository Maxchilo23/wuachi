import 'dotenv/config';
import ffmpegPath from 'ffmpeg-static';
process.env.FFMPEG_PATH = ffmpegPath as string;
console.log(generateDependencyReport());
import { generateDependencyReport } from '@discordjs/voice';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readyHandler } from './events/ready';
import { interactionCreateHandler } from './events/interactionCreate';
import { playCommand } from './commands/play';
import { skipCommand } from './commands/skip';
import { pauseCommand } from './commands/pause';
import { stopCommand } from './commands/stop';
import { queueCommand } from './commands/queue';
import { playlistCommand } from './commands/playlist';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
}) as Client & { commands: Collection<string, any> };

client.commands = new Collection();
client.commands.set(playCommand.data.name, playCommand);
client.commands.set(skipCommand.data.name, skipCommand);
client.commands.set(pauseCommand.data.name, pauseCommand);
client.commands.set(stopCommand.data.name, stopCommand);
client.commands.set(queueCommand.data.name, queueCommand);
client.commands.set(playlistCommand.data.name, playlistCommand);

client.once('ready', readyHandler);
client.on('interactionCreate', interactionCreateHandler);

client.login(process.env.DISCORD_TOKEN);