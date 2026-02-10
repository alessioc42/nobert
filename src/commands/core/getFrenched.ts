import { SlashCommandBuilder } from 'discord.js';
import type { CommandInteraction } from 'discord.js';

export default {
    data: new SlashCommandBuilder().setName("get-frenched").setDescription("Spread love."),
    async execute(interaction: CommandInteraction) {
        const frenchPhrases = [
            "Bâtard",
            "Aller au diable",
            "Ça me fait chier",
            "Avoir un balai dans le cul",
            "Abruti",
            "Bouseux",
            "Ça me gonfle",
            "Ça pue",
            "Casse-toi",
            "Casse-toi, pov' con",
            "Crétin",
            "Dégage",
            "Enculé",
            "Espèce de con",
            "Ferme ta gueule",
            "Fils de pute",
            "Foutre le camp",
            "Gogol",
            "Grosse vache",
            "La ferme!",
            "Lèche-cul",
            "Mange merde",
            "Nique ta mère",
            "Pisseux",
            "Putain",
            "Rien à foutre",
            "T'es chiant(e) comme la pluie",
            "T'es qu'une merde",
            "Trou du cul",
            "Tête de noeud"
        ];

        const frenchEmojis = ["🇫🇷", "🥖", "🧀", "🍷", "🥐", "🗼"];

        const randomPhrase = frenchPhrases[Math.floor(Math.random() * frenchPhrases.length)];
        const randomEmoji = frenchEmojis[Math.floor(Math.random() * frenchEmojis.length)];

        try {
            const channel = interaction.channel;
            if (!channel?.isTextBased()) {
                await interaction.reply("Only works in text channels");
                return;
            }

            const messages = await channel.messages.fetch({ limit: 100 });
            const lastUserMessage = messages.find(msg => !msg.author.bot && msg.id !== interaction.id);
            if (!lastUserMessage) {
                await interaction.reply(`${randomPhrase} ${randomEmoji}\n(No previous message was found.)`);
                return;
            }

            await interaction.reply(`${lastUserMessage.author} ${randomPhrase} ${randomEmoji}`);
        } catch (error) {
            console.error("Failed to fetch the message", error);
            await interaction.reply("An error occured while executing the command");
        }
    },
};