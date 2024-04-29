import Discord from 'discord.js';

export const UMBRELLA_ICON_LINK = 'https://media.discordapp.net/attachments/1233175018695954472/1233412396224090205/Icon.png?ex=662e51ce&is=662d004e&hm=53bbf4a8fbd945e8082fac8c5ceea3b94c53c51025a6caa9e46c43975ae1f965&=&format=webp&quality=lossless&width=607&height=607'

export function GenerateRandomNumber() {
    const randomNumber = Math.floor(Math.random() * 10000);
    return randomNumber.toString().padStart(4, '0');
};

export function CreateButton(
	id: string, 
	label: string, 
	style: Discord.ButtonStyle, 
	emoji?: string
) {
	const button = new Discord.ButtonBuilder()
		.setCustomId(id)
		.setLabel(label)
		.setStyle(style);
	if (emoji) button.setEmoji(emoji);

	return button;
};

export function formatString(name: string, tag: string, points: number) {
    const NAME_MX_LEN = 15;
    const TAG_MX_LEN = 7;
    const POINTS_MX_LEN = 4;

    const formatted_string = `${name.padEnd(3 + NAME_MX_LEN)}${tag.padEnd(3 + TAG_MX_LEN)}${String(points).padEnd(POINTS_MX_LEN)}`;
    return formatted_string;
}