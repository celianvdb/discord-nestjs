import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Intents } from 'discord.js';
import { ApplicationCommandPermissionTypes } from 'discord.js/typings/enums';

import { BotModule } from './bot/bot.module';
import { PlaylistCommand } from './bot/commands/playlist.command';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get('TOKEN'),
        discordClientOptions: {
          intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
        },
        removeGlobalCommands: true,
        registerCommandOptions: [
          {
            forGuild: configService.get('GUILD_ID_WITH_COMMANDS'),
            removeCommandsBefore: true,
          },
        ],
        slashCommandsPermissions: [
          {
            commandClassType: PlaylistCommand,
            permissions: [
              {
                id: configService.get('ROLE_WITHOUT_PLAYLIST_PERMISSION'),
                type: ApplicationCommandPermissionTypes.ROLE,
                permission: false,
              },
            ],
          },
        ],
      }),
      inject: [ConfigService],
    }),
    BotModule,
  ],
})
export class AppModule {}
