import type {
	ApplicationCommandOptionTypes,
	Bot,
	Camelize,
	CreateApplicationCommand,
	DesiredPropertiesBehavior,
	DiscordApplicationCommandOption,
	InteractionResolvedData,
	TransformersDesiredProperties,
} from "@discordeno/bot";

export type Command<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
	TOptions extends CommandOption[] = CommandOption[],
> = CreateApplicationCommand & {
	/** @inheritdoc */
	options?: TOptions;
	/** Function to run when the interaction is executed */
	run: (
		interaction: TBot["transformers"]["$inferredTypes"]["interaction"],
		options: GetCommandOptions<TProps, TBehavior, TBot, TOptions>,
	) => unknown;
};

export type CommandOption = Camelize<DiscordApplicationCommandOption>;

export type GetCommandOptions<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
	T extends CommandOption[],
> = T extends CommandOption[]
	? { [Prop in keyof BuildOptions<TProps, TBehavior, TBot, T>]: BuildOptions<TProps, TBehavior, TBot, T>[Prop] }
	: never;

// Option parsing

type ResolvedValues<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
> = InteractionResolvedData<TProps, TBehavior>;

export type InteractionResolvedChannel<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
> = Omit<
	TBot["transformers"]["$inferredTypes"]["channel"],
	Exclude<
		keyof TBot["transformers"]["$inferredTypes"]["channel"],
		"id" | "name" | "type" | "permissions" | "threadMetadata" | "parentId"
	>
>;
export type InteractionResolvedMember<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
> = Omit<TBot["transformers"]["$inferredTypes"]["member"], "user" | "deaf" | "mute">;

export interface InteractionResolvedUser<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
> {
	user: TBot["transformers"]["$inferredTypes"]["user"];
	member: InteractionResolvedMember<TProps, TBehavior, TBot>;
}

/**
 * From here SubCommandGroup and SubCommand are missing, this is wanted.
 *
 * The entries are sorted based on the enum value
 */
type TypeToResolvedMap<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
> = {
	[ApplicationCommandOptionTypes.String]: string;
	[ApplicationCommandOptionTypes.Integer]: number;
	[ApplicationCommandOptionTypes.Boolean]: boolean;
	[ApplicationCommandOptionTypes.User]: InteractionResolvedUser<TProps, TBehavior, TBot>;
	[ApplicationCommandOptionTypes.Channel]: InteractionResolvedChannel<TProps, TBehavior, TBot>;
	[ApplicationCommandOptionTypes.Role]: TBot["transformers"]["$inferredTypes"]["role"];
	[ApplicationCommandOptionTypes.Mentionable]:
		| TBot["transformers"]["$inferredTypes"]["role"]
		| InteractionResolvedUser<TProps, TBehavior, TBot>;
	[ApplicationCommandOptionTypes.Number]: number;
	[ApplicationCommandOptionTypes.Attachment]: TBot["transformers"]["$inferredTypes"]["attachment"];
};

type ConvertTypeToResolved<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
	T extends ApplicationCommandOptionTypes,
> = T extends keyof TypeToResolvedMap<TProps, TBehavior, TBot>
	? TypeToResolvedMap<TProps, TBehavior, TBot>[T]
	: ResolvedValues<TProps, TBehavior>;

type SubCommandApplicationCommand =
	| ApplicationCommandOptionTypes.SubCommand
	| ApplicationCommandOptionTypes.SubCommandGroup;
type GetOptionName<T> = T extends { name: string } ? T["name"] : never;
type GetOptionValue<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
	T,
> = T extends {
	type: ApplicationCommandOptionTypes;
	required?: boolean;
}
	? T extends { type: SubCommandApplicationCommand; options?: CommandOption[] }
		? BuildOptions<TProps, TBehavior, TBot, T["options"]> | undefined
		: ConvertTypeToResolved<TProps, TBehavior, TBot, T["type"]> | (T["required"] extends true ? never : undefined)
	: never;

type BuildOptions<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
	T extends CommandOption[] | undefined,
> = {
	[Prop in keyof Omit<T, keyof unknown[]> as GetOptionName<T[Prop]>]: GetOptionValue<TProps, TBehavior, TBot, T[Prop]>;
};
