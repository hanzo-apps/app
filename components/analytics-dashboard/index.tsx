'use client';

import { XStack, SizableText, YStack, Paragraph, H3 } from '@hanzo/gui';
import { useState, useEffect } from 'react';
import { Deployment } from '@/lib/vfs/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Tabs, TabsContent, TabsList, TabsTrigger, toast } from '@hanzo/ui';
import { HeatmapViewer } from '@/components/heatmap-viewer';
import { SessionViewer } from '@/components/session-viewer';
import { EngagementMetrics } from '@/components/engagement-metrics';
import { BarChart3, MousePointerClick, Users, Activity, Download, Trash2 } from 'lucide-react';

interface AnalyticsDashboardProps {
  deployment: Deployment;
  isOpen: boolean;
  onClose: () => void;
}

interface AnalyticsOverview {
  totalPageviews: number;
  uniqueVisitors: number;
  averageTimeOnSite: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  deviceBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
}

interface StorageInfo {
  totalMB: number;
  breakdown: {
    pageviews: { count: number; sizeMB: number };
    interactions: { count: number; sizeMB: number };
    sessions: { count: number; sizeMB: number };
  };
}

export function AnalyticsDashboard({ deployment, isOpen, onClose }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notPublished, setNotPublished] = useState(false);

  useEffect(() => {
    if (!deployment) return;

    // Check if deployment has been published (database enabled)
    if (!deployment.databaseEnabled) {
      setNotPublished(true);
      setLoading(false);
      return;
    }

    setNotPublished(false);
    fetchOverview();
    fetchStorage();
  }, [deployment?.id, deployment?.databaseEnabled]);

  const fetchOverview = async () => {
    if (!deployment) return;
    try {
      setLoading(true);
      const response = await fetch(`/v1/analytics/${deployment.id}/overview`);

      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: AnalyticsOverview = await response.json();
      setOverview(data);

      const uniquePages = Array.from(new Set(data.topPages.map(p => p.page)));
      setPages(uniquePages);
    } catch (error) {
      console.error('Failed to fetch analytics overview:', error);
      toast.error(`Failed to load overview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorage = async () => {
    if (!deployment) return;
    try {
      const response = await fetch(`/v1/analytics/${deployment.id}/storage`);

      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Storage API Error:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: StorageInfo = await response.json();
      setStorage(data);
    } catch (error) {
      console.error('Failed to fetch storage info:', error);
      toast.error(`Failed to load storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = async () => {
    if (!deployment) return;
    try {
      const response = await fetch(`/v1/analytics/${deployment.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv', type: 'all' }),
      });

      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to export data');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${deployment.id}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Analytics data exported');
    } catch (error) {
      console.error('Failed to export analytics:', error);
      toast.error('Failed to export analytics data');
    }
  };

  const handleClearData = async () => {
    if (!deployment) return;
    if (!confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/v1/analytics/${deployment.id}/clear?type=all`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to clear data');

      toast.success('Analytics data cleared');
      fetchOverview();
      fetchStorage();
    } catch (error) {
      console.error('Failed to clear analytics:', error);
      toast.error('Failed to clear analytics data');
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!deployment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent maxWidth="64rem" height="90vh" padding="$0" flexDirection="column">
        <XStack borderBottomWidth={1} paddingHorizontal="$5" paddingVertical="$4" alignItems="center" justifyContent="space-between">
          <DialogHeader rowGap="$1">
            <DialogTitle fontSize="$8">Analytics Dashboard</DialogTitle>
            <DialogDescription>{deployment.name || deployment.id}</DialogDescription>
          </DialogHeader>
          <XStack alignItems="center" gap="$2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={notPublished}>
              <Download size={16} />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearData} disabled={notPublished}>
              <Trash2 size={16} />
              Clear Data
            </Button>
          </XStack>
        </XStack>

        {storage && (
        <SizableText borderBottomWidth={1} paddingHorizontal="$5" paddingVertical="$2" backgroundColor="$color3" fontSize="$3">
          <SizableText color="$color11">Storage:</SizableText>{' '}
          <SizableText fontWeight="500">{storage.totalMB.toFixed(2)} MB</SizableText>
          {' • '}
          <SizableText color="$color11">Pageviews:</SizableText>{' '}
          <SizableText fontWeight="500">{storage.breakdown.pageviews.count.toLocaleString()}</SizableText>
          {' • '}
          <SizableText color="$color11">Interactions:</SizableText>{' '}
          <SizableText fontWeight="500">{storage.breakdown.interactions.count.toLocaleString()}</SizableText>
          {' • '}
          <SizableText color="$color11">Sessions:</SizableText>{' '}
          <SizableText fontWeight="500">{storage.breakdown.sessions.count.toLocaleString()}</SizableText>
        </SizableText>
      )}

      <YStack flex={1} overflow="scroll">
        <Tabs value={activeTab} onValueChange={setActiveTab} height="100%" flexDirection="column">
          <YStack borderBottomWidth={1} paddingHorizontal="$5">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 size={16} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="heatmaps">
                <MousePointerClick size={16} />
                Heatmaps
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <Users size={16} />
                Sessions
              </TabsTrigger>
              <TabsTrigger value="engagement">
                <Activity size={16} />
                Engagement
              </TabsTrigger>
            </TabsList>
          </YStack>

          <YStack flex={1} overflow="scroll">
            <TabsContent value="overview" padding="$5" rowGap="$5">
              {loading && (
                <XStack alignItems="center" justifyContent="center" height={384}>
                  <Paragraph color="$color11">Loading analytics...</Paragraph>
                </XStack>
              )}

              {!loading && notPublished && (
                <YStack alignItems="center" justifyContent="center" height={384}>
                  <BarChart3 size={64} />
                  <H3 fontSize="$6" fontWeight="500" marginBottom="$2" textAlign="center">Analytics Not Available</H3>
                  <Paragraph color="$color11" maxWidth={448} textAlign="center">
                    Analytics data will be available after you publish your deployment for the first time.
                    The analytics database is created when the deployment is published.
                  </Paragraph>
                </YStack>
              )}

              {!loading && !notPublished && overview && (
                <>
                  <YStack gap="$4">
                    <YStack borderWidth={1} borderRadius="$5" padding="$4">
                      <SizableText fontSize="$3" color="$color11">Total Pageviews</SizableText>
                      <SizableText fontSize="$8" fontWeight="500">{overview.totalPageviews.toLocaleString()}</SizableText>
                    </YStack>
                    <YStack borderWidth={1} borderRadius="$5" padding="$4">
                      <SizableText fontSize="$3" color="$color11">Unique Visitors</SizableText>
                      <SizableText fontSize="$8" fontWeight="500">{overview.uniqueVisitors.toLocaleString()}</SizableText>
                    </YStack>
                    <YStack borderWidth={1} borderRadius="$5" padding="$4">
                      <SizableText fontSize="$3" color="$color11">Avg. Time on Site</SizableText>
                      <SizableText fontSize="$8" fontWeight="500">{formatDuration(overview.averageTimeOnSite)}</SizableText>
                    </YStack>
                    <YStack borderWidth={1} borderRadius="$5" padding="$4">
                      <SizableText fontSize="$3" color="$color11">Bounce Rate</SizableText>
                      <SizableText fontSize="$8" fontWeight="500">{(overview.bounceRate * 100).toFixed(1)}%</SizableText>
                    </YStack>
                  </YStack>

                  <YStack borderWidth={1} borderRadius="$5" padding="$4">
                    <H3 fontWeight="500" marginBottom="$4">Top Pages</H3>
                    <YStack rowGap="$2">
                      {overview.topPages.map((page) => (
                        <XStack key={page.page} justifyContent="space-between" alignItems="center">
                          <SizableText fontSize="$3" numberOfLines={1} flex={1}>{page.page}</SizableText>
                          <SizableText fontSize="$3" fontWeight="500" marginLeft="$4">{page.views.toLocaleString()}</SizableText>
                        </XStack>
                      ))}
                    </YStack>
                  </YStack>

                  <YStack borderWidth={1} borderRadius="$5" padding="$4">
                    <H3 fontWeight="500" marginBottom="$4">Top Referrers</H3>
                    <YStack rowGap="$2">
                      {overview.topReferrers.map((referrer) => (
                        <XStack key={referrer.referrer} justifyContent="space-between" alignItems="center">
                          <SizableText fontSize="$3" numberOfLines={1} flex={1}>
                            {referrer.referrer || '(Direct)'}
                          </SizableText>
                          <SizableText fontSize="$3" fontWeight="500" marginLeft="$4">{referrer.count.toLocaleString()}</SizableText>
                        </XStack>
                      ))}
                    </YStack>
                  </YStack>

                  <YStack borderWidth={1} borderRadius="$5" padding="$4">
                    <H3 fontWeight="500" marginBottom="$4">Device Breakdown</H3>
                    <YStack rowGap="$2">
                      {Object.entries(overview.deviceBreakdown).map(([device, count]) => {
                        const total = Object.values(overview.deviceBreakdown).reduce((sum, c) => sum + c, 0);
                        const percentage = total > 0 ? (count / total) * 100 : 0;

                        return (
                          <div key={device}>
                            <XStack justifyContent="space-between" marginBottom="$1">
                              <SizableText textTransform="capitalize" fontSize="$3">{device}</SizableText>
                              <SizableText color="$color11" fontSize="$3">
                                {count.toLocaleString()} ({percentage.toFixed(1)}%)
                              </SizableText>
                            </XStack>
                            <YStack height="$5" backgroundColor="$color3" borderRadius="$2" overflow="hidden">
                              <YStack height="100%" backgroundColor="$color12" style={{ width: `${percentage}%` }} />
                            </YStack>
                          </div>
                        );
                      })}
                    </YStack>
                  </YStack>
                </>
              )}
            </TabsContent>

            <TabsContent value="heatmaps" padding="$5">
              {notPublished ? (
                <YStack alignItems="center" justifyContent="center" height={384}>
                  <MousePointerClick size={64} />
                  <H3 fontSize="$6" fontWeight="500" marginBottom="$2" textAlign="center">Heatmaps Not Available</H3>
                  <Paragraph color="$color11" maxWidth={448} textAlign="center">
                    Heatmap data will be collected after you publish your deployment.
                  </Paragraph>
                </YStack>
              ) : (
                <HeatmapViewer deploymentId={deployment.id} pages={pages} />
              )}
            </TabsContent>

            <TabsContent value="sessions" padding="$5">
              {notPublished ? (
                <YStack alignItems="center" justifyContent="center" height={384}>
                  <Users size={64} />
                  <H3 fontSize="$6" fontWeight="500" marginBottom="$2" textAlign="center">Sessions Not Available</H3>
                  <Paragraph color="$color11" maxWidth={448} textAlign="center">
                    Session data will be collected after you publish your deployment.
                  </Paragraph>
                </YStack>
              ) : (
                <SessionViewer deploymentId={deployment.id} />
              )}
            </TabsContent>

            <TabsContent value="engagement" padding="$5">
              {notPublished ? (
                <YStack alignItems="center" justifyContent="center" height={384}>
                  <Activity size={64} />
                  <H3 fontSize="$6" fontWeight="500" marginBottom="$2" textAlign="center">Engagement Metrics Not Available</H3>
                  <Paragraph color="$color11" maxWidth={448} textAlign="center">
                    Engagement data will be collected after you publish your deployment.
                  </Paragraph>
                </YStack>
              ) : (
                <EngagementMetrics deploymentId={deployment.id} />
              )}
            </TabsContent>
          </YStack>
        </Tabs>
        </YStack>
      </DialogContent>
    </Dialog>
  );
}
