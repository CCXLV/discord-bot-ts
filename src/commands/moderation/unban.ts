import { SlashCommandBuilder } from '@discordjs/builders';
import { 
    ChatInputCommandInteraction, 
    PermissionFlagsBits,
	DiscordAPIError,
	EmbedBuilder
} from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Unbans a user from the server.')
		.addUserOption(option => 
			option
				.setName('target')
				.setDescription('The member to unban')
				.setRequired(true)
		)
		.addStringOption(option => 
			option
				.setName('reason')
				.setDescription('Reason why you\'re unbanning the member')
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
				embed.setDescription(`**Reason:** ${reason ? reason : 'Wasn\'t mentioned'}`);
				embed.setAuthor({
					name: `${member.username} was unbanned.`,
					iconURL:  member.displayAvatarURL()
				})

				await interaction.guild.members.unban(member, reason || undefined);
				await interaction.reply({embeds: [embed]});
			} catch (error) {
				if (error instanceof DiscordAPIError && error.code === 50013) {
                    await interaction.reply({content: 'I don\'t have permission to unban the member.', ephemeral: true});
                } else {
                    await interaction.reply({content: 'I couldn\'t unban the user.', ephemeral: true})
                }
			}
		}
	}
}