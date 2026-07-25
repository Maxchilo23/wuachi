import { Interaction } from 'discord.js';
import { client } from '../index';

export async function interactionCreateHandler(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'Algo falló ejecutando el comando.', ephemeral: true });
  }
}