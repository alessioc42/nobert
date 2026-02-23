import type { CronModule } from "../list";

const module: CronModule = {
    moduleName: "timetable",
    crons: [
        {
            name: "Refresh timetable & Check for updates",
            schedule: "*/20 * * * *", // Every 20 minutes
            job: async (client) => {
                
            }
        }
    ],
}