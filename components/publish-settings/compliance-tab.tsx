'use client';

import { YStack, XStack, H3, Paragraph, H4 } from '@hanzo/gui';
import { PublishSettings, ComplianceConfig } from '@/lib/vfs/types';
import { Label, Input, Textarea, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Shield, Info, Cookie } from 'lucide-react';

interface ComplianceTabProps {
  settings: PublishSettings;
  onChange: (settings: PublishSettings) => void;
}

export function ComplianceTab({ settings, onChange }: ComplianceTabProps) {
  const handleComplianceChange = (
    field: keyof ComplianceConfig,
    value: any
  ) => {
    onChange({
      ...settings,
      compliance: {
        ...settings.compliance,
        [field]: value,
      },
    });
  };

  return (
    <YStack rowGap="$5">
      <XStack alignItems="center" justifyContent="space-between">
        <div>
          <H3 fontSize="$6" fontWeight="500">Compliance & Consent</H3>
          <Paragraph fontSize="$3" color="$color11">
            Cookie consent banner and privacy compliance
          </Paragraph>
        </div>
      </XStack>

      {/* Enable Compliance Banner */}
      <XStack alignItems="center" justifyContent="space-between" padding="$4" borderWidth={1} borderRadius="$5">
        <YStack rowGap="$1">
          <Label htmlFor="compliance-enabled" fontSize="$4">
            Enable Consent Banner
          </Label>
          <Paragraph fontSize="$3" color="$color11">
            Show a cookie consent banner to visitors
          </Paragraph>
        </YStack>
        <Switch
          id="compliance-enabled"
          checked={settings.compliance.enabled}
          onCheckedChange={(checked) =>
            handleComplianceChange('enabled', checked)
          }
  />
      </XStack>

      {settings.compliance.enabled && (
        <>
          {/* Banner Configuration */}
          <YStack rowGap="$4">
            <div>
              <H4 fontWeight="500" marginBottom="$4">Banner Configuration</H4>
            </div>

            {/* Banner Position */}
            <YStack rowGap="$2">
              <Label htmlFor="banner-position">Banner Position</Label>
              <Select
                value={settings.compliance.bannerPosition}
                onValueChange={(value) =>
                  handleComplianceChange('bannerPosition', value)
                }
              >
                <SelectTrigger id="banner-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </YStack>

            {/* Banner Style */}
            <YStack rowGap="$2">
              <Label htmlFor="banner-style">Banner Style</Label>
              <Select
                value={settings.compliance.bannerStyle}
                onValueChange={(value) =>
                  handleComplianceChange('bannerStyle', value)
                }
              >
                <SelectTrigger id="banner-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Full-width Bar</SelectItem>
                  <SelectItem value="modal">Centered Modal</SelectItem>
                  <SelectItem value="corner">Bottom-right Corner</SelectItem>
                </SelectContent>
              </Select>
            </YStack>

            {/* Banner Message */}
            <YStack rowGap="$2">
              <Label htmlFor="banner-message">Banner Message</Label>
              <Textarea
                id="banner-message"
                placeholder="We use cookies to improve your experience..."
                rows={3}
                value={settings.compliance.message}
                onChange={(e) =>
                  handleComplianceChange('message', e.target.value)
                }
                maxLength={500}
  />
              <Paragraph fontSize="$1" color="$color11">
                {settings.compliance.message.length}/500 characters
              </Paragraph>
            </YStack>

            {/* Button Texts */}
            <YStack gap="$4">
              <YStack rowGap="$2">
                <Label htmlFor="accept-text">Accept Button Text</Label>
                <Input
                  id="accept-text"
                  placeholder="Accept"
                  value={settings.compliance.acceptButtonText}
                  onChange={(e) =>
                    handleComplianceChange('acceptButtonText', e.target.value)
                  }
                  maxLength={50}
  />
              </YStack>

              <YStack rowGap="$2">
                <Label htmlFor="decline-text">Decline Button Text</Label>
                <Input
                  id="decline-text"
                  placeholder="Decline"
                  value={settings.compliance.declineButtonText}
                  onChange={(e) =>
                    handleComplianceChange('declineButtonText', e.target.value)
                  }
                  maxLength={50}
  />
              </YStack>
            </YStack>

            {/* Policy Links */}
            <YStack rowGap="$4">
              <div>
                <H4 fontWeight="500" marginBottom="$2">Policy Links (Optional)</H4>
                <Paragraph fontSize="$3" color="$color11" marginBottom="$4">
                  Add links to your privacy and cookie policies
                </Paragraph>
              </div>

              <YStack rowGap="$2">
                <Label htmlFor="privacy-policy-url">Privacy Policy URL</Label>
                <Input
                  id="privacy-policy-url"
                  type="url"
                  placeholder="https://example.com/privacy"
                  value={settings.compliance.privacyPolicyUrl || ''}
                  onChange={(e) =>
                    handleComplianceChange('privacyPolicyUrl', e.target.value)
                  }
  />
              </YStack>

              <YStack rowGap="$2">
                <Label htmlFor="cookie-policy-url">Cookie Policy URL</Label>
                <Input
                  id="cookie-policy-url"
                  type="url"
                  placeholder="https://example.com/cookies"
                  value={settings.compliance.cookiePolicyUrl || ''}
                  onChange={(e) =>
                    handleComplianceChange('cookiePolicyUrl', e.target.value)
                  }
  />
              </YStack>
            </YStack>
          </YStack>

          {/* Compliance Mode */}
          <YStack rowGap="$4">
            <div>
              <H4 fontWeight="500" marginBottom="$4">Compliance Mode</H4>
            </div>

            <YStack rowGap="$2">
              <Label htmlFor="compliance-mode">Mode</Label>
              <Select
                value={settings.compliance.mode}
                onValueChange={(value) =>
                  handleComplianceChange('mode', value)
                }
              >
                <SelectTrigger id="compliance-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opt-in">Opt-in (GDPR)</SelectItem>
                  <SelectItem value="opt-out">Opt-out</SelectItem>
                </SelectContent>
              </Select>
              <Paragraph fontSize="$1" color="$color11">
                {settings.compliance.mode === 'opt-in'
                  ? 'Blocks analytics until user accepts (required for GDPR)'
                  : 'Allows analytics by default, user can decline'}
              </Paragraph>
            </YStack>

            {/* Block Analytics Toggle */}
            <XStack alignItems="center" justifyContent="space-between" padding="$4" borderWidth={1} borderRadius="$5">
              <YStack rowGap="$1" flex={1}>
                <XStack alignItems="center" gap="$2">
                  <Label htmlFor="block-analytics" fontSize="$4">
                    Block Analytics Until Consent
                  </Label>
                  <Cookie size={16} />
                </XStack>
                <Paragraph fontSize="$3" color="$color11">
                  Prevent analytics tracking until user accepts
                </Paragraph>
              </YStack>
              <Switch
                id="block-analytics"
                checked={settings.compliance.blockAnalytics}
                onCheckedChange={(checked) =>
                  handleComplianceChange('blockAnalytics', checked)
                }
  />
            </XStack>

            {settings.compliance.mode === 'opt-in' && (
              <YStack padding="$4" backgroundColor="$blue1" borderWidth={1} borderColor="$blue3" borderRadius="$5" $theme-dark={{ backgroundColor: "$blue12", borderColor: "$blue11" }}>
                <XStack gap="$3">
                  <Shield size={20} />
                  <YStack rowGap="$1">
                    <H4 fontWeight="500" color="$blue12" $theme-dark={{ color: "$blue2" }}>
                      GDPR Compliance Mode
                    </H4>
                    <Paragraph fontSize="$3" color="$blue11" $theme-dark={{ color: "$blue3" }}>
                      In opt-in mode, cookies and tracking are blocked by default until
                      the user explicitly accepts. This is required for GDPR compliance.
                    </Paragraph>
                  </YStack>
                </XStack>
              </YStack>
            )}
          </YStack>

          {/* Preview Info */}
          <YStack rowGap="$4">
            <div>
              <H4 fontWeight="500" marginBottom="$4">Preview</H4>
            </div>

            <YStack padding="$4" backgroundColor="$color3" borderRadius="$5" borderWidth={1}>
              <XStack gap="$3">
                <Info size={20} />
                <YStack rowGap="$1">
                  <Paragraph fontSize="$3" fontWeight="500">Live Preview</Paragraph>
                  <Paragraph fontSize="$3" color="$color11">
                    The consent banner will appear on your published deployment based on the
                    configuration above. Visitors' choices are stored in their browser's
                    localStorage.
                  </Paragraph>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </>
      )}
    </YStack>
  );
}
