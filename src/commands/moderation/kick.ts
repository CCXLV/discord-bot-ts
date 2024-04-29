import { SlashCommandBuilder } from '@discordjs/builders';
import { 
    ChatInputCommandInteraction, 
    PermissionFlagsBits,
	DiscordAPIError,
	EmbedBuilder
} from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('აგდებს წევრს სერვერიდან')
		.addUserOption(option => 
			option
				.setName('target')
				.setDescription('ის ვინც გინდა რომ გააგდო')
				.setRequired(true)
		)
		.addStringOption(option => 
			option
				.setName('reason')
				.setDescription('მიზეზი თუ რატომ აგდებ მას სერვერიდან')
				.setRequired(false)
		)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.setDMPermission(false),
        
	async execute(interaction: ChatInputCommandInteraction) {
		const member = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason');

		if (interaction.guild && member) {
			try {
				const embed = new EmbedBuilder();
				embed.setDescription(`**მიზეზი:** ${reason ? reason : 'არ იყო მითითებული'}`);
				embed.setAuthor({
					name: `${member.username} გავარდა სერვერდიან`,
					iconURL: member.displayAvatarURL()
				})

				await interaction.guild.members.kick(member, reason || undefined);
				await interaction.reply({embeds: [embed]});
			} catch (error) {
				if (error instanceof DiscordAPIError && error.code === 50013) {
                    await interaction.reply({content: 'მე არ მაქვს უფლება გავაგდო იგი.', ephemeral: true});
                }
			}
		}
	}
}