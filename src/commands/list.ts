import ping from "./core/ping";
import searchMemes from "./core/searchMemes";
import searchKnowledgebase from "./core/searchKnowledgebase";
import stats from "./core/stats";

import getFrenched from "./core/getFrenched"
import type { CommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

type Command = {
    enabled?: boolean;
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
};

let commands : Command[] = [
    ping, searchMemes, searchKnowledgebase, stats, getFrenched
]

commands = commands.filter(cmd => cmd.enabled === undefined || cmd.enabled);

export default commands