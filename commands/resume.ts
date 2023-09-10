import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder().setName("resume").setDescription(i18n.__("resume.description")),
  execute(interaction: ChatInputCommandInteraction) {
    const queue = bot.queues.get(interaction.guild!.id);
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);

    if (!queue) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("resume.errorNotQueue"))
        .setColor("#FF0000")

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (!canModifyQueue(guildMember!)) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("common.errorNotChannel"))
        .setColor("#FF0000")

      return interaction.reply({ embeds: [errorEmbed] });
    }

    if (queue.player.unpause()) {
      const resultEmbed = new EmbedBuilder()
        .setDescription(`${greenCheck}` + i18n.__mf("resume.resultNotPlaying", { author: interaction.user.id }))
        .setColor("#FF0000")

      if (interaction.replied) interaction.followUp({ embeds: [resultEmbed] }).catch(console.error);
      else interaction.reply({ embeds: [resultEmbed] }).catch(console.error);

      return true;
    }

    const errorEmbed = new EmbedBuilder()
      .setDescription(`${redX}` + i18n.__("resume.errorPlaying"))
      .setColor("#FF0000")

    if (interaction.replied) interaction.followUp({ embeds: [errorEmbed] }).catch(console.error);
    else interaction.reply({ embeds: [errorEmbed] }).catch(console.error);

    return false;
  }
};
