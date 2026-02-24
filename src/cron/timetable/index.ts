import type { Client, TextChannel } from "discord.js";
import config from "../../config";
import type { CronModule } from "../list";
import { raplaEventsFor, type Event } from "./rapla";
import fs from "fs";



export default <CronModule>{
    moduleName: "timetable",
    crons: [
        {
            name: "Refresh timetable & Check for updates",
            schedule: config.RAPLA_POLLING_CRON!,
            initialIze: checkForUpdates,
            job: checkForUpdates,
            enabled: config.RAPLA_ENABLE,
        }
    ],
}

async function checkForUpdates(client: Client) {
    const today = new Date();
    const raplaNew = await raplaEventsFor(config.RAPLA_COURSE_URL!, today);
    if (!fs.existsSync(config.RAPLA_SAVEPATH!)) {
        fs.writeFileSync(config.RAPLA_SAVEPATH!, JSON.stringify(raplaNew, null, 2));
        return;
    }
    const raplaOld = JSON.parse(fs.readFileSync(config.RAPLA_SAVEPATH!, "utf-8"));
    fs.writeFileSync(config.RAPLA_SAVEPATH!, JSON.stringify(raplaNew, null, 2));

    const relevantNewEvents = getRelevantRaplaEvents(raplaNew);
    const relevantOldEvents = getRelevantRaplaEvents(raplaOld);

    // check if different
    if (JSON.stringify(relevantNewEvents) !== JSON.stringify(relevantOldEvents)) {
        const channel = await client.channels.cache.get(config.RAPLA_DISCORD_CHANNEL_ID!) as TextChannel;
        const diff = {
            added: <Event[]>[],
            removed: <Event[]>[],
        };
        // compare string reprentations of events to find differences
        for (const newEvent of relevantNewEvents) {
            if (!relevantOldEvents.some(oldEvent => JSON.stringify(oldEvent) === JSON.stringify(newEvent))) {
                diff.added.push(newEvent);
            }
        }
        for (const oldEvent of relevantOldEvents) {
            if (!relevantNewEvents.some(newEvent => JSON.stringify(newEvent) === JSON.stringify(oldEvent))) {
                diff.removed.push(oldEvent);
            }
        }

        if (diff.added.length === 0 && diff.removed.length === 0) {
            return;
        }

        const now = new Date();

        let message = "## Stundenplan Änderung:\n\n  @everyone";
        if (diff.added.length > 0) {
            message += "### Hinzugefügt:\n";
            for (const event of diff.added) {
                message += `- ${formatRaplaEventForChat(event)}\n`;
            }
        }
        if (diff.removed.length > 0) {
            message += "### Entfernt:\n";
            for (const event of diff.removed) {
                message += `- ~~${formatRaplaEventForChat(event)}~~\n`;
            }
        }
        message += `## Vorschau der nächsten 7 Tage:\n`;
        relevantNewEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        for (const event of relevantNewEvents) {
            const eventDate = new Date(event.start);
            if (eventDate.getTime() > now.getTime()) {
                message += `- ${formatRaplaEventForChat(event)}\n`;
            }
        }

        await channel.send(message);
    }
}

const notificationMaxLookahead = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
function getRelevantRaplaEvents(raplaEvents: Event[]) {
    const today = new Date();
    return raplaEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.getTime() - today.getTime() < notificationMaxLookahead && eventDate.getTime() > today.getTime();
    });
}


function formatRaplaEventForChat(event: Event) {
    // example: **Lineare Algebra** (*KW 3* **12:23 - 23:10**) *STG Online-Veranstaltung, STG-TINF25E-CS*
    const formatDate = (date: Date) => {
        return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    return `**${event.main}** (*KW ${event.KW}* **${formatDate(new Date(event.start))} - ${formatDate(new Date(event.end))}**) *${event.resources.join(", ")}*`;
}
