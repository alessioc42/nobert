import {
    SlashCommandBuilder,
    type CommandInteraction,
} from "discord.js";
import { defaultKuchenBase } from "../../database/KuchenBase";

const kuchenPhrases = [
    "Ich bringe Kuchen mit.",
    "Morgen gibt's Kuchen von mir. Beschwerden bitte an mein ungesperrtes Laptop richten.",
    "Ich habe entschieden, das Team kulinarisch zu unterstützen und bringe Kuchen mit.",
    "Breaking News: Ich spendiere Kuchen!",
    "Kuchen für alle. Meine Tastatur bestand darauf.",
    "Wer als Erstes 'Danke' sagt, bekommt das größte Stück Kuchen.",
    "Ich habe heute festgestellt, dass Teilen Freude macht. Deshalb bringe ich Kuchen mit.",
    "Kuchen-Deployment erfolgreich geplant.",
    "Zur Steigerung der Team-Moral bringe ich Kuchen mit.",
    "Mein Laptop hat gerade einen verbindlichen Kuchenvertrag abgeschlossen.",
    "Ich freue mich, bekanntzugeben, dass ich zeitnah Kuchen mitbringe.",
    "Die Geschäftsführung weiß noch nichts davon, aber ich bringe Kuchen mit.",
    "Kuchen as a Service (KaaS) ist ab sofort verfügbar.",
    "Aus Gründen der Benutzerfreundlichkeit bringe ich Kuchen mit.",
    "Bitte dieses Ticket schließen: Kuchenlieferung wurde beauftragt.",
    "Ich investiere in die Zukunft unseres Teams. In Form von Kuchen.",
    "Zur Wahrung des Betriebsfriedens bringe ich Kuchen mit.",
    "Mein Passwort wurde zwar nicht geändert, aber mein Lebensziel: Kuchen mitbringen.",
    "KI hat mir geraten, Kuchen mitzubringen. Wer bin ich, ihr zu widersprechen?",
    "Ich möchte mich bei allen für meine Produktivität bedanken und bringe deshalb Kuchen mit.",
    "Als Wiedergutmachung für mein ungesperrtes Gerät gibt es Kuchen.",
    "Heute ich. Morgen vielleicht euer Laptop.",
    "Ich habe eine wichtige Entscheidung getroffen: Kuchen.",
    "Meeting-Einladung folgt. Agenda: Kuchen.",
    "Um Gerüchten vorzubeugen: Ja, ich bringe Kuchen mit.",
    "Mein Laptop wurde unbeaufsichtigt gelassen. Die Konsequenzen sind köstlich.",
    "Ich habe das Kleingedruckte gelesen. Offenbar schulde ich jetzt Kuchen.",
    "Kuchen ist unterwegs. ETA: Irgendwann, wenn ich daran denke.",
    "Die Kucheninitiative wurde einstimmig angenommen.",
    "Diese Nachricht wurde von einer unabhängigen Tastatur verfasst.",
    "Ohne Mampf keinen Kampf, ohne Torte keine Worte.",
];

export default {
    data: new SlashCommandBuilder()
        .setName("ichbringekuchenmit")
        .setDescription("Spread Kuchen."),

    async execute(interaction: CommandInteraction) {
        if (!interaction.channel?.isTextBased()) {
            await interaction.reply({
                content: "Dieser Befehl funktioniert nur in Textkanälen.",
                ephemeral: true,
            });
            return;
        }

        const randomPhrase =
            kuchenPhrases[
                Math.floor(Math.random() * kuchenPhrases.length)
            ];

        const kuchenId = defaultKuchenBase.addKuchen(
            interaction.user.id,
            interaction.user.displayName,
        );

        try {
            await interaction.reply(randomPhrase);
        } catch (error) {
            // Eintrag zurücknehmen, wenn die Nachricht nicht
            // erfolgreich veröffentlicht werden konnte.
            defaultKuchenBase.deleteKuchen(kuchenId);

            console.error(
                "[KuchenCommand] Nachricht konnte nicht gesendet werden:",
                error,
            );

            throw error;
        }
    },
};