import type {
	ApplicationCommandOptionTypes,
	Bot,
	Camelize,
	CreateApplicationCommand,
	DesiredPropertiesBehavior,
	DiscordApplicationCommandOption,
	SetupDesiredProps,
	InteractionResolvedData,
	TransformersDesiredProperties,
	Role,
	Attachment,
	Member,
	User,
	Channel,
} from "@discordeno/bot";

export type CommandOption = Camelize<DiscordApplicationCommandOption>;

export type Command<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	TBot extends Bot<TProps, TBehavior>,
	TOptions extends CommandOption[] = CommandOption[],
	TContext extends object = object,
> = CreateApplicationCommand & {
	/** @inheritdoc */
	options?: TOptions;
	/** Function to run when the interaction is executed */
	run: (
		interaction: TBot["transformers"]["$inferredTypes"]["interaction"],
		context: TContext & { args: GetCommandOptions<TProps, TBehavior, TOptions> },
	) => unknown;
};

export type GetCommandOptions<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	T extends CommandOption[],
> = T extends CommandOption[]
	? { [Prop in keyof BuildOptions<TProps, TBehavior, T>]: BuildOptions<TProps, TBehavior, T>[Prop] }
	: never;

// Option parsing

type BuildOptions<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior, T> = {
	[Prop in Exclude<keyof T, keyof Array<unknown>> as GetOptionName<T[Prop]>]: GetOptionValue<
		TProps,
		TBehavior,
		T[Prop]
	>;
};

type GetOptionName<T> = T extends { name: string } ? T["name"] : never;

type GetOptionValue<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
	T,
> = T extends CommandOption
	? T extends { type: SubCommandApplicationCommand; options?: CommandOption[] }
		? BuildOptions<TProps, TBehavior, T["options"]> | undefined
		: TypeToResolvedMap<TProps, TBehavior>[T["type"]] | (T["required"] extends true ? never : undefined)
	: never;

// TODO: Replace with "InteractionResolvedDataUser" from @discordeno/bot when #4099 merges
export interface InteractionResolvedDataUser<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
> {
	user: SetupDesiredProps<User, TProps, TBehavior>;
	member: InteractionResolvedDataMember<TProps, TBehavior>;
}

// TODO: Replace with "InteractionResolvedDataChannel" from @discordeno/bot when #4099 merges
export type InteractionResolvedDataChannel<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
> = Pick<
	SetupDesiredProps<Channel, TProps, TBehavior>,
	Extract<
		keyof SetupDesiredProps<Channel, TProps, TBehavior>,
		"id" | "name" | "type" | "permissions" | "threadMetadata" | "parentId"
	>
>;

// TODO: Replace with "InteractionResolvedDataMember" from @discordeno/bot when #4099 merges
export type InteractionResolvedDataMember<
	TProps extends TransformersDesiredProperties,
	TBehavior extends DesiredPropertiesBehavior,
> = Omit<SetupDesiredProps<Member, TProps, TBehavior>, "user" | "deaf" | "mute">;

type TypeToResolvedMap<TProps extends TransformersDesiredProperties, TBehavior extends DesiredPropertiesBehavior> = {
	[ApplicationCommandOptionTypes.String]: string;
	[ApplicationCommandOptionTypes.Integer]: number;
	[ApplicationCommandOptionTypes.Boolean]: boolean;
	[ApplicationCommandOptionTypes.User]: InteractionResolvedDataUser<TProps, TBehavior>;
	[ApplicationCommandOptionTypes.Channel]: InteractionResolvedDataChannel<TProps, TBehavior>;
	[ApplicationCommandOptionTypes.Role]: SetupDesiredProps<Role, TProps, TBehavior>;
	[ApplicationCommandOptionTypes.Mentionable]:
		| SetupDesiredProps<Role, TProps, TBehavior>
		| InteractionResolvedDataUser<TProps, TBehavior>;
	[ApplicationCommandOptionTypes.Number]: number;
	[ApplicationCommandOptionTypes.Attachment]: SetupDesiredProps<Attachment, TProps, TBehavior>;
	[ApplicationCommandOptionTypes.SubCommand]: InteractionResolvedData<TProps, TBehavior>;
	[ApplicationCommandOptionTypes.SubCommandGroup]: InteractionResolvedData<TProps, TBehavior>;
};

type SubCommandApplicationCommand =
	| ApplicationCommandOptionTypes.SubCommand
	| ApplicationCommandOptionTypes.SubCommandGroup;
