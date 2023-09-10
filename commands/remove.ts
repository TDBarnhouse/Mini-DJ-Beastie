import { SlashCommandBuilder, CommandInteraction, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
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
      option.setName("position").setDescription(i18n.__("remove.removePosition")).setRequired(true)
    ),
  execute(interaction: ChatInputCommandInteraction) {
    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const removeArgs = interaction.options.getInteger("position");

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
        
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    if (!removeArgs) {
      const usageReplyEmbed = new EmbedBuilder()
        .setDescription(i18n.__mf("remove.usageReply"))
        .setColor("#FF0000");
        
      return interaction.reply({ embeds: [usageReplyEmbed], ephemeral: true });
    }

    if (removeArgs == 1) { 
      const positionErrorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__mf("remove.positionError"))
        .setColor("#FF0000");
        
      return interaction.reply({ embeds: [positionErrorEmbed], ephemeral: true });
    }

    const songs = removeArgs.toString().split(",").map((arg: string) => parseInt(arg));

    let removed: Song[] = [];

    if (pattern.test(removeArgs.toString())) {
      queue.songs = queue.songs.filter((item, index) => {
        if (songs.find((songIndex: number) => songIndex - 1 === index)) removed.push(item);
        else return true;
      });

      const resultEmbed = new EmbedBuilder()
        .setDescription(`${greenCheck}` + i18n.__mf("remove.result", {
          title: removed.map((song) => song.title).join("\n"),
          author: interaction.user.id
        }))
        .setColor("#FF0000");
        
      interaction.reply({ embeds: [resultEmbed] });
    } else if (!isNaN(removeArgs) && removeArgs >= 1 && removeArgs <= queue.songs.length) {
      const resultEmbed = new EmbedBuilder()
        .setDescription(`${greenCheck}` + i18n.__mf("remove.result", {
          title: queue.songs.splice(+removeArgs - 1, 1)[0].title,
          author: interaction.user.id
        }))
        .setColor("#FF0000");
        
      interaction.reply({ embeds: [resultEmbed] });
    } else {
      const usageReplyEmbed = new EmbedBuilder()
        .setDescription(i18n.__mf("remove.usageReply"))
        .setColor("#FF0000");
        
      interaction.reply({ embeds: [usageReplyEmbed], ephemeral: true });
    }
  }
};