import {
    Client,
    Events,
    MessageFlags,
} from "discord.js";

import commandList from "./list";
import config from "../config";

function setupCommands(client: Client) {
    const commands = new Map<string, any>();
    for (const command of commandList) {
        commands.set(command.data.name, command);
    }

    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.guild?.id !== config.DISCORD_GUILD_ID || interaction.guild?.id === undefined) {
            return false;
        }

        if (!interaction.isChatInputCommand()) return;
        const command = commands.get(
            interaction.commandName,
        );

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`,
            );
            return false;
        }

        try {
            // @ts-ignore this is set in all files.
            await command.execute(interaction);
            return true;
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            }
            return false;
        }
    });
}
export default setupCommands;
