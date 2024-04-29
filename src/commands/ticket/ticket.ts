import { SlashCommandBuilder } from '@discordjs/builders';
import Discord from 'discord.js';
import { client } from '../..';

import { CreateButton } from '../../utils/utils';
import { SetupTicketSystem } from './utils/utils';


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Group of ticket commands')
		.addSubcommand(subcommand => 
			subcommand
				.setName('open')
				.setDescription('თიქეთის გახსნა')
		)
		.addSubcommand(subcommand => 
			subcommand
				.setName('setup')
				.setDescription('თიქეთის სისტემა')
		),

    async execute(interaction: Discord.ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
		const ticketsCategory = interaction.guild?.channels.cache.get(client.config.ticket_category_id) as Discord.CategoryChannel;

		if (subcommand === 'open' && ticketsCategory) {
			await interaction.reply({content: 'ჯერ არ არის ტურნირი დაწყებული.', ephemeral: true})
			// await SetupTicketSystem(interaction, ticketsCategory);
		}
		if (subcommand === 'setup' && ticketsCategory) {
			const ticketChannel = interaction.guild?.channels.cache.get(client.config.ticket_channel_id) as Discord.TextChannel;
			if (ticketChannel && interaction.member && interaction.member.user.id === client.config.owner_user_id) {
				const embed = new Discord.EmbedBuilder();
                embed.setColor(0x9e22e3);
				embed.setTitle('რეპორტი');
				embed.setDescription('უმიზეზოდ თიქეთის გახსნა დაუშვებელია!');

				const button = CreateButton('OpenTicket', 'თიქეთის გახსნა', Discord.ButtonStyle.Secondary);
				const row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
					.addComponents(button);
				
				await ticketChannel.send({embeds: [embed], components: [row]});
				
				const collector = ticketChannel.createMessageComponentCollector({
					componentType: Discord.ComponentType.Button
				})
				collector.on('collect', async (inter: Discord.ButtonInteraction) => {
					if (inter.customId === 'OpenTicket') {
						await SetupTicketSystem(inter, ticketsCategory);
					}
				})
			} else {
				await interaction.reply({content: 'შენ არ შეგიძლია ამ ქომანდის გამოყენება!', ephemeral: true})
			}
		}
    },
}