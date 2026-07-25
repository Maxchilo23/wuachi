import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../db/client';
import { getQueue, addToQueue } from '../services/queueService';

export const playlistCommand = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Guarda o carga playlists propias del servidor')
    .addSubcommand((sub) =>
      sub
        .setName('save')
        .setDescription('Guarda la cola actual como playlist')
        .addStringOption((opt) =>
          opt.setName('nombre').setDescription('Nombre de la playlist').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('load')
        .setDescription('Carga una playlist guardada a la cola')
        .addStringOption((opt) =>
          opt.setName('nombre').setDescription('Nombre de la playlist').setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('Lista las playlists guardadas')),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const sub = interaction.options.getSubcommand();

    if (sub === 'save') {
      const nombre = interaction.options.getString('nombre', true);
      const songs = await getQueue(guildId);

      if (songs.length === 0) {
        await interaction.reply({ content: 'No hay nada en la cola para guardar.', ephemeral: true });
        return;
      }

      const playlist = await prisma.playlist.create({
        data: { guildId, name: nombre, createdBy: interaction.user.id },
      });

      await prisma.playlistItem.createMany({
        data: songs.map((s, i) => ({
          playlistId: playlist.id,
          url: s.url,
          title: s.title,
          position: i,
        })),
      });

      await interaction.reply(`Guardé "${nombre}" con ${songs.length} canciones.`);
    }

    if (sub === 'load') {
      const nombre = interaction.options.getString('nombre', true);
      const playlist = await prisma.playlist.findFirst({
        where: { guildId, name: nombre },
        include: { items: { orderBy: { position: 'asc' } } },
      });

      if (!playlist) {
        await interaction.reply({ content: `No encontré una playlist llamada "${nombre}".`, ephemeral: true });
        return;
      }

      await addToQueue(
        guildId,
        playlist.items.map((item) => ({
          url: item.url,
          title: item.title,
          requestedBy: interaction.user.id,
        }))
      );

      await interaction.reply(`Encolé "${nombre}" (${playlist.items.length} canciones). Usa /play para empezar si no está sonando nada.`);
    }

    if (sub === 'list') {
      const playlists = await prisma.playlist.findMany({ where: { guildId } });

      if (playlists.length === 0) {
        await interaction.reply('No hay playlists guardadas en este servidor.');
        return;
      }

      const list = playlists.map((p) => `- ${p.name}`).join('\n');
      await interaction.reply(`**Playlists guardadas:**\n${list}`);
    }
  },
};