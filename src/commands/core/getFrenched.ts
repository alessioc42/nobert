import { SlashCommandBuilder } from 'discord.js';
import type { CommandInteraction } from 'discord.js';

const frenchPhrases = [
    "Omelette du fromage",
    "Hon hon hon, baguette!",
    "C'est la vie!",
    "Sacré bleu!",
    "Je ne sais quoi",
    "Voulez-vous coucher avec moi?",
    "Mon dieu!",
    "Croissant croissant baguette baguette",
    "Je suis une baguette",
    "Bonjour, you filthy casual",
    "I surrender! 🏳️ (Just kidding... or am I?)",
    "Le fishe au chocolat",
    "Mais oui oui, mon ami!",
    "C'est magnifique!",
    "Zut alors!",
    "Oh là là!",
    "Putain de merde!",
    "Ça alors!",
    "Tu es une baguette magique",
    "Je t'aime... like I love my croissants",
    "Excuse my French... wait, that's literally French",
    "Wee wee, I mean OUI OUI",
    "The revolution will be baguette-ized",
    "Liberté, Égalité, Baguetté!",
    "Je m'appelle Claude, enchanté!",
    "Voulez-vous un croissant?",
    "Rendez-vous with destiny (and cheese)",
    "C'est pas faux!",
    "Bof...",
    "N'importe quoi!"
];

const frenchEmojis = ["🇫🇷", "🥖", "🧀", "🍷", "🥐", "🗼"];

export default {
    data: new SlashCommandBuilder().setName("get-frenched").setDescription("Spread love."),
    async execute(interaction: CommandInteraction) {

        const randomPhrase = frenchPhrases[Math.floor(Math.random() * frenchPhrases.length)];
        const randomEmoji = frenchEmojis[Math.floor(Math.random() * frenchEmojis.length)];

        const channel = interaction.channel;
        if (!channel?.isTextBased()) {
            await interaction.reply("Only works in text channels");
            return;
        }

        const messages = await channel.messages.fetch({ limit: 5 });
        const lastUserMessage = messages.find(msg => !msg.author.bot && msg.id !== interaction.id);
        if (!lastUserMessage) {
            await interaction.reply(`${randomPhrase} ${randomEmoji}\n(No previous message was found.)`);
            return;
        }

        await interaction.reply(`${lastUserMessage.author} ${randomPhrase} ${randomEmoji}`);
    },
};