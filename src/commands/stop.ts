import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { stopAndLeave } from '../services/audioService';
import { clearQueue } from '../services/queueService';

export const stopCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la música, vacía la cola y saca a Wuachi del canal de voz'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    stopAndLeave(guildId);
    await clearQueue(guildId);
    await interaction.reply('Listo, corté la música y vacié la cola.');
  },
};