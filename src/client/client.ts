import Discord from 'discord.js';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

import ConfigData from '../utils/config.json';
import { clientStartUp } from '../utils/functions/startup';


interface CommandData {
    data: Discord.SlashCommandBuilder;
    execute: (inter: Discord.ChatInputCommandInteraction) => Promise<void>;
    autocomplete: (inter: Discord.AutocompleteInteraction) => Promise<void>;
}

interface Config {
    ticket_category_id: string; 
    ticket_channel_id: string;
    community_role_id: string;
    bot_admin_role_id: string;
    owner_user_id: string;
    welcome_channel_id: string;
}

export class Bot extends Discord.Client {
    commands: CommandData[] = [];
    rest = new Discord.REST().setToken(this.token || '');
    config: Config;
    dev: boolean = false;
    db: sqlite3.Database | null = null;

    BOT_TOKEN: string = (this.dev ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN) || '';
    CLIENT_ID: string = (this.dev ? process.env.TEST_CLIENT_ID : process.env.CLIENT_ID) || '';

    constructor() {
        super({
            intents: [
                Discord.GatewayIntentBits.Guilds,
                Discord.GatewayIntentBits.GuildMembers,
                Discord.GatewayIntentBits.GuildIntegrations,
                Discord.GatewayIntentBits.GuildMessages,
                Discord.GatewayIntentBits.GuildMessageReactions,
                Discord.GatewayIntentBits.GuildMessageTyping,
                Discord.GatewayIntentBits.DirectMessages,
                Discord.GatewayIntentBits.DirectMessageReactions,
                Discord.GatewayIntentBits.DirectMessageTyping,
                Discord.GatewayIntentBits.MessageContent,
            ],
            partials: [
                Discord.Partials.Message,
                Discord.Partials.Channel,
                Discord.Partials.GuildMember,
                Discord.Partials.GuildScheduledEvent,
                Discord.Partials.User
            ]
        });
        this.once('ready', this.onReady.bind(this));
        this.on('messageCreate', this.onMessage.bind(this));
        this.on('interactionCreate', this.onInteraction.bind(this));

        this.config = {
            ticket_category_id: this.dev ? ConfigData.test_ticket_category_id : ConfigData.ticket_category_id,
            ticket_channel_id: this.dev ? ConfigData.test_ticket_channel_id : ConfigData.ticket_channel_id,
            community_role_id: this.dev ? ConfigData.test_community_role_id : ConfigData.community_role_id,
            bot_admin_role_id: this.dev ? ConfigData.test_bot_admin_role_id : ConfigData.bot_admin_role_id,
            owner_user_id: ConfigData.owner_user_id,
            welcome_channel_id: this.dev ? ConfigData.test_welcome_channel_id : ConfigData.welcome_channel_id
        }
    };

    private async onReady() {
        await this.loadCommands();
        await this.loadEvents();
        await this.registerAppCommands();
        await clientStartUp(this);
        console.log(this.user?.username + ' is ready!');
    }

    public async start() {
        await this.login(this.BOT_TOKEN);
        await this.connectDatabase();
    }

    private async loadCommands() {
        const foldersPath = path.join(__dirname, '../commands');
        const commandFolders = fs.readdirSync(foldersPath);
        for (const folder of commandFolders) {
            // if (folder === 'tour_statistics') continue;
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if (command.data && typeof command.execute === 'function') {
                    this.commands.push(command)
                }
            }
        }
    }

    private async loadEvents() {
        const events_folder_path = path.join(__dirname, '../events');
        const event_folders = fs.readdirSync(events_folder_path);

        for(const folder of event_folders) {
            const events_path = path.join(events_folder_path, folder);
            const event_files = fs.readdirSync(events_path).filter( file => file.endsWith('.ts') );

            for(const file of event_files) {
                const file_path = path.join(events_path, file);
                const event = require(file_path);
                
                if(event.once) {
                    this.once(event.name, async (...args) => await event.execute(...args));
                } else {
                    this.on(event.name, async (...args) => await event.execute(...args));
                }
            }
        }
    }

    private async registerAppCommands() {
        try {
            console.log(`Started refreshing ${this.commands.length} application commands`);
            await this.rest.put(
                Discord.Routes.applicationCommands(this.CLIENT_ID),
                {body: this.commands.map(command => command.data.toJSON())}
            )
        } catch (error) {
            console.log(error);
        }
    }

    private async connectDatabase() {
        const tablesQuery = fs.readFileSync('src/utils/db/tables.sql', 'utf-8');
        const tables = tablesQuery.split(';');
        let executedQueries: number = 0;

        return new Promise<void>((resolve, reject) => {
            this.db = new sqlite3.Database('src/utils/db/db.sqlite', (err) => {
                if (err) {
                    console.error('Error connecting to the database:', err);
                    reject(err);
                } else {
                    console.log('Connected to the database');

                    this.db?.serialize(() => {
                        for (const query of tables) {
                            if (query.trim() === '') {
                                continue;
                            }
                            this.db?.run(query, (err) => {
                                if (err) {
                                    console.error(`Error executing SQL: ${query}`);
                                    console.error(err);
                                } else {
                                    executedQueries++;
                                }
                            })
                        }
                    })
                    setTimeout(() => {  
                        console.log(`Executed ${executedQueries}/${tables.length-1} queries`)
                    }, 500)
                    resolve();
                }
            });
        });
    }

    private async onMessage(message: Discord.Message) {
        if (message.system) return;

        if (!message.guild) return;

        if (message.author.bot) return;
    }

    private async onInteraction(inter: Discord.Interaction) {
        if (inter.isChatInputCommand()) {
            const command = this.commands.find(command => command.data.name === inter.commandName);

            if (!command) {
                console.error(`No command matching ${inter.commandName} was found.`);
                return;
            }

            try {
                if (inter.guild) {
                    await command.execute(inter);
                } else
                    await inter.reply('ამ ქომანდის გამოყენება არ შეიძლება პირად შეტყობინებებში!');
            } catch (error) {
                console.log(error)
                if (inter.replied || inter.deferred) {
                    await inter.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await inter.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (inter.isAutocomplete()) {
            const command = this.commands.find(command => command.data.name === inter.commandName);

            if (!command) {
                console.error(`No command matching ${inter.commandName} was found.`);
                return;
            }
    
            try {
                await command.autocomplete(inter);
            } catch (error) {
                console.error(error);
            }
        }
    }

    public runDBQuery(query: string, params: any[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.db?.run(query, params, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public async getDBData(query: string, params?: any[]): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            this.db?.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}
