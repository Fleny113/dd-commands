import type {
	ApplicationCommand,
	BigString,
	Bot,
	DesiredPropertiesBehavior,
	TransformersDesiredProperties,
} from "@discordeno/bot";
import type { Command, CommandOption, SubCommandDelegate, GetSubCommands } from "./command.js";

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
		// We need to re-define the type of this function because TypeScript can't infer the type of the parameters of this function without any help
		createSubcommandDelegate<
			const TOptions extends CommandOption[],
			TSubCommand extends keyof GetSubCommands<TOptions>,
			TSubCommandNested extends keyof GetSubCommands<TOptions>[TSubCommand] | null,
			TReturnValue = unknown,
			TExtraParams extends unknown[] = [],
		>(
			_command: Command<TProps, TBehavior, TOptions, TCommandContext>,
			_subCommand: TSubCommand,
			subCommandNested:
				| TSubCommandNested
				| SubCommandDelegate<
						TProps,
						TBehavior,
						TOptions,
						TCommandContext,
						TSubCommand,
						null,
						TReturnValue,
						TExtraParams
				  >,
			delegate?: SubCommandDelegate<
				TProps,
				TBehavior,
				TOptions,
				TCommandContext,
				TSubCommand,
				TSubCommandNested,
				TReturnValue,
				TExtraParams
			>,
		) {
			if (delegate === undefined) {
				return subCommandNested;
			}

			return delegate;
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
		 *
		 * @param command The command object
		 * @returns The created command object
		 */
		create: <const TOptions extends CommandOption[]>(
			command: Command<TProps, TBehavior, TOptions, TCommandContext>,
		) => Command<TProps, TBehavior, TOptions, TCommandContext>;
		/**
		 * Create a delegate for a subcommand or subcommand group
		 */
		createSubcommandDelegate: {
			/**
			 * Create a delegate for a subcommand group and a optionally a specific subcommand in the group
			 *
			 * @param command The command object
			 * @param subCommandGroup The subcommand group to create a delegate for
			 * @param subCommand The subcommand in the group to create a delegate for, if not specified it will create a delegate for the group itself
			 * @param delegate The delegate function to run when the subcommand is executed
			 * @returns The created delegate function
			 */
			<
				const TOptions extends CommandOption[],
				TSubCommand extends keyof GetSubCommands<TOptions>,
				TSubCommandNested extends keyof GetSubCommands<TOptions>[TSubCommand] | null,
				TReturnValue = unknown,
				TExtraParams extends unknown[] = [],
			>(
				command: Command<TProps, TBehavior, TOptions, TCommandContext>,
				subCommandGroup: TSubCommand,
				subCommand: TSubCommandNested,
				delegate: SubCommandDelegate<
					TProps,
					TBehavior,
					TOptions,
					TCommandContext,
					TSubCommand,
					TSubCommandNested,
					TReturnValue,
					TExtraParams
				>,
			): SubCommandDelegate<
				TProps,
				TBehavior,
				TOptions,
				TCommandContext,
				TSubCommand,
				TSubCommandNested,
				TReturnValue,
				TExtraParams
			>;
			/**
			 * Create a delegate for a subcommand
			 *
			 * @param command The command object
			 * @param subCommand The subcommand to create a delegate for
			 * @param delegate The delegate function to run when the subcommand is executed
			 * @returns The created delegate function
			 */
			<
				const TOptions extends CommandOption[],
				TSubCommand extends keyof GetSubCommands<TOptions>,
				TReturnValue = unknown,
				TExtraParams extends unknown[] = [],
			>(
				command: Command<TProps, TBehavior, TOptions, TCommandContext>,
				subCommand: TSubCommand,
				delegate: SubCommandDelegate<
					TProps,
					TBehavior,
					TOptions,
					TCommandContext,
					TSubCommand,
					null,
					TReturnValue,
					TExtraParams
				>,
			): SubCommandDelegate<
				TProps,
				TBehavior,
				TOptions,
				TCommandContext,
				TSubCommand,
				null,
				TReturnValue,
				TExtraParams
			>;
		};
		/**
		 * Register all commands
		 *
		 * @param guildId The guild ID to register the commands in, if not specified it will be registered globally
		 * @returns The registered commands
		 */
		register: (guildId?: BigString) => Promise<ApplicationCommand[]>;
	};
};
