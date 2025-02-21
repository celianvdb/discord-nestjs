import { On, Once, UseCollectors, UseGuards } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { Message, MessageEmbed } from 'discord.js';

import { MessageFromUserGuard } from './guards/message-from-user.guard';
import { QuizCommandGuard } from './guards/quiz-command.guard';
import { QuizMessageCollector } from './quiz-message-collector';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);

  @Once('ready')
  onReady(): void {
    this.logger.log('Bot was started!');
  }

  @On('messageCreate')
  @UseGuards(MessageFromUserGuard, QuizCommandGuard)
  @UseCollectors(QuizMessageCollector)
  async onMessage(message: Message): Promise<void> {
    const quizEmbed = new MessageEmbed()
      .setTitle('Who was first man in space?')
      .setFields([
        { name: 'A)', value: 'Neil Armstrong' },
        { name: 'B)', value: 'Yuri Gagarin' },
        { name: 'C)', value: 'Allan Shepard' },
        { name: 'D)', value: 'Kalpana Chawla' },
      ]);

    await message.reply({
      embeds: [quizEmbed],
    });
  }
}
