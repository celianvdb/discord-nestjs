import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Client, WebhookClient, WebhookClientData } from 'discord.js';

import { DiscordModuleOption } from '../definitions/interfaces/discord-module-options';
import { DiscordOptionService } from './discord-option.service';

@Injectable()
export class DiscordClientService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DiscordClientService.name);
  private webhookClient: WebhookClient;
  private client: Client;
  private clientToken: string;

  constructor(private discordOptionService: DiscordOptionService) {}

  init(options: DiscordModuleOption): void {
    this.discordOptionService.setDefault(options);

    const { token, webhook, discordClientOptions } =
      this.discordOptionService.getClientData();

    this.client = new Client(discordClientOptions);
    this.clientToken = token;
    this.webhookClient = this.createWebhookClient(webhook);
  }

  getClient(): Client {
    return this.client;
  }

  getWebhookClient(): WebhookClient {
    return this.webhookClient;
  }

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.client.login(this.clientToken);
    } catch (err) {
      this.logger.error('Failed to connect to Discord API');
      this.logger.error(err);
    }
  }

  onApplicationShutdown(): void {
    this.client.destroy();
  }

  private createWebhookClient(
    webhookOptions: WebhookClientData,
  ): WebhookClient {
    if (!webhookOptions) return;

    return new WebhookClient(webhookOptions);
  }
}
