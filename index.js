require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const registry = require('./games/registry');

const PREFIX = process.env.PREFIX || ',';
const PAGE_TIMEOUT_MS = 5 * 60 * 1000; // buttons stop working 5 min after the last click

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Fetch is online as ${client.user.tag}`);
  const supported = [...registry.keys()].join(', ');
  console.log(`Supported prefixes: ${supported}`);
});

function buildEmbed(gameModule, results, index) {
  const card = results[index];
  const total = results.length;

  const embed = new EmbedBuilder()
    .setTitle(card.name)
    .setColor(0x5865f2);

  if (card.imageUrl) embed.setImage(card.imageUrl);
  if (card.description) embed.setDescription(card.description);
  if (card.link) embed.setURL(card.link);

  const footerText =
    total > 1
      ? `${gameModule.label} · ${card.subtitle ? card.subtitle + ' · ' : ''}${index + 1} of ${total}`
      : `${gameModule.label}${card.subtitle ? ' · ' + card.subtitle : ''}`;
  embed.setFooter({ text: footerText });

  return embed;
}

function buildRow(index, total) {
  if (total <= 1) return null;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('fetch_prev')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index === 0),
    new ButtonBuilder()
      .setCustomId('fetch_next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index === total - 1),
  );

  return row;
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  // ",mtg Black Lotus" -> command = "mtg", query = "Black Lotus"
  const withoutPrefix = message.content.slice(PREFIX.length);
  const firstSpace = withoutPrefix.indexOf(' ');
  if (firstSpace === -1) return; // no query given, ignore

  const command = withoutPrefix.slice(0, firstSpace).toLowerCase();
  const query = withoutPrefix.slice(firstSpace + 1).trim();
  if (!query) return;

  const gameModule = registry.get(command);
  if (!gameModule) return; // not a recognized prefix, ignore silently

  try {
    const results = await gameModule.search(query);

    if (!results || results.length === 0) {
      await message.reply(`Couldn't find a **${gameModule.label}** card matching "${query}".`);
      return;
    }

    let index = 0;
    const sent = await message.reply({
      embeds: [buildEmbed(gameModule, results, index)],
      components: buildRow(index, results.length) ? [buildRow(index, results.length)] : [],
    });

    if (results.length <= 1) return; // nothing to page through, no collector needed

    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: PAGE_TIMEOUT_MS,
    });

    collector.on('collect', async (interaction) => {
      // Only the person who ran the command can page through it.
      if (interaction.user.id !== message.author.id) {
        await interaction.reply({ content: "This isn't your search - run the command yourself to browse it.", ephemeral: true });
        return;
      }

      if (interaction.customId === 'fetch_prev') index = Math.max(0, index - 1);
      if (interaction.customId === 'fetch_next') index = Math.min(results.length - 1, index + 1);

      await interaction.update({
        embeds: [buildEmbed(gameModule, results, index)],
        components: [buildRow(index, results.length)],
      });
    });

    collector.on('end', async () => {
      // Buttons stop working after the timeout - disable them so it's visually obvious.
      try {
        const disabledRow = buildRow(index, results.length);
        disabledRow.components.forEach((b) => b.setDisabled(true));
        await sent.edit({ components: [disabledRow] });
      } catch {
        // message may have been deleted - nothing to do
      }
    });
  } catch (err) {
    console.error(`[${command}] search failed for "${query}":`, err);
    await message.reply(`Something went wrong looking that up. Try again in a bit.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
