import { REST, Routes } from 'discord.js';
import { clientId, guildId, token } from '../token.json';
import commandList from './commands/list';

const commands: any[] = [];

for (const command of commandList) {
	commands.push(command.data.toJSON());
}

const rest = new REST().setToken(token);

console.log(commands);

try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
	const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands }) as unknown[];
	console.log(`Successfully reloaded ${data.length} application (/) commands.`);
} catch (error) {
    console.error(error);
}
