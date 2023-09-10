import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder()
    .setName("skipto")
    .setDescription(i18n.__("skipto.description"))
    .addIntegerOption((option) =>
      option.setName("number").setDescription(i18n.__("skipto.args.number")).setRequired(true)
    ),
  execute(interaction: ChatInputCommandInteraction) {
    const playlistSlotArg = interaction.options.getInteger("position");
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);

    if (!playlistSlotArg || isNaN(playlistSlotArg)) {
      const usageEmbed = new EmbedBuilder()
        .setDescription(
          i18n.__mf("skipto.usageReply"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [usageEmbed], ephemeral: true }).catch(console.error);
    }

    const queue = bot.queues.get(interaction.guild!.id);

    if (!queue) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("skipto.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (!canModifyQueue(guildMember!)) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("common.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (playlistSlotArg > queue.songs.length) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__mf("skipto.errorNotValid", { length: queue.songs.length }))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (queue.loop) {
      for (let i = 0; i < playlistSlotArg - 2; i++) {
        queue.songs.push(queue.songs.shift()!);
      }
    } else {
      queue.songs = queue.songs.slice(playlistSlotArg - 2);
    }

    queue.player.stop();

    const resultEmbed = new EmbedBuilder()
      .setDescription(`${greenCheck}` + i18n.__mf("skipto.result", { author: interaction.user.id, arg: playlistSlotArg - 1 }))
      .setColor("#FF0000");

    interaction.reply({ embeds: [resultEmbed] }).catch(console.error);
  }
};
