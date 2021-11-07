import { Injectable, Type } from '@nestjs/common';
import {
  ClientEvents,
  InteractionCollector,
  InteractionCollectorOptions,
  MessageCollector,
  MessageCollectorOptions,
  ReactionCollector,
  ReactionCollectorOptions,
} from 'discord.js';

import { ReflectMetadataProvider } from '../../../providers/reflect-metadata.provider';
import { MethodResolveOptions } from '../../interfaces/method-resolve-options';
import { MethodResolver } from '../../interfaces/method-resolver';
import { BaseCollectorResolver } from '../base-collector.resolver';
import { CollectorType } from '../collector-type';
import { ResolvedCollectorInfos } from './resolved-collector-infos';
import { UseCollectorApplyOptions } from './use-collector-apply-options';

@Injectable()
export class CollectorResolver implements MethodResolver {
  private readonly collectorInfos: ResolvedCollectorInfos[] = [];

  constructor(
    private readonly baseCollectorResolver: BaseCollectorResolver,
    private readonly metadataProvider: ReflectMetadataProvider,
  ) {}

  async resolve({ instance, methodName }: MethodResolveOptions): Promise<void> {
    const collectorTypes =
      this.metadataProvider.getUseCollectorsDecoratorMetadata(
        instance,
        methodName,
      );
    if (!collectorTypes) {
      return;
    }

    await this.addCollector({ instance, methodName }, collectorTypes);
  }

  async addCollector(
    { instance, methodName }: MethodResolveOptions,
    collectorTypes: Type[],
  ): Promise<void> {
    const collectors =
      collectorTypes.map((type) =>
        this.baseCollectorResolver.getCollectorMetadata(type),
      ) ?? [];

    this.collectorInfos.push({
      instance,
      methodName,
      collectors,
    });
  }

  applyCollector({
    instance,
    methodName,
    event,
    eventArgs,
  }: UseCollectorApplyOptions): (
    | ReactionCollector
    | MessageCollector
    | InteractionCollector<any>
  )[] {
    const methodCollectors = this.getCollectorData({ instance, methodName });

    if (!methodCollectors) return;

    return methodCollectors.collectors.map((collector) => {
      const { type, metadata, filterMethodName, classInstance, events } =
        collector;
      switch (type) {
        case CollectorType.REACTION: {
          if (!this.isMessageEvent(event, eventArgs)) return;

          const [message] = eventArgs;
          const reactionCollectorOptions: ReactionCollectorOptions = {
            ...metadata,
          };
          this.baseCollectorResolver.applyFilter(
            reactionCollectorOptions,
            filterMethodName,
            classInstance,
          );
          const reactionCollector = message.createReactionCollector(
            reactionCollectorOptions,
          );
          this.baseCollectorResolver.subscribeToEvents(
            reactionCollector,
            events,
            classInstance,
          );

          return reactionCollector;
        }
        case CollectorType.MESSAGE: {
          if (
            !this.isMessageEvent(event, eventArgs) &&
            !this.isInteractionEvent(event, eventArgs)
          )
            return;
          const [messageOrInteraction] = eventArgs;
          const messageCollectorOptions: MessageCollectorOptions = {
            ...metadata,
          };
          this.baseCollectorResolver.applyFilter(
            messageCollectorOptions,
            filterMethodName,
            classInstance,
          );
          const messageCollector =
            messageOrInteraction.channel.createMessageCollector(
              messageCollectorOptions,
            );
          this.baseCollectorResolver.subscribeToEvents(
            messageCollector,
            events,
            classInstance,
          );

          return messageCollector;
        }
        case CollectorType.INTERACTION: {
          if (
            !this.isMessageEvent(event, eventArgs) &&
            !this.isInteractionEvent(event, eventArgs)
          )
            return;
          const [messageOrInteraction] = eventArgs;
          const interactionCollectorOptions: InteractionCollectorOptions<any> =
            {
              ...metadata,
            };
          this.baseCollectorResolver.applyFilter(
            interactionCollectorOptions,
            filterMethodName,
            classInstance,
          );
          const interactionCollector =
            messageOrInteraction.channel.createMessageComponentCollector(
              interactionCollectorOptions,
            );
          this.baseCollectorResolver.subscribeToEvents(
            interactionCollector,
            events,
            classInstance,
          );

          return interactionCollector;
        }
      }
    });
  }

  private isMessageEvent(
    event: keyof ClientEvents,
    context: ClientEvents[keyof ClientEvents],
  ): context is ClientEvents['messageCreate'] {
    return event === 'messageCreate';
  }

  private isInteractionEvent(
    event: keyof ClientEvents,
    context: ClientEvents[keyof ClientEvents],
  ): context is ClientEvents['interactionCreate'] {
    return event === 'interactionCreate';
  }

  private getCollectorData({
    instance,
    methodName,
  }: MethodResolveOptions): ResolvedCollectorInfos {
    return this.collectorInfos.find(
      (item: ResolvedCollectorInfos) =>
        item.methodName === methodName && item.instance === instance,
    );
  }
}
