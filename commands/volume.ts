import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription(i18n.__("volume.description"))
    .addIntegerOption((option) => option.setName("volume").setDescription(i18n.__("volumeChange.description"))),
  execute(interaction: ChatInputCommandInteraction) {
    const queue = bot.queues.get(interaction.guild!.id);
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const volumeArg = interaction.options.getInteger("volume");

    if (!queue) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("volume.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (!canModifyQueue(guildMember!)) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("volume.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (!volumeArg || volumeArg === queue.volume) {
      const currentVolumeEmbed = new EmbedBuilder()
        .setDescription(i18n.__mf("volume.currentVolume", { volume: queue.volume }))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [currentVolumeEmbed] }).catch(console.error);
    }

    if (isNaN(volumeArg)) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("volume.errorNotNumber"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (volumeArg > 100 || volumeArg < 0) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("volume.errorNotValid"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    queue.volume = volumeArg;
    queue.resource.volume?.setVolumeLogarithmic(volumeArg / 100);

    const resultEmbed = new EmbedBuilder()
      .setDescription(`${greenCheck}` + i18n.__mf("volume.result", { arg: volumeArg }))
      .setColor("#FF0000");

    return interaction.reply({ embeds: [resultEmbed] }).catch(console.error);
  }
};
