import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder().setName("pause").setDescription(i18n.__("pause.description")),
  execute(interaction: ChatInputCommandInteraction) {
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const queue = bot.queues.get(interaction.guild!.id);

    if (!queue) {
      const errorNotQueueEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("pause.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorNotQueueEmbed] }).catch(console.error);
    }

    if (!canModifyQueue(guildMember!)) {
      const errorNotChannelEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("common.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorNotChannelEmbed] }).catch(console.error);
    }

    if (queue.player.pause()) {
      const resultEmbed = new EmbedBuilder()
        .setDescription(`${greenCheck}` + i18n.__mf("pause.result", { author: interaction.user.id }))
        .setColor("#FF0000");

      if (interaction.replied) {
        interaction.followUp({ embeds: [resultEmbed] }).catch(console.error);
      } else {
        interaction.reply({ embeds: [resultEmbed] }).catch(console.error);
      }

      return true;
    }
  }
};
