import { Client } from 'discord.js';

export function readyHandler(this: Client) {
  console.log(`Wuachi conectado como ${this.user?.tag}`);
}