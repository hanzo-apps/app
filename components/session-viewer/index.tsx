'use client';

import { YStack, SizableText, H3, XStack, H4, Paragraph } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Button, toast } from '@hanzo/ui';

interface SessionPage {
  path: string;
  timestamp: string;
  duration?: number;
}

interface SessionJourney {
  sessionId: string;
  pages: SessionPage[];
  entryPage: string;
  exitPage: string;
  pageCount: number;
  totalDuration: number;
  isBounce: boolean;
  createdAt: string;
  endedAt: string;
}

interface FlowNode {
  id: string;
  label: string;
  value: number;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

interface FlowData {
  nodes: FlowNode[];
  links: FlowLink[];
}

interface SessionData {
  sessions: SessionJourney[];
  flowData: FlowData;
  summary: {
    totalSessions: number;
    bounceRate: number;
    averageDuration: number;
    averagePageCount: number;
  };
}

interface SessionViewerProps {
  deploymentId: string;
}

export function SessionViewer({ deploymentId }: SessionViewerProps) {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionJourney | null>(null);

  // Fetch session data
  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/v1/analytics/${deploymentId}/sessions?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch session data');

      const sessionData: SessionData = await response.json();
      setData(sessionData);
    } catch (error) {
      console.error('Failed to fetch session data:', error);
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchSessionData();
  }, [deploymentId]);

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <YStack rowGap="$5">
      {/* Summary Stats */}
      {data && data.summary && (
        <YStack gap="$4">
          <YStack borderWidth={1} borderRadius="$5" padding="$4">
            <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">Total Sessions</SizableText>
            <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">{(data.summary.totalSessions || 0).toLocaleString()}</SizableText>
          </YStack>
          <YStack borderWidth={1} borderRadius="$5" padding="$4">
            <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">Bounce Rate</SizableText>
            <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">{((data.summary.bounceRate || 0) * 100).toFixed(1)}%</SizableText>
          </YStack>
          <YStack borderWidth={1} borderRadius="$5" padding="$4">
            <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">Avg. Duration</SizableText>
            <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">{formatDuration(data.summary.averageDuration || 0)}</SizableText>
          </YStack>
          <YStack borderWidth={1} borderRadius="$5" padding="$4">
            <SizableText fontSize="$3" color="$color11" display="flex" flexDirection="column">Avg. Pages/Session</SizableText>
            <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">{(data.summary.averagePageCount || 0).toFixed(1)}</SizableText>
          </YStack>
        </YStack>
      )}

      {/* Flow Visualization */}
      {data && data.flowData && (
        <YStack borderWidth={1} borderRadius="$5" padding="$4">
          <H3 fontWeight="500" marginBottom="$4">Page Flow</H3>
          <YStack rowGap="$2">
            {/* Simple flow visualization */}
            {data.flowData.nodes.slice(0, 10).map((node, index) => {
              const outgoingLinks = data.flowData.links.filter((l) => l.source === node.id);
              const incomingLinks = data.flowData.links.filter((l) => l.target === node.id);

              return (
                <YStack key={node.id} borderWidth={1} borderRadius="$2" padding="$3">
                  <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                    <SizableText fontWeight="500">{node.label}</SizableText>
                    <SizableText fontSize="$3" color="$color11">{node.value} visits</SizableText>
                  </XStack>

                  {/* Incoming links */}
                  {incomingLinks.length > 0 && (
                    <SizableText fontSize="$1" color="$color11" marginBottom="$1" display="flex" flexDirection="column">
                      ← From: {incomingLinks.slice(0, 3).map((l) => l.source).join(', ')}
                      {incomingLinks.length > 3 && ` (+${incomingLinks.length - 3} more)`}
                    </SizableText>
                  )}

                  {/* Outgoing links */}
                  {outgoingLinks.length > 0 && (
                    <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">
                      → To: {outgoingLinks.slice(0, 3).map((l) => l.target).join(', ')}
                      {outgoingLinks.length > 3 && ` (+${outgoingLinks.length - 3} more)`}
                    </SizableText>
                  )}
                </YStack>
              );
            })}
          </YStack>
        </YStack>
      )}

      {/* Session List */}
      {data && data.sessions.length > 0 && (
        <YStack borderWidth={1} borderRadius="$5">
          <YStack padding="$4" borderBottomWidth={1}>
            <H3 fontWeight="500">Recent Sessions</H3>
          </YStack>
          <YStack maxHeight={384} overflow="scroll">
            {data.sessions.slice(0, 50).map((session) => (
              <YStack
                key={session.sessionId}
                padding="$4" cursor="pointer" hoverStyle={{ backgroundColor: "$color3" }}
                onClick={() => setSelectedSession(session)}
              >
                <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
                  <YStack flex={1}>
                    <SizableText fontWeight="500" fontSize="$3" display="flex" flexDirection="column">
                      {session.entryPage} → {session.exitPage}
                    </SizableText>
                    <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">
                      {new Date(session.createdAt).toLocaleString()}
                    </SizableText>
                  </YStack>
                  <SizableText textAlign="right" display="flex" flexDirection="column">
                    <SizableText fontSize="$3" display="flex" flexDirection="column">{session.pageCount} pages</SizableText>
                    <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">
                      {formatDuration(session.totalDuration)}
                    </SizableText>
                  </SizableText>
                </XStack>

                {session.isBounce && (
                  <SizableText alignItems="center" paddingHorizontal="$2" paddingVertical="$0.5" borderRadius="$2" fontSize="$1" backgroundColor="$red2" color="$red11" display="flex" flexDirection="row">
                    Bounce
                  </SizableText>
                )}
              </YStack>
            ))}
          </YStack>
        </YStack>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <XStack
          position="fixed" top={0} right={0} bottom={0} left={0} backgroundColor="black" alignItems="center" justifyContent="center" zIndex={50}
          onClick={() => setSelectedSession(null)}
        >
          <YStack
            backgroundColor="$background" borderWidth={1} borderRadius="$5" padding="$5" maxWidth={672} width="100%" maxHeight="80vh" overflow="scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$4">
              <H3 fontSize="$6" fontWeight="500">Session Journey</H3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                ✕
              </Button>
            </XStack>

            <YStack rowGap="$4">
              {/* Session metadata */}
              <SizableText gap="$4" fontSize="$3" display="flex" flexDirection="column">
                <div>
                  <SizableText color="$color11">Started:</SizableText>{' '}
                  {new Date(selectedSession.createdAt).toLocaleString()}
                </div>
                <div>
                  <SizableText color="$color11">Ended:</SizableText>{' '}
                  {new Date(selectedSession.endedAt).toLocaleString()}
                </div>
                <div>
                  <SizableText color="$color11">Total Duration:</SizableText>{' '}
                  {formatDuration(selectedSession.totalDuration)}
                </div>
                <div>
                  <SizableText color="$color11">Pages Visited:</SizableText>{' '}
                  {selectedSession.pageCount}
                </div>
              </SizableText>

              {/* Journey timeline */}
              <YStack borderTopWidth={1} paddingTop="$4">
                <H4 fontWeight="500" marginBottom="$3">Page Journey</H4>
                <YStack rowGap="$3">
                  {selectedSession.pages.map((page, index) => (
                    <XStack key={index} alignItems="flex-start" gap="$3">
                      <YStack alignItems="center">
                        <SizableText width="$6" height="$6" borderRadius="$10" backgroundColor="$color12" color="$background" alignItems="center" justifyContent="center" fontSize="$1" fontWeight="500" display="flex" flexDirection="row">
                          {index + 1}
                        </SizableText>
                        {index < selectedSession.pages.length - 1 && (
                          <YStack width="$0.5" height="$6" backgroundColor="$borderColor" />
                        )}
                      </YStack>
                      <YStack flex={1}>
                        <SizableText fontWeight="500" display="flex" flexDirection="column">{page.path}</SizableText>
                        <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">
                          {new Date(page.timestamp).toLocaleTimeString()}
                          {page.duration && ` • ${formatDuration(page.duration)}`}
                        </SizableText>
                      </YStack>
                    </XStack>
                  ))}
                </YStack>
              </YStack>
            </YStack>
          </YStack>
        </XStack>
      )}

      {loading && (
        <XStack alignItems="center" justifyContent="center" height={384} borderWidth={1} borderRadius="$5">
          <Paragraph color="$color11">Loading session data...</Paragraph>
        </XStack>
      )}

      {!loading && !data && (
        <XStack alignItems="center" justifyContent="center" height={384} borderWidth={1} borderRadius="$5">
          <Paragraph color="$color11">No session data available</Paragraph>
        </XStack>
      )}
    </YStack>
  );
}
