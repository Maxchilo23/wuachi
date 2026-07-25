import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ytpl from 'ytpl';
import { addToQueue } from '../services/queueService';
import { connectToChannel, playNext, getOrCreatePlayer } from '../services/audioService';
import { AudioPlayerStatus } from '@discordjs/voice';

const execFileAsync = promisify(execFile);
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';

function cleanVideoUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const videoId = parsed.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return url;
  } catch {
    return url;
  }
}

async function getVideoTitle(url: string): Promise<string> {
  const { stdout, stderr } = await execFileAsync(YTDLP, ['-e', url], { timeout: 30000 });
  if (stderr) console.error('yt-dlp stderr:', stderr);
  return stdout.trim();
}

export const playCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce un video o playlist de YouTube')
    .addStringOption((opt) =>
      opt.setName('url').setDescription('Link de YouTube (video o playlist)').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString('url', true);
    const member = interaction.member as GuildMember;
    const channel = member.voice.channel;

    if (!channel) {
      await interaction.reply({ content: 'Tienes que estar en un canal de voz.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const guildId = interaction.guildId!;
      await connectToChannel(channel.id, guildId, interaction.guild!.voiceAdapterCreator);

      const isPlaylist = ytpl.validateID(url);

      if (isPlaylist) {
        const playlist = await ytpl(url, { limit: Infinity });
        await addToQueue(
          guildId,
          playlist.items.map((item) => ({
            url: item.shortUrl,
            title: item.title,
            requestedBy: interaction.user.id,
          }))
        );
        await interaction.editReply(`Encolé ${playlist.items.length} canciones de "${playlist.title}".`);
      } else {
        const cleanUrl = cleanVideoUrl(url);
        console.log('Pidiendo título para:', cleanUrl);
        const title = await getVideoTitle(cleanUrl);
        console.log('Título obtenido:', title);
        await addToQueue(guildId, [{ url: cleanUrl, title, requestedBy: interaction.user.id }]);
        await interaction.editReply(`Encolé: ${title}`);
      }

      console.log('Llamando a playNext para guild:', guildId);
      const player = getOrCreatePlayer(guildId);
      if (player.state.status === AudioPlayerStatus.Idle) {
        playNext(guildId).catch((err) => console.error('Error no capturado en playNext:', err));
      }
    } catch (err: any) {
      console.error('Error en /play:', err);
      await interaction.editReply(`Falló: ${err.message ?? 'error desconocido'}`);
    }
  },
};