import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel
} from "discord.js";
import { bot } from "../index";
import { MusicQueue } from "../structs/MusicQueue";
import { Playlist } from "../structs/Playlist";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";

const { greenCheck, redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription(i18n.__("playlist.description"))
    .addStringOption((option) => option.setName("playlist").setDescription("Playlist name or link").setRequired(true)),
  cooldown: 5,
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.ManageMessages
  ],
  async execute(interaction: ChatInputCommandInteraction, queryOptionName = 'playlist') {
    let argSongName = interaction.options.getString(queryOptionName);

    const guildMember = interaction.guild!.members.cache.get(interaction.user.id);
    const { channel } = guildMember!.voice;

    const queue = bot.queues.get(interaction.guild!.id);

    if (!channel) {
      const errorNotInChannelEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("playlist.errorNotChannel"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorNotInChannelEmbed], ephemeral: true }).catch(console.error);
    }
    if (queue && channel.id !== queue.connection.joinConfig.channelId) {
      const errorNotInSameChannelEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__mf("play.errorNotInSameChannel", { user: interaction.client.user!.username }))
        .setColor("#FF0000");

      if (interaction.replied)
        return interaction.editReply({ embeds: [errorNotInSameChannelEmbed] }).catch(console.error);
      else
        return interaction.reply({ embeds: [errorNotInSameChannelEmbed], ephemeral: true }).catch(console.error);
    }

    let playlist;

    try {
      playlist = await Playlist.from(argSongName!.split(" ")[0], argSongName!);
    } 
    catch (error) {
      console.error(error);

    const errorNotFoundPlaylistEmbed = new EmbedBuilder()
      .setDescription(`${redX}` + i18n.__("playlist.errorNotFoundPlaylist"))
      .setColor("#FF0000");

    if (interaction.replied)
      return interaction.editReply({ embeds: [errorNotFoundPlaylistEmbed] }).catch(console.error);
    else
      return interaction.reply({ embeds: [errorNotFoundPlaylistEmbed], ephemeral: true }).catch(console.error);
  }

    if (queue) {
      queue.songs.push(...playlist.videos);
    } 
    else {
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
      newQueue.songs.push(...playlist.videos);

      newQueue.enqueue(playlist.videos[0]);
    }

    let playlistEmbed = new EmbedBuilder()
      .setTitle(`${playlist.data.title}`)
      .setDescription(playlist.videos.map((song: Song, index: number) => `${index + 1}. ${song.title}`).join("\n").slice(0, 4095))
      .setURL(playlist.data.url!)
      .setColor("#FF0000")

    const startedPlaylistEmbed = new EmbedBuilder()
      .setDescription(`${greenCheck}` + i18n.__mf("playlist.startedPlaylist", { author: interaction.user.id }))
      .setColor("#FF0000");

    if (interaction.replied)
      return interaction.editReply({
        embeds: [startedPlaylistEmbed, playlistEmbed]
      });
    interaction
      .reply({
        embeds: [startedPlaylistEmbed, playlistEmbed]
      })
      .catch(console.error);
  }
};