import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  EmbedBuilder
} from "discord.js";
import youtube, { Video } from "youtube-sr";
import { bot } from "..";
import { i18n } from "../utils/i18n";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription(i18n.__("search.description"))
    .addStringOption((option) =>
      option.setName("query").setDescription(i18n.__("search.optionQuery")).setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString("query", true);
    const member = interaction.guild!.members.cache.get(interaction.user.id);

    if (!member?.voice.channel) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("search.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }

    const search = query;

    const loadingEmbed = new EmbedBuilder()
      .setDescription("Loading search results...")
      .setColor("#FF0000");

    if (interaction.replied) await interaction.editReply({ embeds: [loadingEmbed] }).catch(console.error);
    else await interaction.reply({ embeds: [loadingEmbed] });

    let results: Video[] = [];

    try {
      results = await youtube.search(search, { limit: 10, type: "video" });
    } catch (error: any) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("common.errorCommand"))
        .setColor("#FF0000");

      interaction.editReply({ embeds: [errorEmbed] }).catch(console.error);
      return;
    }

    if (!results || !results[0]) {
      const noResultsEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("search.noResults"))
        .setColor("#FF0000");

      interaction.editReply({ embeds: [noResultsEmbed] });
      return;
    }

    const options = results!.map((video) => {
      return {
        label: video.title ?? "",
        value: video.url
      };
    });

    interaction.deleteReply().catch(console.error);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("search-select")
        .setPlaceholder("Nothing selected")
        .setMinValues(1)
        .setMaxValues(10)
        .addOptions(options)
    );

    const followUp = await interaction.followUp({
      content: "Choose which song to play",
      components: [row]
    });

    followUp
      .awaitMessageComponent({
        time: 30000
      })
      .then((selectInteraction) => {
        if (!(selectInteraction instanceof StringSelectMenuInteraction)) return;

        const loadingSelectedSongsEmbed = new EmbedBuilder()
          .setDescription("Loading the selected song...")
          .setColor("#FF0000");
        
        selectInteraction.update({ embeds: [loadingSelectedSongsEmbed], components: [] });

        bot.slashCommandsMap
          .get("play")!
          .execute(interaction, selectInteraction.values[0])
          .then(() => {
            selectInteraction.message?.delete();
            selectInteraction.values.slice(1).forEach((url) => {
              bot.slashCommandsMap.get("play")!.execute(interaction, url);
            });
          });
      })
      .catch(console.error);
  }
};