import { SlashCommandBuilder } from '@discordjs/builders';
import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    EmbedBuilder
} from 'discord.js';

import { client } from '../..';
import { statisticsType } from '../../utils/types/types';
import { UMBRELLA_ICON_LINK, formatString } from '../../utils/utils';


module.exports = {
    data: new SlashCommandBuilder()
        .setName('statistics')
        .setDescription('Group of ticket commands')
		.addSubcommand(subcommand => 
			subcommand
				.setName('get')
				.setDescription('გუნდის სტატისტიკა')
                .addStringOption(option => 
                    option
                        .setName('team')
                        .setDescription('გუნდი ვისი სტატისტიკების გაინტერესებს')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
		)
        .addSubcommand(subcommand => 
            subcommand
                .setName('all')
                .setDescription('გუნდების სტატისტიკები')
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('add')
                .setDescription('გუნდის სატისტიკის დამატება')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('გუნდის სახელი')
                        .setRequired(true)
                )
                .addStringOption(option => 
                    option
                        .setName('tag')
                        .setDescription('გუნდის ინიციალი')
                        .setRequired(true)
                )
                .addNumberOption(option => 
                    option 
                        .setName('points')
                        .setDescription('გუნდის ქულები')
                        .setRequired(true)
                )
        ),

    async autocomplete(interaction: AutocompleteInteraction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'get') {
            const statistics: statisticsType[] = await client.getDBData('SELECT * FROM tournament_statistics');
            await interaction.respond(
                statistics.map(stat => ({name: stat.team_name, value: String(stat.id)}))
            )
        }
    },
        
	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'get' && client.db) {
            const teamId = interaction.options.getString('team');
            if (teamId) {
                const query = 'SELECT * FROM tournament_statistics WHERE id = ?';
                const teamData: statisticsType = (await client.getDBData(query, [parseInt(teamId)]))[0];

                const embed = new EmbedBuilder();
                embed.setColor(0x9e22e3);
                embed.setTitle('გუნდის სტატისტიკა');
                embed.addFields(
                    {name: 'სახელი', value: teamData.team_name, inline: false},
                    {name: 'ინიციალი', value: teamData.team_tag, inline: false},
                    {name: 'ქულები', value: String(teamData.team_points), inline: false}
                )
                embed.setThumbnail(UMBRELLA_ICON_LINK);
                embed.setFooter({text: `ID: ${teamData.id}`});
                embed.setTimestamp();

                await interaction.reply({embeds: [embed]});
            }
        }
        if (subcommand === 'all' && client.db) {
            const statistics: statisticsType[] = await client.getDBData('SELECT * FROM tournament_statistics');
            const sortedStatistics = statistics.sort((a, b) => b.team_points - a.team_points);
            const formatedStatistics = sortedStatistics.map(({ team_name, team_tag, team_points }) => {
                return formatString(team_name, team_tag, team_points);
            });

            const embed = new EmbedBuilder();
            embed.setColor(0x9e22e3);
            embed.setTitle('გუნდების სტატისტიკები');
            embed.setDescription('```' + formatedStatistics.join('\n') + '```');
            embed.setTimestamp();

            await interaction.reply({embeds: [embed]})
        }
        if (subcommand === 'add' && client.db && interaction.guild) {
            const interactionUser = interaction.guild.members.cache.find(member => member.id === interaction.user.id);

            if (interactionUser?.roles.cache.has(client.config.bot_admin_role_id)) {
                const teamName = interaction.options.getString('name');
                const teamTag = interaction.options.getString('tag');
                const teamPoints = interaction.options.getNumber('points');

                if (teamName && teamTag && teamPoints) {
                    const query = 'INSERT INTO tournament_statistics (team_name, team_tag, team_points) VALUES (?, ?, ?)';
                    await client.runDBQuery(query, [teamName, teamTag, teamPoints]);
                }
                await interaction.reply({
                    content: `${teamName}-ის სტატისტიკა შენახულია`
                })
            } else {
                await interaction.reply({
                    content: 'შენ არ შეგიძლია ამ ქომანდის გამოყენება!',
                    ephemeral: true
                })
            }
        }
	},
}