const { EmbedBuilder } = require("discord.js");
const { useMainPlayer, QueryType } = require("discord-player");

const channelId = "Your Channel ID HERE";
const commandsList = [
  "s",
  "skip",
  "p",
  "pause",
  "r",
  "resume",
  "q",
  "queue",
  "stop",
];

module.exports = async (client, message) => {
  if (message.channel.id !== channelId) return;
  if (message.author.bot) return;

  const player = useMainPlayer();

  const song = message.content;
  const res = await player.search(song, {
    requestedBy: message.member,
    searchEngine: QueryType.AUTO,
  });
  const NoResultsEmbed = new EmbedBuilder()
    .setAuthor({ name: `No results found... try again ? ❌` })
    .setColor("#2f3136");

  if (!res || !res.tracks.length)
    return message.reply({ embeds: [NoResultsEmbed] });

  const queue = player.nodes.create(message.guild, {
    metadata: message.channel,
    spotifyBridge: client.config.opt.spotifyBridge,
    volume: client.config.opt.volume,
    leaveOnEmpty: client.config.opt.leaveOnEmpty,
    leaveOnEmptyCooldown: client.config.opt.leaveOnEmptyCooldown,
    leaveOnEnd: client.config.opt.leaveOnEnd,
    leaveOnEndCooldown: client.config.opt.leaveOnEndCooldown,
  });

  if (commandsList.includes(song?.toLowerCase())) {
    switch (song?.toLowerCase()) {
      case "p":
      case "pause":
        await queue.node.pause();
        break;
      case "r":
      case "resume":
        await queue.node.resume();
        break;
      case "s":
      case "skip":
        await queue.node.skip();
        break;
      case "stop":
        await queue.node.stop();
        break;
      case "q":
      case "queue":
        const songs = queue.tracks.size;

        const nextSongs =
          songs > 5
            ? `And **${songs - 5}** other song(s)...`
            : `In the playlist **${songs}** song(s)...`;

        const tracks = queue.tracks.map(
          (track, i) =>
            `**${i + 1}** - ${track.title} | ${track.author} (requested by : ${
              track.requestedBy.username
            })`
        );

        const queueEmbed = new EmbedBuilder()
          .setColor("#2f3136")
          .setAuthor({
            name: `Music Queue`,
            iconURL: client.user.displayAvatarURL({
              size: 1024,
              dynamic: true,
            }),
          })
          .setDescription(
            `Current ${queue.currentTrack.title}\n\n${tracks
              .slice(0, 5)
              .join("\n")}\n\n${nextSongs}`
          )
          .setTimestamp()
          .setFooter({
            text: "Music comes first - Made with heart by AwadBilal ❤️",
          });

        await message.reply({ embeds: [queueEmbed] });
      default:
        break;
    }

    return;
  }

  try {
    if (!queue.connection) await queue.connect(message.member.voice.channel);
  } catch {
    queue.delete();

    const NoVoiceEmbed = new EmbedBuilder()
      .setAuthor({ name: `I can't join the voice channel... try again ? ❌` })
      .setColor("#2f3136");

    return message.reply({ embeds: [NoVoiceEmbed] });
  }

  const playEmbed = new EmbedBuilder()
    .setAuthor({
      name: `Loading your ${
        res.playlist ? "playlist" : "track"
      } to the queue... ✅`,
    })
    .setColor("#2f3136");

  await message.reply({ embeds: [playEmbed] });

  res.playlist ? queue.addTrack(res.tracks) : queue.addTrack(res.tracks[0]);

  if (!queue.isPlaying()) await queue.node.play();
};
