import type {
	ApplicationCommand,
	BigString,
	Bot,
	DesiredPropertiesBehavior,
	TransformersDesiredProperties,
} from "@discordeno/bot";
import type { Command, CommandOption } from "./command.js";

export function useCommands<
	TCommandContext extends object,
	TProps extends TransformersDesiredProperties = TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior = DesiredPropertiesBehavior.RemoveKey,
	TBot extends Bot<TProps, TBehavior> = Bot<TProps, TBehavior>,
>(
	rawBot: Bot<TProps, TBehavior> & TBot,
	// For now, we don't need any options, this is for inferring the context type
	_options: { context: TCommandContext },
): BotWithCommands<TProps, TBehavior, TBot, TCommandContext> {
	const bot = rawBot as BotWithCommands<TProps, TBehavior, TBot, TCommandContext>;

	bot.commands = {
		mapping: new Map(),
		create(command) {
			bot.commands.mapping.set(command.name, command as Command<TProps, TBehavior>);
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

/**
 * Specify the type of the context to be used in commands
 */
export function useContext<T>(): T {
	return undefined as unknown as T;
}

export type BotWithCommands<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
	TCommandContext extends object,
> = TBot & {
	/**
	 * dd-commands functions & data
	 */
	commands: {
		/**
		 * The mapping of command names to their respective command objects
		 */
		mapping: Map<string, Command<TProps, TBehavior, CommandOption[], TCommandContext>>;
		/**
		 * Create a new command
		 */
		create: <const TOptions extends CommandOption[]>(
			command: Command<TProps, TBehavior, TOptions, TCommandContext>,
		) => Command<TProps, TBehavior, TOptions, TCommandContext>;
		/**
		 * Register all commands
		 *
		 * @param guildId The guild ID to register the commands in, if not specified it will be registered globally
		 * @returns The registered commands
		 */
		register: (guildId?: BigString) => Promise<ApplicationCommand[]>;
	};
};
