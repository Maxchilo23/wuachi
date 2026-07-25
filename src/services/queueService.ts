import { prisma } from '../db/client';

export type Song = { url: string; title: string; requestedBy: string };

export async function addToQueue(guildId: string, songs: Song[]) {
  await prisma.guild.upsert({
    where: { id: guildId },
    update: {},
    create: { id: guildId },
  });

  const last = await prisma.queueItem.findFirst({
    where: { guildId },
    orderBy: { position: 'desc' },
  });

  let position = (last?.position ?? -1) + 1;

  await prisma.queueItem.createMany({
    data: songs.map((s) => ({
      guildId,
      url: s.url,
      title: s.title,
      requestedBy: s.requestedBy,
      position: position++,
    })),
  });
}

export async function getNextSong(guildId: string) {
  const next = await prisma.queueItem.findFirst({
    where: { guildId },
    orderBy: { position: 'asc' },
  });
  if (next) {
    await prisma.queueItem.delete({ where: { id: next.id } });
  }
  return next;
}

export async function getQueue(guildId: string) {
  return prisma.queueItem.findMany({
    where: { guildId },
    orderBy: { position: 'asc' },
  });
}

export async function clearQueue(guildId: string) {
  await prisma.queueItem.deleteMany({ where: { guildId } });
}