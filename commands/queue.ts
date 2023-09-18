import {
  ChatInputCommandInteraction,
  CommandInteraction,
  EmbedBuilder,
  MessageReaction,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
  User
} from "discord.js";
import { bot } from "../index";
import { Song } from "../structs/Song";
import { i18n } from "../utils/i18n";

const { redX } = require('../variables/logos.js');

export default {
  data: new SlashCommandBuilder().setName("queue").setDescription(i18n.__("queue.description")),
  cooldown: 5,
  permissions: [PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.ManageMessages],
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = bot.queues.get(interaction.guild!.id);
    
    if (!queue || !queue.songs.length) {
      const errorEmbed = new EmbedBuilder()
        .setDescription(`${redX}` + i18n.__("nowplaying.errorNotQueue"))
        .setColor("#FF0000");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
    }
    let currentPage = 0;
    const embeds = generateQueueEmbed(interaction, queue.songs);
    
    const loadingEmbed = new EmbedBuilder()
      .setDescription("Loading queue...")
      .setColor("#FF0000");

    await interaction.reply({
      embeds: [loadingEmbed],
    });

    if (interaction.replied)
      await interaction.editReply({
        embeds: [embeds[currentPage]]
      });

    const queueEmbed = await interaction.fetchReply();

    try {
      await queueEmbed.react("⬅️");
      await queueEmbed.react("⏹");
      await queueEmbed.react("➡️");
    } 
    catch (error: any) {
      console.error(error);
      (interaction.channel as TextChannel).send(error.message).catch(console.error);
    }

    const filter = (reaction: MessageReaction, user: User) =>
      ["⬅️", "⏹", "➡️"].includes(reaction.emoji.name!) && interaction.user.id === user.id;

    const collector = queueEmbed.createReactionCollector({ filter, time: 60000 });

    collector.on("collect", async (reaction, user) => {
      try {
        if (reaction.emoji.name === "➡️") {
          if (currentPage < embeds.length - 1) {
            currentPage++;
            queueEmbed.edit({
              content: i18n.__mf("queue.currentPage", { page: currentPage + 1, length: embeds.length }),
              embeds: [embeds[currentPage]]
            });
          }
        } 
        else if (reaction.emoji.name === "⬅️") {
          if (currentPage !== 0) {
            --currentPage;
            queueEmbed.edit({
              content: i18n.__mf("queue.currentPage", { page: currentPage + 1, length: embeds.length }),
              embeds: [embeds[currentPage]]
            });
          }
        } 
        else {
          collector.stop();
          reaction.message.reactions.removeAll();
        }
        await reaction.users.remove(interaction.user.id);
      } 
      catch (error: any) {
        console.error(error);
        return (interaction.channel as TextChannel).send(error.message).catch(console.error);
      }
    });
  }
};

function generateQueueEmbed(interaction: CommandInteraction, songs: Song[]) {
  let embeds = [];
  let k = 10;

  for (let i = 0; i < songs.length; i += 10) {
    const current = songs.slice(i, k);
    let j = i;
    k += 10;

    const info = current.map((track) => `${++j} - [${track.title}](${track.url})`).join("\n");

    const embed = new EmbedBuilder()
      .setTitle(i18n.__("queue.embedTitle"))
      .setThumbnail(interaction.guild?.iconURL()!)
      .setColor("#FF0000")
      .setDescription(i18n.__mf("queue.embedCurrentSong", { title: songs[0].title, url: songs[0].url, info: info }))
      .setFooter({ text: `Pages: ${Math.ceil(songs.length / 10)}` })
    embeds.push(embed);
  }

  return embeds;
};