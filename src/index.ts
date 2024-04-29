import { config } from 'dotenv';

import { Bot } from './client/client';

config();

export const client = new Bot();

client.start()