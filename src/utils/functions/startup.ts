import Discord from 'discord.js';

import { client as cl } from '../..';

import { CreateButton } from '../utils';
import { SetupTicketSystem } from '../../commands/ticket/utils/utils';
import ConfigData from '../config.json';

export async function clientStartUp(client: Discord.Client) {
    const ticketChannel = client.channels.cache.get(cl.config.ticket_channel_id) as Discord.TextChannel;
    const ticketsCategory = client.channels.cache.get(cl.config.ticket_category_id) as Discord.CategoryChannel;

    const embed = new Discord.EmbedBuilder();
    embed.setColor(0x9e22e3);
    embed.setTitle('რეპორტი');
    embed.setDescription('უმიზეზოდ თიქეთის გახსნა დაუშვებელია!');

    const button = CreateButton('OpenTicket', 'თიქეთის გახსნა', Discord.ButtonStyle.Secondary);
    const row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
        .addComponents(button);

    const fetchedMessages = (await ticketChannel.messages.fetch({ limit: 100 }));
    if (fetchedMessages) await ticketChannel.bulkDelete(fetchedMessages, true);
    
    await ticketChannel.send({embeds: [embed], components: [row]});
    
    const collector = ticketChannel.createMessageComponentCollector({
        componentType: Discord.ComponentType.Button
    })
    collector.on('collect', async (inter: Discord.ButtonInteraction) => {
        if (inter.customId === 'OpenTicket') {
            await SetupTicketSystem(inter, ticketsCategory);
        }
    })
}