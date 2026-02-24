import { Client } from "discord.js";
import Baker from "cronbake";
import { jobModules } from "./list";

export function initializeCrons(client: Client) {
    const baker = Baker.create();

    for (const module of jobModules) {
        if (module.enabled === false) {
            continue;
        }
        for (const cron of module.crons) {
            if (cron.enabled === false) continue;
            if (cron.initialIze) {
                cron.initialIze(client);
            }
            const name = `${module.moduleName} - ${cron.name}`;
            baker.add({
                name: name,
                cron: cron.schedule,
                callback: () => {
                    console.log(`CRON EXEC: ${name}`);
                    cron.job(client);
                },
            });
        }
    }
    baker.bakeAll();
}
