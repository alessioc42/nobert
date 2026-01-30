import { SlashCommandBuilder } from 'discord.js';
import type { CommandInteraction } from 'discord.js';
import { defaultKnowledgebase } from '../../database/knowledgebase';

// TODO: markdown escape sequences in user input

export default {
    data: new SlashCommandBuilder().setName('search').setDescription('Search the knowledgebase for anything.').addStringOption(option =>
        option.setName('query')
            .setDescription('The search query')
            .setRequired(true))
        .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('Number of results to return (default 10, max 50)')
            .setRequired(false))
        .addIntegerOption(option =>
        option.setName('page')
            .setDescription('Page number for paginated results (default 1)')
            .setRequired(false)),
    async execute(interaction: CommandInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const query = interaction.options.getString('query', true);
        const limit = Math.min(interaction.options.getInteger('limit') ?? 10, 50);
        const page = Math.max((interaction.options.getInteger('page') ?? 1) - 1, 0);

        const startTime = Date.now();
        const results = await defaultKnowledgebase.searchPosts(query, limit, page * limit);

        if (results.length === 0) {
            await interaction.reply(`❌ No results found for "${query}".`);
            return;
        }

        let replyMessage = `### Results for \`${query}\`:\n`;

        results.forEach((result, index) => {
            replyMessage += `> **${index + 1 + page * limit}.** ${result.hasImage ? "🖼️" : "💬"} [${escapeMarkdown(result.preview)}](${result.messageURL}) by **${escapeMarkdown(result.authorDisplayName || result.author)}** *on ${new Date(result.createdAt).toLocaleDateString("de")}*\n`;
        });

        await interaction.reply({
            content: replyMessage,
        });
    },
};

function escapeMarkdown(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/`/g, '\\`')
        .replace(/~/g, '\\~')
        .replace(/>/g, '\\>')
        .replace(/\|/g, '\\|')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');
    }