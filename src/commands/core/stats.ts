import { SlashCommandBuilder } from "discord.js";
import type { CommandInteraction } from "discord.js";
import { defaultMemeBase } from "../../database/memebase";
import { renderStats, type StatsRendererOptions } from "../../services/images/statsRenderer";
import { defaultKnowledgebase } from "../../database/knowledgebase";

export default {
    data: new SlashCommandBuilder().setName("leaderboards").setDescription(
        "Different leaderboards.",
    )
        .addSubcommand((subcommand) =>
            subcommand.setName("knowledgebase").setDescription(
                "Leaderboard about the knowledgebase",
            )
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("memes").setDescription(
                "Leaderboard about the memebase",
            )
        ),
    async execute(interaction: CommandInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "knowledgebase") {
            const leaderboard = await defaultKnowledgebase.leaderboardByAuthor();

            const leaderboardWithAvatars = await leaderBoardInjectProfilePictures(interaction, {
                title: "Knowledgebase Leaderboard",
                subtitle: "Top 5 contributors",
                persons: leaderboard.map((entry) => ({
                    name: entry.name,
                    displayname: entry.displayname,
                    avatarURL: "",
                    value: entry.value,
                })),
            });

            const render = await renderStats(leaderboardWithAvatars);

            interaction.reply({
                files: [render],
            });
        } else if (subcommand === "memes") {
            const leaderboard = await defaultMemeBase.leaderboardByAuthor();

            const leaderboardWithAvatars = await leaderBoardInjectProfilePictures(interaction, {
                title: "Meme Leaderboard",
                subtitle: "Top 5 meme contributors",
                persons: leaderboard.map((entry) => ({
                    name: entry.name,
                    displayname: entry.displayname,
                    avatarURL: "",
                    value: entry.value,
                })),
            });

            const render = await renderStats(leaderboardWithAvatars);

            interaction.reply({
                files: [render],
            });
        }
    },
};


async function leaderBoardInjectProfilePictures(interaction: CommandInteraction, data: StatsRendererOptions): Promise<StatsRendererOptions> {
    if (interaction.guild?.members.cache.size === 0) {
        await interaction.guild?.members.fetch();
    }

    const members = interaction.guild?.members.cache;

    members?.map((member, key, collection) => {
        if (data.persons.some((person) => person.name === member.user.tag)) {
            const person = data.persons.find((person) => person.name === member.user.tag);
            if (person) {
                person.avatarURL = member.user.displayAvatarURL({ extension: "png" });
                person.displayname = member.displayName;
            }
        }
    })

    // Fill in default avatar URLs for any missing ones
    data.persons.forEach((person) => {
        if (!person.avatarURL) {
            person.avatarURL = "https://cdn.discordapp.com/embed/avatars/0.png";
        }
    });

    return data;
}