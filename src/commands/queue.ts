import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getQueue } from '../services/queueService';

export const queueCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra las próximas canciones en la cola'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const songs = await getQueue(guildId);

    if (songs.length === 0) {
      await interaction.reply('La cola está vacía.');
      return;
    }

    const list = songs
      .slice(0, 10)
      .map((s, i) => `${i + 1}. ${s.title}`)
      .join('\n');

    const extra = songs.length > 10 ? `\n...y ${songs.length - 10} más.` : '';

    await interaction.reply(`**Próximas canciones:**\n${list}${extra}`);
  },
};