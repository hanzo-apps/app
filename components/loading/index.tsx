'use client';

import { YStack } from '@hanzo/gui';
function Loading({
  overlay = true,
  className,
}: {
  overlay?: boolean;
  className?: string;
}) {
  return (
    <YStack
      {...{ position: overlay ? "absolute" : undefined, left: overlay ? "$0" : undefined, top: overlay ? "$0" : undefined, height: overlay ? "100%" : undefined, width: overlay ? "100%" : undefined, alignItems: overlay ? "center" : undefined, justifyContent: overlay ? "center" : undefined, zIndex: overlay ? 20 : undefined, backgroundColor: overlay ? "black" : undefined, borderRadius: overlay ? "$10" : undefined }}
    >
      <svg
        className={`size-5 animate-spin text-white ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </YStack>
  );
}

export default Loading;
