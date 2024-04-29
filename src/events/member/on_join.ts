import {
    Events, 
    GuildMember, 
    TextChannel,
    EmbedBuilder
} from 'discord.js';

import { client } from '../..';

module.exports = {
    name: Events.GuildMemberAdd,

    async execute(member: GuildMember) {
        try {
            const welcomeChannel = client.channels.cache.get(client.config.welcome_channel_id) as TextChannel;
            const unixTimestamp = Math.floor(member.user.createdAt.getTime() / 1000);

            const embed = new EmbedBuilder();
            embed.setColor(0x9e22e3);
            embed.setDescription(`Welcome ${member} to ${welcomeChannel.guild.name}!`);
            embed.addFields(
                {name: 'Rules', value: '<#1233170863897968700>', inline: false},
                {name: 'General', value: '<#1125326451944738850>', inline: false},
                {name: 'User since', value: `<t:${unixTimestamp}:R>`, inline: false}
            );
            embed.setThumbnail(member.displayAvatarURL());

            await member.roles.add(client.config.community_role_id);
            
            if (welcomeChannel) {
                await welcomeChannel.send({
                    embeds: [embed]
                });
            }
        } catch (err) {}
    }
}
