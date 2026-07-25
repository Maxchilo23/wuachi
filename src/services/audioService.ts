import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  VoiceConnection,
} from '@discordjs/voice';
import { getNextSong } from './queueService';

const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';

const players = new Map<string, ReturnType<typeof createAudioPlayer>>();
const connections = new Map<string, VoiceConnection>();

export function getOrCreatePlayer(guildId: string) {
  let player = players.get(guildId);
  if (!player) {
    player = createAudioPlayer();
    players.set(guildId, player);

    player.on('stateChange', (oldState, newState) => {
      console.log(`Player [${guildId}] cambió de estado: ${oldState.status} -> ${newState.status}`);
    });
  }
  return player;
}

export async function connectToChannel(channelId: string, guildId: string, adapterCreator: any) {
  let connection = connections.get(guildId);
  if (!connection) {
    connection = joinVoiceChannel({ channelId, guildId, adapterCreator });
    connections.set(guildId, connection);

    connection.on('stateChange', (oldState, newState) => {
      console.log(`Conexión [${guildId}] cambió de estado: ${oldState.status} -> ${newState.status}`);
    });
  }

  console.log('Esperando a que la conexión esté lista...');
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    console.log('Conexión lista (Ready).');
  } catch (err) {
    console.error('La conexión nunca llegó a Ready:', err);
  }

  return connection;
}

export function getConnection(guildId: string) {
  return connections.get(guildId);
}

function createYtDlpStream(url: string) {
  console.log('Creando stream de yt-dlp para:', url);
  const proc = spawn(YTDLP, [
    url,
    '-f', 'bestaudio',
    '-o', '-',
    '--quiet',
    '--no-warnings',
    '--ffmpeg-location', ffmpegPath as string,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  proc.on('error', (err) => {
    console.error('Error al lanzar yt-dlp:', err);
  });

  proc.stderr.on('data', (chunk) => {
    console.error('yt-dlp stream stderr:', chunk.toString());
  });

  proc.on('close', (code) => {
    console.log(`yt-dlp proceso terminó con código: ${code}`);
  });

  return proc.stdout;
}

export async function playNext(guildId: string) {
  console.log('playNext() iniciado para guild:', guildId);

  const song = await getNextSong(guildId);
  if (!song) {
    console.log('No hay más canciones en la cola.');
    return;
  }

  const connection = connections.get(guildId);
  if (!connection) {
    console.log('No hay conexión de voz activa, abortando.');
    return;
  }

  console.log('Estado actual de la conexión:', connection.state.status);

  const stream = createYtDlpStream(song.url);
  const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
  const player = getOrCreatePlayer(guildId);

  connection.subscribe(player);
  player.play(resource);
  console.log('player.play() ejecutado.');

  player.removeAllListeners(AudioPlayerStatus.Idle);
  player.once(AudioPlayerStatus.Idle, () => playNext(guildId));

  player.removeAllListeners('error');
  player.once('error', (err) => {
    console.error('Error en el player:', err);
    playNext(guildId);
  });
}

export function skip(guildId: string) {
  const player = players.get(guildId);
  if (!player) return false;
  player.stop();
  return true;
}

export function togglePause(guildId: string): 'paused' | 'resumed' | null {
  const player = players.get(guildId);
  if (!player) return null;
  if (player.state.status === AudioPlayerStatus.Playing) {
    player.pause();
    return 'paused';
  }
  if (player.state.status === AudioPlayerStatus.Paused) {
    player.unpause();
    return 'resumed';
  }
  return null;
}

export function stopAndLeave(guildId: string) {
  const player = players.get(guildId);
  player?.stop();
  players.delete(guildId);

  const connection = connections.get(guildId);
  connection?.destroy();
  connections.delete(guildId);
}