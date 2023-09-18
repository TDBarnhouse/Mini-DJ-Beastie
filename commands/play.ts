import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, TextChannel, EmbedBuilder } from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";
import { playlistPattern } from "../utils/patterns";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription(i18n.__("play.description"))
    .addStringOption((option) => option.setName("song").setDescription("The song you want to play").setRequired(true)),
  cooldown: 3,
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.ManageMessages
  ],
  async execute(interaction: ChatInputCommandInteraction, input: string) {
    let argSongName = interaction.options.getString("song");
    if (!argSongName) argSongName = input;

    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const { channel } = guildMember!.voice;

    if (!channel) {
      const errorNotInChannelEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("play.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorNotInChannelEmbed], ephemeral: true }).catch(console.error);
    }
    const queue = bot.queues.get(interaction.guild!.id);

    if (queue && channel.id !== queue.connection.joinConfig.channelId) {
      const errorNotInSameChannelEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__mf("play.errorNotInSameChannel", { user: bot.client.user!.username }))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorNotInSameChannelEmbed], ephemeral: true }).catch(console.error);
    }

    const url = argSongName;

    const loadingEmbed = new EmbedBuilder()
      .setDescription("Loading song...")
      .setColor("#FF0000");

    if (interaction.replied) await interaction.editReply({ embeds: [loadingEmbed] }).catch(console.error);
    else await interaction.reply({ embeds: [loadingEmbed] });

    if (playlistPattern.test(url)) {
      if (interaction.replied) await interaction.editReply({ embeds: [loadingEmbed] }).catch(console.error);

      return bot.slashCommandsMap.get("playlist")!.execute(interaction, 'song');
    }

    let song;

    try {
      song = await Song.from(url, url);
    } 
    catch (error: any) {
      if (error.name == "NoResults") {
        const errorNoResultsEmbed = new EmbedBuilder()
          .setDescription(`${redX}` + i18n.__mf("play.errorNoResults", { url: `<${url}>` }))
          .setColor("#FF0000");

        return interaction.reply({ embeds: [errorNoResultsEmbed], ephemeral: true }).catch(console.error);
      }
      if (error.name == "InvalidURL") {
        const errorInvalidURLEmbed = new EmbedBuilder()
          .setDescription(`${redX}` + i18n.__mf("play.errorInvalidURL", { url: `<${url}>` }))
          .setColor("#FF0000");

        return interaction.reply({ embeds: [errorInvalidURLEmbed], ephemeral: true }).catch(console.error);
      }

      console.error(error);
      if (interaction.replied) {
        const commonErrorEmbed = new EmbedBuilder()
          .setDescription(`${redX}` + i18n.__("common.errorCommand"))
          .setColor("#FF0000");

        return await interaction.editReply({ embeds: [commonErrorEmbed] }).catch(console.error);
      } 
      else {
        const commonErrorEmbed = new EmbedBuilder()
          .setDescription(`${redX}` + i18n.__("common.errorCommand"))
          .setColor("#FF0000");

        return interaction.reply({ embeds: [commonErrorEmbed], ephemeral: true }).catch(console.error);
      }
    }

    if (queue) {
      queue.enqueue(song);

      const queueAddedEmbed = new EmbedBuilder()
        .setDescription(`${greenCheck}` + i18n.__mf("play.queueAdded", { title: song.title, author: interaction.user.id }))
        .setColor("#FF0000");
        
        interaction.deleteReply().catch(console.error);

      return (interaction.channel as TextChannel)
        .send({ embeds: [queueAddedEmbed] })
        .catch(console.error);
    }

    const newQueue = new MusicQueue({
      interaction,
      textChannel: interaction.channel! as TextChannel,
      connection: joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
      })
    });

    bot.queues.set(interaction.guild!.id, newQueue);

    newQueue.enqueue(song);
    interaction.deleteReply().catch(console.error);
  }
};