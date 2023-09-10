import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { splitBar } from "string-progressbar";
import { bot } from "../index";
import { i18n } from "../utils/i18n";

const { redX } = require('../variables/logos.js');

function getVideoIdFromUrl(url: string) {
  const match = url.match(/[?&]v=([^?&]+)/);
  return match ? match[1] : null;
}

export default {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription(i18n.__("nowplaying.description")),
  cooldown: 10,
  execute(interaction: ChatInputCommandInteraction) {
    const queue = bot.queues.get(interaction.guild!.id);

    if (!queue || !queue.songs.length) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("nowplaying.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    const song = queue.songs[0];
    const seek = queue.resource.playbackDuration / 1000;
    const left = song.duration - seek;

    const videoId = getVideoIdFromUrl(song.url);
    const thumbnailURL = `https://img.youtube.com/vi/${videoId}/default.jpg`;

    let nowPlaying = new EmbedBuilder()
      .setTitle(i18n.__("nowplaying.embedTitle"))
      .setDescription(`${song.title}\n${song.url}`)
      .setThumbnail(thumbnailURL)
      .setColor("#FF0000");

    if (song.duration > 0) {
      nowPlaying.addFields({
        name: "\u200b",
        value:
          new Date(seek * 1000).toISOString().substr(11, 8) +
          "[" +
          splitBar(song.duration == 0 ? seek : song.duration, seek, 18)[0] +
          "]" +
          (song.duration == 0 ? " ◉ LIVE" : new Date(song.duration * 1000).toISOString().substr(11, 8)),
        inline: false
      });

      nowPlaying.setFooter({
        text: i18n.__mf("nowplaying.timeRemaining", {
          time: new Date(left * 1000).toISOString().substr(11, 8)
        })
      });
    }

    return interaction.reply({ embeds: [nowPlaying] });
  }
};