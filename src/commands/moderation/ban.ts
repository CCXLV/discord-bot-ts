import { SlashCommandBuilder } from '@discordjs/builders';
import { 
    ChatInputCommandInteraction, 
    PermissionFlagsBits,
	DiscordAPIError,
	EmbedBuilder
} from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('უკრძალავს წევრს სერვერზე ყოფნას')
		.addUserOption(option => 
			option
				.setName('target')
				.setDescription('სერვერის წევრი ვისაც გინდა რომ აეკრძალოს სერვერზე ყოფნა')
				.setRequired(true)
		)
		.addStringOption(option => 
			option
				.setName('reason')
				.setDescription('მიზეზი თუ რატომ გინდა რომ მას აეკრძალოს სერვერზე ყოფნა')
				.setRequired(false)
		)
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setDMPermission(false),
        
	async execute(interaction: ChatInputCommandInteraction) {
		const member = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason');

		if (interaction.guild && member) {
			try {
				const embed = new EmbedBuilder();
				embed.setDescription(`**მიზეზი:** ${reason ? reason : 'არ იყო მითითებული'}`);
				embed.setAuthor({
					name: `${member.username} აეკრძალა სერვერზე ყოფნა`,
					iconURL:  member.displayAvatarURL()
				})

				await interaction.guild.members.ban(member, {reason: reason || undefined}); // delete messages
				await interaction.reply({embeds: [embed]});
			} catch (error) {
				if (error instanceof DiscordAPIError && error.code === 50013) {
                    await interaction.reply({content: 'მე არ მაქვს უფლება გავაგდო იგი.', ephemeral: true});
                }
			}
		}
	}
}