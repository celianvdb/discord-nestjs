export interface PrefixCommandOptions {
  /**
   * Command name
   */
  name: string;

  /**
   * Command prefix (If set, it overrides the global)
   */
  prefix?: string;

  /**
   * Remove command name from input string
   *
   * @default true
   */
  isRemoveCommandName?: boolean;

  /**
   * Remove prefix from input string
   *
   * @default true
   */
  isRemovePrefix?: boolean;

  /**
   * Ignore messages from bots
   *
   * @default true
   */
  isIgnoreBotMessage?: boolean;

  /**
   * Remove message from channel after processing
   *
   * @default false
   */
  isRemoveMessage?: boolean;
}
