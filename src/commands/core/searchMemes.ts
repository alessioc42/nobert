import { SlashCommandBuilder } from 'discord.js';
import type { CommandInteraction,  } from 'discord.js';
import { defaultMemeBase } from '../../memebase/database';

export default {
	data: new SlashCommandBuilder().setName('memes')
    .setDescription('Interact with the Memes database')
    .addSubcommand(subcommand => 
        subcommand
            .setName('search')
            .setDescription('Search for memes by keyword')
            .addStringOption(option => 
                option
                    .setName('keyword')
                    .setDescription('Keyword to search for')
                    .setRequired(true)
            )
            .addIntegerOption(option => 
                option
                    .setName('limit')
                    .setDescription('Number of results to return (default 1, max 5)')
                    .setRequired(false)
            )
            .addIntegerOption(option => 
                option
                    .setName('range')
                    .setDescription('Time range in days to search within (default 14)')
                    .setRequired(false))
            .addIntegerOption(option => 
                option
                    .setName('rangestart')
                    .setDescription('How many days ago to start the search from (default 0)')
                    .setRequired(false)
            )
                
    )
    .addSubcommand(subcommand => 
        subcommand
            .setName('random')
            .setDescription('Get a random meme from memebase')
    ),
	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'search') {
            const keyword = interaction.options.getString('keyword', true);
            const limit = Math.min(interaction.options.getInteger('limit') ?? 1, 5);
            const rangeDays = interaction.options.getInteger('range') ?? 14;
            const rangeStartDays = interaction.options.getInteger('rangestart') ?? 0;
            await interaction.reply(`🔃 Searching "${keyword}"`);
            
            // calculate date range
            const now = new Date();
            const end = new Date(now.getTime() - rangeStartDays * 24 * 60 * 60 * 1000);
            const start = new Date(end.getTime() - rangeDays * 24 * 60 * 60 * 1000);

            const results = await defaultMemeBase.searchMemes(keyword, {
                startDate: start,
                endDate: end,
                limit,
            });

            if (results.length === 0) {
                await interaction.editReply(`No memes found for "${keyword}"`);
                return;
            }

            await interaction.editReply({
                content: `Found ${results.length} meme(s) for "${keyword}":`,
                files: results.slice(0, 5).map(meme => ({
                    attachment: Buffer.from(meme.content),
                    name: `meme_${meme.id}.png`,
                })),
            })
        } else if (subcommand === 'random') {
            await interaction.reply(`🔃 Fetching a random meme`)
            const meme = await defaultMemeBase.randomMeme();
            if (!meme) {
                await interaction.editReply(`No memes found in the database.`);
                return;
            }
            await interaction.editReply({
                files: [{
                    attachment: Buffer.from(meme.content),
                    name: `meme_${meme.id}.png`,
                }],
            })
        } else {
            await interaction.reply('Unknown subcommand.');
        }
	},
};
