import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder().setName("skip").setDescription(i18n.__("skip.description")),
  execute(interaction: ChatInputCommandInteraction) {
    const queue = bot.queues.get(interaction.guild!.id);
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);

    if (!queue) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("skip.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed] }).catch(console.error);
    }

    if (!canModifyQueue(guildMember!)) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("common.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed] });
    }

    queue.player.stop(true);

    const resultEmbed = new EmbedBuilder()
      .setDescription(`${greenCheck}` + i18n.__mf("skip.result", { author: interaction.user.id }))
      .setColor("#FF0000");

    interaction.reply({ embeds: [resultEmbed] }).catch(console.error);
  }
};