'use client';

import { YStack, XStack, H3, Paragraph, H4, SizableText } from '@hanzo/gui';
import { PublishSettings, AnalyticsConfig } from '@/lib/vfs/types';
import { Label, Input, Textarea, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Shield, Info } from 'lucide-react';

interface AnalyticsTabProps {
  settings: PublishSettings;
  onChange: (settings: PublishSettings) => void;
}

export function AnalyticsTab({ settings, onChange }: AnalyticsTabProps) {
  const handleAnalyticsChange = (
    field: keyof AnalyticsConfig,
    value: any
  ) => {
    onChange({
      ...settings,
      analytics: {
        ...settings.analytics,
        [field]: value,
      },
    });
  };

  return (
    <YStack rowGap="$5">
      <XStack alignItems="center" justifyContent="space-between">
        <div>
          <H3 fontSize="$6" fontWeight="500">Analytics Configuration</H3>
          <Paragraph fontSize="$3" color="$color11">
            Track visitors and site usage
          </Paragraph>
        </div>
      </XStack>

      {/* Enable Analytics */}
      <XStack alignItems="center" justifyContent="space-between" padding="$4" borderWidth={1} borderRadius="$5">
        <YStack rowGap="$1">
          <Label htmlFor="analytics-enabled" fontSize="$4">
            Enable Analytics
          </Label>
          <Paragraph fontSize="$3" color="$color11">
            Track page views and visitor statistics
          </Paragraph>
        </YStack>
        <Switch
          id="analytics-enabled"
          checked={settings.analytics.enabled}
          onCheckedChange={(checked) =>
            handleAnalyticsChange('enabled', checked)
          }
  />
      </XStack>

      {settings.analytics.enabled && (
        <>
          {/* Provider Selection */}
          <YStack rowGap="$4">
            <div>
              <H4 fontWeight="500" marginBottom="$4">Analytics Provider</H4>
            </div>

            <YStack rowGap="$2">
              <Label htmlFor="analytics-provider">Provider</Label>
              <Select
                value={settings.analytics.provider}
                onValueChange={(value) =>
                  handleAnalyticsChange('provider', value)
                }
              >
                <SelectTrigger id="analytics-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builtin">
                    Built-in (Privacy-focused)
                  </SelectItem>
                  <SelectItem value="gtm">Google Tag Manager</SelectItem>
                  <SelectItem value="ga4">Google Analytics 4</SelectItem>
                  <SelectItem value="plausible">Plausible Analytics</SelectItem>
                  <SelectItem value="custom">Custom Script</SelectItem>
                </SelectContent>
              </Select>
            </YStack>

            {/* Built-in Analytics Features */}
            {settings.analytics.provider === 'builtin' && (
              <>
                <YStack rowGap="$4">
                  <div>
                    <H4 fontWeight="500" marginBottom="$2">Analytics Features</H4>
                    <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                      Choose which analytics features to enable. Note: Heatmaps and session recording generate more data.
                    </Paragraph>
                  </div>

                  {/* Feature Toggles */}
                  <YStack rowGap="$3">
                    <XStack alignItems="center" justifyContent="space-between" padding="$3" borderWidth={1} borderRadius="$5">
                      <YStack rowGap="$1">
                        <Label htmlFor="feature-basic" fontWeight="500">Basic Tracking</Label>
                        <Paragraph fontSize="$1" color="$color11">Pageviews, referrers, device type</Paragraph>
                      </YStack>
                      <Switch
                        id="feature-basic"
                        checked={settings.analytics.features?.basicTracking !== false}
                        onCheckedChange={(checked) =>
                          handleAnalyticsChange('features', {
                            ...settings.analytics.features,
                            basicTracking: checked
                          })
                        }
  />
                    </XStack>

                    <XStack alignItems="center" justifyContent="space-between" padding="$3" borderWidth={1} borderRadius="$5">
                      <YStack rowGap="$1">
                        <Label htmlFor="feature-heatmaps" fontWeight="500">Heatmaps</Label>
                        <Paragraph fontSize="$1" color="$color11">Click coordinates and scroll tracking</Paragraph>
                      </YStack>
                      <Switch
                        id="feature-heatmaps"
                        checked={settings.analytics.features?.heatmaps === true}
                        onCheckedChange={(checked) =>
                          handleAnalyticsChange('features', {
                            ...settings.analytics.features,
                            heatmaps: checked
                          })
                        }
  />
                    </XStack>

                    <XStack alignItems="center" justifyContent="space-between" padding="$3" borderWidth={1} borderRadius="$5">
                      <YStack rowGap="$1">
                        <Label htmlFor="feature-sessions" fontWeight="500">Session Recording</Label>
                        <Paragraph fontSize="$1" color="$color11">Journey paths and page flows</Paragraph>
                      </YStack>
                      <Switch
                        id="feature-sessions"
                        checked={settings.analytics.features?.sessionRecording === true}
                        onCheckedChange={(checked) =>
                          handleAnalyticsChange('features', {
                            ...settings.analytics.features,
                            sessionRecording: checked
                          })
                        }
  />
                    </XStack>

                    <XStack alignItems="center" justifyContent="space-between" padding="$3" borderWidth={1} borderRadius="$5">
                      <YStack rowGap="$1">
                        <Label htmlFor="feature-performance" fontWeight="500">Performance Metrics</Label>
                        <Paragraph fontSize="$1" color="$color11">Core Web Vitals monitoring</Paragraph>
                      </YStack>
                      <Switch
                        id="feature-performance"
                        checked={settings.analytics.features?.performanceMetrics === true}
                        onCheckedChange={(checked) =>
                          handleAnalyticsChange('features', {
                            ...settings.analytics.features,
                            performanceMetrics: checked
                          })
                        }
  />
                    </XStack>

                    <XStack alignItems="center" justifyContent="space-between" padding="$3" borderWidth={1} borderRadius="$5">
                      <YStack rowGap="$1">
                        <Label htmlFor="feature-engagement" fontWeight="500">Engagement Tracking</Label>
                        <Paragraph fontSize="$1" color="$color11">Time on page, scroll depth</Paragraph>
                      </YStack>
                      <Switch
                        id="feature-engagement"
                        checked={settings.analytics.features?.engagementTracking === true}
                        onCheckedChange={(checked) =>
                          handleAnalyticsChange('features', {
                            ...settings.analytics.features,
                            engagementTracking: checked
                          })
                        }
  />
                    </XStack>

                    <XStack alignItems="center" justifyContent="space-between" padding="$3" borderWidth={1} borderRadius="$5">
                      <YStack rowGap="$1">
                        <Label htmlFor="feature-custom" fontWeight="500">Custom Events</Label>
                        <Paragraph fontSize="$1" color="$color11">Goal and conversion tracking</Paragraph>
                      </YStack>
                      <Switch
                        id="feature-custom"
                        checked={settings.analytics.features?.customEvents === true}
                        onCheckedChange={(checked) =>
                          handleAnalyticsChange('features', {
                            ...settings.analytics.features,
                            customEvents: checked
                          })
                        }
  />
                    </XStack>
                  </YStack>

                  {/* Warning about data volume */}
                  {(settings.analytics.features?.heatmaps || settings.analytics.features?.sessionRecording) && (
                    <YStack padding="$4" backgroundColor="$orange1" borderWidth={1} borderColor="$orange3" borderRadius="$5" $theme-dark={{ backgroundColor: "$orange12", borderColor: "$orange11" }}>
                      <XStack gap="$3">
                        <Info size={20} color="$orange10" />
                        <YStack rowGap="$1">
                          <H4 fontWeight="500" color="$orange12" $theme-dark={{ color: "$orange2" }}>
                            High Data Volume Features Enabled
                          </H4>
                          <Paragraph fontSize="$3" color="$orange11" $theme-dark={{ color: "$orange3" }}>
                            Heatmaps and session recording generate significantly more data. Consider using shorter retention periods to manage storage costs.
                          </Paragraph>
                        </YStack>
                      </XStack>
                    </YStack>
                  )}
                </YStack>

                {/* Data Retention */}
                <YStack rowGap="$4">
                  <div>
                    <H4 fontWeight="500" marginBottom="$2">Data Retention</H4>
                    <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                      How long to keep analytics data (in days)
                    </Paragraph>
                  </div>

                  <YStack gap="$4">
                    <YStack rowGap="$2">
                      <Label htmlFor="retention-pageviews">Pageviews</Label>
                      <Input
                        id="retention-pageviews"
                        type="number"
                        min="1"
                        max="365"
                        placeholder="90"
                        value={settings.analytics.retention?.pageviews || 90}
                        onChange={(e) =>
                          handleAnalyticsChange('retention', {
                            ...settings.analytics.retention,
                            pageviews: parseInt(e.target.value, 10) || 90
                          })
                        }
  />
                      <Paragraph fontSize="$1" color="$color11">Default: 90 days</Paragraph>
                    </YStack>

                    <YStack rowGap="$2">
                      <Label htmlFor="retention-interactions">Interactions</Label>
                      <Input
                        id="retention-interactions"
                        type="number"
                        min="1"
                        max="365"
                        placeholder="30"
                        value={settings.analytics.retention?.interactions || 30}
                        onChange={(e) =>
                          handleAnalyticsChange('retention', {
                            ...settings.analytics.retention,
                            interactions: parseInt(e.target.value, 10) || 30
                          })
                        }
  />
                      <Paragraph fontSize="$1" color="$color11">Default: 30 days</Paragraph>
                    </YStack>

                    <YStack rowGap="$2">
                      <Label htmlFor="retention-sessions">Sessions</Label>
                      <Input
                        id="retention-sessions"
                        type="number"
                        min="1"
                        max="365"
                        placeholder="60"
                        value={settings.analytics.retention?.sessions || 60}
                        onChange={(e) =>
                          handleAnalyticsChange('retention', {
                            ...settings.analytics.retention,
                            sessions: parseInt(e.target.value, 10) || 60
                          })
                        }
  />
                      <Paragraph fontSize="$1" color="$color11">Default: 60 days</Paragraph>
                    </YStack>
                  </YStack>
                </YStack>
              </>
            )}

            {/* Tracking ID for external providers */}
            {(settings.analytics.provider === 'gtm' ||
              settings.analytics.provider === 'ga4' ||
              settings.analytics.provider === 'plausible') && (
              <YStack rowGap="$2">
                <Label htmlFor="tracking-id">
                  {settings.analytics.provider === 'gtm' && 'Container ID'}
                  {settings.analytics.provider === 'ga4' && 'Measurement ID'}
                  {settings.analytics.provider === 'plausible' && 'Domain'}
                </Label>
                <Input
                  id="tracking-id"
                  placeholder={
                    settings.analytics.provider === 'gtm'
                      ? 'GTM-XXXXXXX'
                      : settings.analytics.provider === 'ga4'
                      ? 'G-XXXXXXXXXX'
                      : 'yourdomain.com'
                  }
                  value={settings.analytics.trackingId || ''}
                  onChange={(e) =>
                    handleAnalyticsChange('trackingId', e.target.value)
                  }
  />
                <Paragraph fontSize="$1" color="$color11">
                  {settings.analytics.provider === 'gtm' &&
                    'Your Google Tag Manager container ID'}
                  {settings.analytics.provider === 'ga4' &&
                    'Your Google Analytics 4 measurement ID'}
                  {settings.analytics.provider === 'plausible' &&
                    'Your website domain registered in Plausible'}
                </Paragraph>
              </YStack>
            )}

            {/* Custom Script */}
            {settings.analytics.provider === 'custom' && (
              <YStack rowGap="$2">
                <Label htmlFor="custom-script">Custom Analytics Script</Label>
                <Textarea
                  id="custom-script"
                  placeholder="<script>...</script>"
                  rows={8}
                  value={settings.analytics.customScript || ''}
                  onChange={(e) =>
                    handleAnalyticsChange('customScript', e.target.value)
                  }
                  fontFamily="$mono" fontSize="$3"
  />
                <Paragraph fontSize="$1" color="$color11">
                  Paste your custom analytics tracking code
                </Paragraph>
              </YStack>
            )}
          </YStack>

          {/* Privacy Mode */}
          <YStack rowGap="$4">
            <div>
              <H4 fontWeight="500" marginBottom="$4">Privacy Settings</H4>
            </div>

            <XStack alignItems="center" justifyContent="space-between" padding="$4" borderWidth={1} borderRadius="$5">
              <YStack rowGap="$1" flex={1}>
                <XStack alignItems="center" gap="$2">
                  <Label htmlFor="privacy-mode" fontSize="$4">
                    Privacy Mode
                  </Label>
                  <Shield size={16} color="$color11" />
                </XStack>
                <Paragraph fontSize="$3" color="$color11">
                  Anonymize IPs and disable cookies for GDPR compliance
                </Paragraph>
              </YStack>
              <Switch
                id="privacy-mode"
                checked={settings.analytics.privacyMode}
                onCheckedChange={(checked) =>
                  handleAnalyticsChange('privacyMode', checked)
                }
  />
            </XStack>

            {settings.analytics.privacyMode && (
              <YStack padding="$4" backgroundColor="$green1" borderWidth={1} borderColor="$green3" borderRadius="$5" $theme-dark={{ backgroundColor: "$green12", borderColor: "$green11" }}>
                <XStack gap="$3">
                  <Info size={20} color="$green10" />
                  <YStack rowGap="$1">
                    <H4 fontWeight="500" color="$green12" $theme-dark={{ color: "$green2" }}>
                      Privacy Mode Enabled
                    </H4>
                    <Paragraph fontSize="$3" color="$green11" $theme-dark={{ color: "$green3" }}>
                      Analytics will respect user privacy by anonymizing IP addresses and
                      avoiding cookies where possible. This helps with GDPR compliance.
                    </Paragraph>
                  </YStack>
                </XStack>
              </YStack>
            )}
          </YStack>

          {/* Preview */}
          {settings.analytics.provider !== 'builtin' && (
            <YStack rowGap="$4">
              <div>
                <H4 fontWeight="500" marginBottom="$4">Script Preview</H4>
              </div>

              <YStack padding="$4" backgroundColor="$color3" borderRadius="$5">
                <SizableText fontSize="$1">
                  {settings.analytics.provider === 'gtm' && (
                    <>
                      {`<!-- Google Tag Manager -->`}
                      <br />
                      {`<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','${
                        settings.analytics.trackingId || 'GTM-XXXXXXX'
                      }');</script>`}
                      <br />
                      {`<!-- End Google Tag Manager -->`}
                    </>
                  )}
                  {settings.analytics.provider === 'ga4' && (
                    <>
                      {`<!-- Google Analytics 4 -->`}
                      <br />
                      {`<script async src="https://www.googletagmanager.com/gtag/js?id=${
                        settings.analytics.trackingId || 'G-XXXXXXXXXX'
                      }"></script>`}
                      <br />
                      {`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}...</script>`}
                      <br />
                      {`<!-- End Google Analytics 4 -->`}
                    </>
                  )}
                  {settings.analytics.provider === 'plausible' && (
                    <>
                      {`<!-- Plausible Analytics -->`}
                      <br />
                      {`<script defer data-domain="${
                        settings.analytics.trackingId || 'yourdomain.com'
                      }" src="https://plausible.io/js/script.js"></script>`}
                      <br />
                      {`<!-- End Plausible Analytics -->`}
                    </>
                  )}
                  {settings.analytics.provider === 'custom' &&
                    (settings.analytics.customScript || 'No custom script provided')}
                </SizableText>
              </YStack>
              <Paragraph fontSize="$1" color="$color11">
                This script will be injected into the &lt;head&gt; section of your deployment
              </Paragraph>
            </YStack>
          )}
        </>
      )}
    </YStack>
  );
}
