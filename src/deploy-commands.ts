import { REST, Routes } from 'discord.js';
import commandList from './commands/list';
import config from './config';

const commands: any[] = [];

for (const command of commandList) {
	commands.push(command.data.toJSON());
}

const rest = new REST().setToken(config.DISCORD_TOKEN);

console.log(commands);

try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
	const data = await rest.put(Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID), { body: commands }) as unknown[];
	console.log(`Successfully reloaded ${data.length} application (/) commands.`);
} catch (error) {
    console.error(error);
}
