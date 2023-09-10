import move from "array-move";
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";
import { canModifyQueue } from "../utils/queue";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder()
    .setName("move")
    .setDescription(i18n.__("move.description"))
    .addIntegerOption((option) =>
      option.setName("movefrom").setDescription(i18n.__("move.args.movefrom")).setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("moveto").setDescription(i18n.__("move.args.moveto")).setRequired(true)
    ),
  execute(interaction: ChatInputCommandInteraction) {
    const movefromArg = interaction.options.getInteger("movefrom");
    const movetoArg = interaction.options.getInteger("moveto");

    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const queue = bot.queues.get(interaction.guild!.id);

    if (!queue || !queue.songs.length) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("move.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (!canModifyQueue(guildMember!)) return;

    if (!movefromArg || !movetoArg) {
      const usageEmbed = new EmbedBuilder()
        .setDescription(i18n.__mf("move.usageReply"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [usageEmbed], ephemeral: true });
    }

    if (isNaN(movefromArg) || movefromArg <= 1) {
      const usageEmbed = new EmbedBuilder()
        .setDescription(i18n.__mf("move.usageReply"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [usageEmbed], ephemeral: true });
    }

    let song = queue.songs[movefromArg - 1];

    queue.songs = move(queue.songs, movefromArg - 1, movetoArg == 1 ? 1 : movetoArg - 1);

    const resultEmbed = new EmbedBuilder()
      .setDescription(
        `${greenCheck}` + i18n.__mf("move.result", {
          author: interaction.user.id,
          title: song.title,
          index: movetoArg == 1 ? 1 : movetoArg
        })
      )
      .setColor("#FF0000");

    interaction.reply({ embeds: [resultEmbed] });
  }
};
