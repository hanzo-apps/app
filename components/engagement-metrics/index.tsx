'use client';

import { XStack, Paragraph, YStack, SizableText, H3 } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Button, toast } from '@hanzo/ui';

interface EngagementMetrics {
  timeOnPage: {
    average: number;
    median: number;
    distribution: Record<string, number>;
  };
  scrollDepth: {
    average: number;
    milestones: Record<number, number>;
  };
  exitPages: Array<{
    page: string;
    exitCount: number;
    exitRate: number;
  }>;
  topLandingPages: Array<{
    page: string;
    visitCount: number;
    bounceRate: number;
  }>;
}

interface EngagementMetricsProps {
  deploymentId: string;
}

export function EngagementMetrics({ deploymentId }: EngagementMetricsProps) {
  const [data, setData] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch engagement metrics
  const fetchEngagementMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/v1/analytics/${deploymentId}/engagement`);
      if (!response.ok) throw new Error('Failed to fetch engagement metrics');

      const metrics: EngagementMetrics = await response.json();
      setData(metrics);
    } catch (error) {
      console.error('Failed to fetch engagement metrics:', error);
      toast.error('Failed to load engagement metrics');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchEngagementMetrics();
  }, [deploymentId]);

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <XStack alignItems="center" justifyContent="center" height={384} borderWidth={1} borderRadius="$5">
        <Paragraph color="$color11">Loading engagement metrics...</Paragraph>
      </XStack>
    );
  }

  if (!data) {
    return (
      <XStack alignItems="center" justifyContent="center" height={384} borderWidth={1} borderRadius="$5">
        <Paragraph color="$color11">No engagement data available</Paragraph>
      </XStack>
    );
  }

  return (
    <YStack rowGap="$5">
      {/* Time on Page Overview */}
      <YStack gap="$4">
        <YStack borderWidth={1} borderRadius="$5" padding="$4">
          <SizableText fontSize="$3" color="$color11" marginBottom="$1" display="flex" flexDirection="column">Average Time on Page</SizableText>
          <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">{formatDuration(data.timeOnPage.average)}</SizableText>
        </YStack>
        <YStack borderWidth={1} borderRadius="$5" padding="$4">
          <SizableText fontSize="$3" color="$color11" marginBottom="$1" display="flex" flexDirection="column">Median Time on Page</SizableText>
          <SizableText fontSize="$8" fontWeight="500" display="flex" flexDirection="column">{formatDuration(data.timeOnPage.median)}</SizableText>
        </YStack>
      </YStack>

      {/* Time on Page by Page */}
      <YStack borderWidth={1} borderRadius="$5" padding="$4">
        <H3 fontWeight="500" marginBottom="$4">Time on Page by Path</H3>
        <YStack rowGap="$2">
          {Object.entries(data.timeOnPage.distribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([page, time]) => (
              <XStack key={page} justifyContent="space-between" alignItems="center">
                <SizableText fontSize="$3" numberOfLines={1} flex={1}>{page}</SizableText>
                <SizableText fontSize="$3" fontWeight="500" marginLeft="$4">{formatDuration(time)}</SizableText>
              </XStack>
            ))}
        </YStack>
      </YStack>

      {/* Scroll Depth */}
      <YStack borderWidth={1} borderRadius="$5" padding="$4">
        <H3 fontWeight="500" marginBottom="$4">Scroll Depth Funnel</H3>
        <YStack rowGap="$3">
          <SizableText fontSize="$3" color="$color11" marginBottom="$2" display="flex" flexDirection="column">
            Average: <SizableText fontWeight="500" color="$color">{data.scrollDepth.average.toFixed(1)}%</SizableText>
          </SizableText>
          {(() => {
            const milestones = [25, 50, 75, 100];
            // Calculate cumulative counts (users who reached AT LEAST this depth)
            const cumulativeCounts = milestones.map((milestone) => {
              // Sum all events at this milestone and above
              return milestones
                .filter((m) => m >= milestone)
                .reduce((sum, m) => sum + (Number(data.scrollDepth.milestones[m]) || 0), 0);
            });

            const maxCount = Number(cumulativeCounts[0]) || 1; // Max is "reached 25%+"

            return milestones.map((milestone, index) => {
              const count = Number(cumulativeCounts[index]) || 0;
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={milestone}>
                  <SizableText justifyContent="space-between" fontSize="$3" marginBottom="$1" display="flex" flexDirection="row">
                    <span>Reached {milestone}%+</span>
                    <SizableText color="$color11">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </SizableText>
                  </SizableText>
                  <YStack height="$5" backgroundColor="$color3" borderRadius="$2" overflow="hidden">
                    <YStack
                      height="100%" backgroundColor="$color12"
                      style={{ width: `${percentage}%` }}
  />
                  </YStack>
                </div>
              );
            });
          })()}
        </YStack>
      </YStack>

      {/* Top Landing Pages */}
      <YStack borderWidth={1} borderRadius="$5" padding="$4">
        <H3 fontWeight="500" marginBottom="$4">Top Landing Pages</H3>
        <YStack rowGap="$2">
          {data.topLandingPages.slice(0, 10).map((landing) => (
            <XStack key={landing.page} justifyContent="space-between" alignItems="center" borderBottomWidth={1} paddingBottom="$2">
              <YStack flex={1}>
                <SizableText fontSize="$3" fontWeight="500" display="flex" flexDirection="column">{landing.page}</SizableText>
                <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">
                  {landing.visitCount.toLocaleString()} visits
                </SizableText>
              </YStack>
              <SizableText textAlign="right" display="flex" flexDirection="column">
                <SizableText fontSize="$3" display="flex" flexDirection="column">
                  <SizableText {...{ color: landing.bounceRate > 0.7 ? '#ef4444' : landing.bounceRate > 0.4 ? '#f97316' : '#22c55e' }}>
                    {(landing.bounceRate * 100).toFixed(1)}%
                  </SizableText>
                </SizableText>
                <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">bounce rate</SizableText>
              </SizableText>
            </XStack>
          ))}
        </YStack>
      </YStack>

      {/* Exit Pages */}
      <YStack borderWidth={1} borderRadius="$5" padding="$4">
        <H3 fontWeight="500" marginBottom="$4">Top Exit Pages</H3>
        <YStack rowGap="$2">
          {data.exitPages.slice(0, 10).map((exit) => (
            <XStack key={exit.page} justifyContent="space-between" alignItems="center">
              <SizableText fontSize="$3" numberOfLines={1} flex={1}>{exit.page}</SizableText>
              <SizableText textAlign="right" marginLeft="$4" display="flex" flexDirection="column">
                <SizableText fontSize="$3" fontWeight="500" display="flex" flexDirection="column">{exit.exitCount.toLocaleString()}</SizableText>
                <SizableText fontSize="$1" color="$color11" display="flex" flexDirection="column">
                  {(exit.exitRate * 100).toFixed(1)}% exit rate
                </SizableText>
              </SizableText>
            </XStack>
          ))}
        </YStack>
      </YStack>

      {/* Refresh Button */}
      <XStack justifyContent="flex-end">
        <Button onClick={fetchEngagementMetrics} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </XStack>
    </YStack>
  );
}
