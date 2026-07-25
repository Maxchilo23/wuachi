import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { togglePause } from '../services/audioService';

export const pauseCommand = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa o reanuda la reproducción actual'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const result = togglePause(guildId);

    if (result === 'paused') {
      await interaction.reply('Pausado.');
    } else if (result === 'resumed') {
      await interaction.reply('Reanudado.');
    } else {
      await interaction.reply({ content: 'No hay nada sonando ahorita.', ephemeral: true });
    }
  },
};