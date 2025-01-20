import type {
	ApplicationCommand,
	BigString,
	Bot,
	DesiredPropertiesBehavior,
	TransformersDesiredProperties,
} from "@discordeno/bot";
import type { Command, CommandOption } from "./command.js";

export function useCommands<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
>(rawBot: Bot<TProps, TBehavior> & TBot): BotWithCommands<TProps, TBehavior, TBot> {
	const bot = rawBot as BotWithCommands<TProps, TBehavior, TBot>;

	bot.commands = {
		mapping: new Map(),
		create(command) {
			bot.commands.mapping.set(command.name, command as Command<TProps, TBehavior, TBot>);
			return command;
		},
		register(guildId) {
			if (guildId) {
				return bot.helpers.upsertGuildApplicationCommands(guildId, [...bot.commands.mapping.values()]);
			}

			return bot.helpers.upsertGlobalApplicationCommands([...bot.commands.mapping.values()]);
		},
	};

	return bot;
}

export type BotWithCommands<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
> = TBot & {
	/**
	 * dd-commands functions & data
	 */
	commands: {
		/**
		 * The mapping of command names to their respective command objects
		 */
		mapping: Map<string, Command<TProps, TBehavior, TBot>>;
		/**
		 * Create a new command
		 */
		create: <const TOptions extends CommandOption[]>(
			command: Command<TProps, TBehavior, TBot, TOptions>,
		) => Command<TProps, TBehavior, TBot, TOptions>;
		/**
		 * Register all commands
		 *
		 * @param guildId The guild ID to register the commands in, if not specified it will be registered globally
		 * @returns The registered commands
		 */
		register: (guildId?: BigString) => Promise<ApplicationCommand[]>;
	};
};
