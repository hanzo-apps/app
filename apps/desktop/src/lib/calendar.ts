// Calendar utilities

export function extractMeetingLink(text: string): string | null {
  // Extract common meeting links from text
  const patterns = [
    // Zoom
    /https?:\/\/[\w-]+\.zoom\.us\/[jw]\/[\w-]+/i,
    // Google Meet
    /https?:\/\/meet\.google\.com\/[\w-]+/i,
    // Microsoft Teams
    /https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[\w%.-]+/i,
    // WebEx
    /https?:\/\/[\w-]+\.webex\.com\/[\w-]+\/j\.php\?[\w=&]+/i,
    // Generic meeting URL pattern
    /https?:\/\/[\w.-]+\/(meet|meeting|join)\/[\w-]+/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}