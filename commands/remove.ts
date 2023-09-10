import { SlashCommandBuilder, CommandInteraction, EmbedBuilder,  ChatInputCommandInteraction } from "discord.js";
import { bot } from "../index";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

const pattern = /^[0-9]{1,2}(\s*,\s*[0-9]{1,2})*$/;

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription(i18n.__("remove.description"))
    .addIntegerOption((option) =>
      option.setName("position").setDescription(i18n.__("remove.description")).setRequired(true)
    ),
  execute(interaction: ChatInputCommandInteraction) {
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const removeArgs = interaction.options.getString("slot");

    const queue = bot.queues.get(interaction.guild!.id);

    if (!queue) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("remove.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (!canModifyQueue(guildMember!)) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("common.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed] });
    }

    if (!removeArgs) {
      const usageEmbed = new EmbedBuilder()
        .setDescription(i18n.__mf("remove.usageReply", { prefix: bot.prefix }))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [usageEmbed], ephemeral: true });
    }

    const songs = removeArgs.split(",").map((arg: any) => parseInt(arg));

    let removed: Song[] = [];

    if (pattern.test(removeArgs)) {
      queue.songs = queue.songs.filter((item, index) => {
        if (songs.find((songIndex: any) => songIndex - 1 === index)) removed.push(item);
        else return true;
      });

      const resultEmbed = new EmbedBuilder()
        .setDescription(
          `${greenCheck}` + i18n.__mf("remove.result", {
            title: removed.map((song) => song.title).join("\n"),
            author: interaction.user.id
          })
        )
        .setColor("#FF0000");

      return interaction.reply({ embeds: [resultEmbed] });
    } else if (!isNaN(+removeArgs) && +removeArgs >= 1 && +removeArgs <= queue.songs.length) {
      const resultEmbed = new EmbedBuilder()
        .setDescription(
          `${greenCheck}` + i18n.__mf("remove.result", {
            title: queue.songs.splice(+removeArgs - 1, 1)[0].title,
            author: interaction.user.id
          })
        )
        .setColor("#FF0000");

      return interaction.reply({ embeds: [resultEmbed] });
    } else {
      const usageEmbed = new EmbedBuilder()
        .setDescription(i18n.__mf("remove.usageReply", { prefix: bot.prefix }))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [usageEmbed] });
    }
  }
};