import { Client } from "discord.js";


export type Cron = {
    schedule: string;
    name: string;
    job: (client: Client) => void | Promise<void>;
    initialIze?: (client: Client) => void | Promise<void>;
};

export type CronModule = {
    moduleName: string;
    crons: Cron[];
};

export type CronList = CronModule[];

export const jobModules: CronList = [];
