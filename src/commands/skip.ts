import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { skip } from '../services/audioService';

export const skipCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta a la siguiente canción de la cola'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const ok = skip(guildId);

    if (!ok) {
      await interaction.reply({ content: 'No hay nada sonando ahorita.', ephemeral: true });
      return;
    }

    await interaction.reply('Saltando canción...');
  },
};