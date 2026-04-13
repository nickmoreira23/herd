import type { MessageChannelType } from "@prisma/client";
import type { MessageChannelAdapter } from "./adapter";
import { InternalAdapter } from "./adapters/internal.adapter";
import { EmailAdapter } from "./adapters/email.adapter";

const adapters = new Map<MessageChannelType, MessageChannelAdapter>();

function register(adapter: MessageChannelAdapter) {
  adapters.set(adapter.channelType, adapter);
}

// Register built-in adapters
register(new InternalAdapter());
register(new EmailAdapter());

export function getAdapter(
  channelType: MessageChannelType
): MessageChannelAdapter | undefined {
  return adapters.get(channelType);
}

export function getSupportedChannelTypes(): MessageChannelType[] {
  return Array.from(adapters.keys());
}
