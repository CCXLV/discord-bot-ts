import Discord from 'discord.js';

import { GenerateRandomNumber, CreateButton } from '../../../utils/utils';

export async function SetupTicketSystem(interaction: Discord.ChatInputCommandInteraction | Discord.ButtonInteraction, ticketsCategory: Discord.CategoryChannel) {
	if (interaction.guild) {
		const channelName = `ticket-${GenerateRandomNumber()}`;
		try {
			const buttons = [
				CreateButton('TicketClose', 'დახურვა', Discord.ButtonStyle.Secondary, '🔒'),
				CreateButton('ConfirmClose', 'დახურვა', Discord.ButtonStyle.Danger),
				CreateButton('CancelClose', 'შეწყვეტა', Discord.ButtonStyle.Secondary),
				CreateButton('ReopenTicket', 'გახსნა', Discord.ButtonStyle.Secondary),
				CreateButton('DeleteTicket', 'წაშლა', Discord.ButtonStyle.Danger)
			]
			const rows = [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(buttons[0]),
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(buttons[1]).addComponents(buttons[2]),
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(buttons[3]).addComponents(buttons[4])
			]

			const ticketChannel = await interaction.guild.channels.create({
				name: channelName,
				type: Discord.ChannelType.GuildText,
				parent: ticketsCategory
			})
			await ticketChannel.permissionOverwrites.create(interaction.user, {
				ViewChannel: true, SendMessages: true, ReadMessageHistory: true
			})

			const embed = new Discord.EmbedBuilder();
            embed.setColor(0x9e22e3);
			embed.setDescription('ადმინისტრაცია მალე გიპასუხებთ');
			embed.setFooter({
				text: `ავტორი ${interaction.user.displayName}`,
				iconURL: interaction.user.displayAvatarURL()
			})
			embed.setTimestamp();

			await ticketChannel.send({embeds: [embed], components: [rows[0]]})

			const collector = ticketChannel.createMessageComponentCollector({
				componentType: Discord.ComponentType.Button
			})
			let ticketChannelNameState = 0;		
			collector.on('collect', async (inter: Discord.ButtonInteraction) => {		
				if (inter.customId === 'TicketClose' ) {
					const ticketIsNotClosed = ticketChannel.permissionOverwrites.cache.find(perm => perm.type === 1); 
					
					if (ticketIsNotClosed && !ticketIsNotClosed?.deny.has('ViewChannel')) {
						await inter.deferUpdate();
						await inter.channel?.send({
							content: 'დარწმუნებული ხარ, რომ თიქეთის დახურვა გინდა?',
							components: [rows[1]]
						})
					} else {
						await ticketChannel.permissionOverwrites.delete(interaction.user);
						await inter.reply({
							content: 'თიქეთი უკვე დახურულია!',
							ephemeral: true
						})
					}
				}

				if (inter.guild && inter.customId === 'ConfirmClose') {
					try {
						const embed = new Discord.EmbedBuilder();
                        embed.setColor(0x3c2b40);
						embed.setDescription(`თიქეთი დაიხურა ${inter.user}-ს მიერ`);
						

						if (ticketChannelNameState === 0) {
							await ticketChannel.edit({
								name: `closed-${ticketChannel.name.slice(-4)}`
							})
						}
						await ticketChannel.permissionOverwrites.delete(interaction.user);

						await inter.message.delete();
						await inter.deferUpdate();
						await inter.channel?.send({embeds: [embed], components: [rows[2]]});
						ticketChannelNameState = 1;
					} catch (err) {
						console.log(err)
					}
				}

				if (inter.customId === 'CancelClose') {
					await inter.message.delete();
				}

				if (inter.guild && inter.channel && inter.customId === 'ReopenTicket') {
					const embed = new Discord.EmbedBuilder();
                    embed.setColor(0x9e22e3)
					embed.setDescription(`თიქეთი გაიხსნა ${inter.user}-ს მიერ`);
					
					await ticketChannel.edit({
						name: `ticket-${ticketChannel.name.slice(-4)}`,
						permissionOverwrites: [
							{
								id: inter.guild.roles.everyone.id,
								deny: ['ViewChannel']
							},
							{
								id: interaction.user.id,
								allow: ['ViewChannel', 'ReadMessageHistory']
							}
						]
					})
					await inter.message.edit({
						embeds: inter.message.embeds,
						components: []
					})
					await inter.deferUpdate();
					await inter.channel.send({embeds: [embed]})
				}

				if (inter.channel && inter.customId === 'DeleteTicket') {
					await inter.channel.delete();
				}
			})

			await interaction.reply({content: `თიქეთი შეიქმნა <#${ticketChannel.id}>`,  ephemeral: true})

		} catch (err) {
			console.log(err);
			await interaction.reply('There was an error while creating the ticket channel.');
		}
	}
}