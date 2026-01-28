import {
    Client,
    Events,
    MessageFlags,
} from "discord.js";

import commandList from "./list";

function setupCommands(client: Client) {
    const commands = new Map<string, any>();
    for (const command of commandList) {
        commands.set(command.data.name, command);
    }

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        const command = commands.get(
            interaction.commandName,
        );

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`,
            );
            return;
        }

        try {
            // @ts-ignore this is set in all files.
            await command.execute(interaction);
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
        }
    });
}
export default setupCommands;
