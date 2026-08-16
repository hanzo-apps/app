/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef } from "react";

export function useBroadcastChannel(
  channelName: string,
  onMessageReceived: (message: any) => void
) {
  const channel = useMemo(
    () => getSingletonChannel(channelName),
    [channelName]
  );
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!isSubscribed.current || process.env.NODE_ENV !== "development") {
      channel.onmessage = (event) => onMessageReceived(event.data);
    }
    return () => {
      if (isSubscribed.current || process.env.NODE_ENV !== "development") {
        channel.close();
        isSubscribed.current = true;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postMessage = useCallback(
    (message: any) => {
      channel?.postMessage(message);
    },
    [channel]
  );

  return {
    postMessage,
  };
}

const channelInstances: { [key: string]: BroadcastChannel } = {};

/** A channel that carries nothing, for a browser that will not open one. */
function inert(name: string): BroadcastChannel {
  return {
    name,
    onmessage: null,
    onmessageerror: null,
    close: () => {},
    postMessage: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as unknown as BroadcastChannel;
}

/**
 * The channel of that name, one per name.
 *
 * `new BroadcastChannel` THROWS where a browser refuses storage access —
 * Safari's block-all-cookies, a phone's anti-tracking, an enterprise policy.
 * This runs in a `useMemo` inside the root layout's tree, so the throw is a
 * render error under the app-level boundary and every route, on every path,
 * becomes the error screen. A browser that refuses the channel has no second
 * tab to reach through it either, so nothing is lost by carrying nothing.
 */
export const getSingletonChannel = (name: string): BroadcastChannel => {
  if (!channelInstances[name]) {
    try {
      channelInstances[name] = new BroadcastChannel(name);
    } catch {
      channelInstances[name] = inert(name);
    }
  }
  return channelInstances[name];
};
