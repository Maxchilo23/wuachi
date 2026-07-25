import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { playCommand } from './commands/play';
import { skipCommand } from './commands/skip';
import { pauseCommand } from './commands/pause';
import { stopCommand } from './commands/stop';
import { queueCommand } from './commands/queue';
import { playlistCommand } from './commands/playlist';

const commands = [
  playCommand.data.toJSON(),
  skipCommand.data.toJSON(),
  pauseCommand.data.toJSON(),
  stopCommand.data.toJSON(),
  queueCommand.data.toJSON(),
  playlistCommand.data.toJSON(),
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID!),
    { body: commands }
  );
  console.log('Comandos registrados.');
})();