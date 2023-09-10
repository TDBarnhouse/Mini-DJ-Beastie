import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { bot } from "../index";
import { i18n } from "../utils/i18n";

export default {
  data: new SlashCommandBuilder().setName("uptime").setDescription(i18n.__("uptime.description")),
  execute(interaction: ChatInputCommandInteraction) {
    let seconds = Math.floor(bot.client.uptime! / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    seconds %= 60;
    minutes %= 60;
    hours %= 24;

    const uptimeEmbed = new EmbedBuilder()
      .setDescription(
        i18n.__mf("uptime.result", { days: days, hours: hours, minutes: minutes, seconds: seconds })
      )
      .setColor("#FF0000");

    return interaction.reply({ embeds: [uptimeEmbed] }).catch(console.error);
  }
};
