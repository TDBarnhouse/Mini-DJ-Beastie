import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder().setName("loop").setDescription(i18n.__("loop.description")),
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = bot.queues.get(interaction.guild!.id);

    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);

    if (!queue) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("loop.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (!guildMember || !canModifyQueue(guildMember)) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("common.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    queue.loop = !queue.loop;

    const loopStatus = queue.loop ? i18n.__("common.on") : i18n.__("common.off");

    const successEmbed = new EmbedBuilder()
      .setDescription(`${greenCheck}` + i18n.__mf("loop.result", { loop: loopStatus }))
      .setColor("#FF0000");

    if (interaction.replied) {
      interaction.followUp({ embeds: [successEmbed] }).catch(console.error);
    } 
    else {
      interaction.reply({ embeds: [successEmbed] }).catch(console.error);
    }
  }
};