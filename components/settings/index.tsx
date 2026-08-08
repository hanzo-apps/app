'use client';

import { YStack, H3, Paragraph, XStack, H4, SizableText } from '@hanzo/ui';
import { useState, useEffect } from 'react';
import { configManager, AppSettings, CostSettings } from '@/lib/config/storage';
import { Button, Input, Label, Switch, toast, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@hanzo/ui';
import { DollarSign, AlertTriangle, Info, Download, Upload, Database, ChevronDown, Palette } from 'lucide-react';
import { CostCalculator } from '@/lib/llm/cost-calculator';
import { AboutModal } from '@/components/about-modal';
import { BackupService } from '@/lib/vfs/backup-service';
import { setTelemetryOptIn } from '@/lib/telemetry';
import { Appearance } from '@hanzo/appearance';

interface SettingsPanelProps {
  onClose?: () => void;
}

export function SettingsPanel({ onClose: _onClose }: SettingsPanelProps) {
  const [_settings, setSettings] = useState<AppSettings>({});
  const [costSettings, setCostSettings] = useState<CostSettings>({});
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState('');
  const [telemetryOptIn, setTelemetryOptInState] = useState(() =>
    configManager.getSettings().telemetryOptIn !== false
  );
  const [openSections, setOpenSections] = useState({
    application: true,
    costTracking: true,
    dataManagement: true
  });

  useEffect(() => {
    // Load settings on mount
    setSettings(configManager.getSettings());
    setCostSettings(configManager.getCostSettings());
  }, []);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    configManager.setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const clearSettings = () => {
    if (confirm('Are you sure you want to clear all settings?')) {
      configManager.clearSettings();
      setSettings({});
      toast.success('Settings cleared');
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      await BackupService.exportAllData();
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    // Accept both the legacy `.osws` extension and the current `.hanzo` brand so
    // existing backups still restore. Backups written by BackupService are `.osws`.
    input.accept = '.osws,.hanzo';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsImporting(true);
        setImportProgress(0);
        setImportMessage('Validating file...');

        const validation = await BackupService.validateBackupFile(file);
        if (!validation.valid) {
          toast.error(`Invalid backup file: ${validation.reason}`);
          return;
        }

        const shouldReplace = confirm(
          `Import ${validation.metadata?.projectCount || 0} projects?\n\n` +
          'Choose OK to REPLACE all current data, or Cancel to MERGE with existing data.'
        );

        await BackupService.importAllData(file, {
          mode: shouldReplace ? 'replace' : 'merge',
          onProgress: (progress, message) => {
            setImportProgress(progress);
            setImportMessage(message);
          }
        });

        toast.success('Data imported successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Import failed');
      } finally {
        setIsImporting(false);
        setImportProgress(0);
        setImportMessage('');
      }
    };
    input.click();
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <YStack flex={1} minHeight={0} overflow="hidden">
      {/* Header */}
      <YStack flexShrink={0} paddingBottom="$3" marginBottom="$1" borderBottomWidth={1}>
        <H3 fontWeight="500" fontSize="$4" letterSpacing={-0.4}>Settings</H3>
        <Paragraph color="$color11" fontSize="$1" marginTop="$1">
          Application preferences and data management
        </Paragraph>
      </YStack>

      {/* Scrollable content */}
      <YStack flex={1} minHeight={0} overflow="scroll">
      <YStack rowGap="$3" paddingBottom="$4">

        {/* Application Settings Section */}
        <Collapsible
          open={openSections.application}
          onOpenChange={() => toggleSection('application')}
        >
          <CollapsibleTrigger alignItems="center" justifyContent="space-between" width="100%" padding="$3" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}>
            <XStack alignItems="center" gap="$2">
              <Palette size={16} />
              <H4 fontWeight="500" fontSize="$3">Application Settings</H4>
            </XStack>
            <ChevronDown
              size={16}
  />
          </CollapsibleTrigger>
          <CollapsibleContent paddingHorizontal="$3" paddingTop="$2" paddingBottom="$3">
            <Paragraph color="$color11" fontSize="$1" marginBottom="$4">
              Configure your preferences and display options
            </Paragraph>
            <YStack rowGap="$4">
              {/* No theme tabs: hanzo.app is dark-only and the theme is FORCED in
                  app/providers.tsx, so Light/System could only write a preference
                  nothing reads.

                  Text size, density and accent DO read: @hanzo/design publishes
                  them as knobs every ramp multiplies by, and since @hanzo/ui
                  8.0.69 the `$n` type ladder resolves through `var(--text-*)`,
                  so one of these moves the whole product rather than the handful
                  of places that happen to read a token directly.

                  It is @hanzo/appearance, not a panel written here, because
                  hanzo.chat and the console need the same screen and three
                  near-identical ones is how "the same product" stops looking
                  like it. */}
              <Appearance />

              {/* Telemetry */}
              <XStack alignItems="center" justifyContent="space-between">
                <div>
                  <Label htmlFor="telemetry">Anonymous Usage Analytics</Label>
                  <Paragraph fontSize="$1" color="$color11" marginTop="$0.5">
                    Help improve Hanzo App by sharing anonymous usage data
                  </Paragraph>
                </div>
                <Switch
                  id="telemetry"
                  checked={telemetryOptIn}
                  onCheckedChange={(checked) => {
                    setTelemetryOptInState(checked);
                    setTelemetryOptIn(checked);
                  }}
  />
              </XStack>
            </YStack>
          </CollapsibleContent>
        </Collapsible>

        {/* Cost Tracking Section */}
        <Collapsible
          open={openSections.costTracking}
          onOpenChange={() => toggleSection('costTracking')}
        >
          <CollapsibleTrigger alignItems="center" justifyContent="space-between" width="100%" padding="$3" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}>
            <XStack alignItems="center" gap="$2">
              <DollarSign size={16} />
              <H4 fontWeight="500" fontSize="$3">Cost Tracking</H4>
            </XStack>
            <ChevronDown
              size={16}
  />
          </CollapsibleTrigger>
          <CollapsibleContent paddingHorizontal="$3" paddingTop="$2" paddingBottom="$3">
            <YStack rowGap="$4">
              {/* Show Costs */}
              <XStack alignItems="center" justifyContent="space-between">
                <div>
                  <Label htmlFor="show-costs">Display Costs</Label>
                  <Paragraph fontSize="$1" color="$color11" marginTop="$0.5">
                    Show cost information in messages
                  </Paragraph>
                </div>
                <Switch
                  id="show-costs"
                  checked={costSettings.showCosts !== false}
                  onCheckedChange={(checked) => {
                    const newCostSettings = { ...costSettings, showCosts: checked };
                    configManager.setCostSettings(newCostSettings);
                    setCostSettings(newCostSettings);
                  }}
  />
              </XStack>

              {/* Daily + Project Limits — 2 column grid */}
              <YStack gap="$3">
                <div>
                  <Label htmlFor="daily-limit" fontSize="$1">Daily Limit (USD)</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                    marginTop="$1.5"
                    value={costSettings.dailyLimit || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      const newCostSettings = { ...costSettings, dailyLimit: value };
                      configManager.setCostSettings(newCostSettings);
                      setCostSettings(newCostSettings);
                    }}
  />
                </div>
                <div>
                  <Label htmlFor="project-limit" fontSize="$1">Project Limit (USD)</Label>
                  <Input
                    id="project-limit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                    marginTop="$1.5"
                    value={costSettings.projectLimit || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      const newCostSettings = { ...costSettings, projectLimit: value };
                      configManager.setCostSettings(newCostSettings);
                      setCostSettings(newCostSettings);
                    }}
  />
                </div>
              </YStack>

              {/* Warning Threshold */}
              <div>
                <Label htmlFor="warning-threshold" fontSize="$1">Warning Threshold</Label>
                <XStack alignItems="center" gap="$3" marginTop="$1.5">
                  <Input
                    id="warning-threshold"
                    type="number"
                    min="50"
                    max="100"
                    step="5"
                    flex={1}
                    value={costSettings.warningThreshold || 80}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const newCostSettings = { ...costSettings, warningThreshold: value };
                      configManager.setCostSettings(newCostSettings);
                      setCostSettings(newCostSettings);
                    }}
  />
                  <XStack alignItems="center" gap="$1">
                    <AlertTriangle size={12} />
                    <SizableText fontSize="$1" color="$color11" whiteSpace="nowrap" fontFamily="$mono">
                      Warn at {costSettings.warningThreshold || 80}%
                    </SizableText>
                  </XStack>
                </XStack>
              </div>

              {/* Lifetime Costs */}
              <XStack alignItems="center" justifyContent="space-between" backgroundColor="$color3" borderWidth={1} borderRadius="$5" padding="$3">
                <div>
                  <YStack><SizableText fontSize="$1" color="$color11" fontWeight="500">Lifetime Total</SizableText></YStack>
                  <YStack marginTop="$0.5">
                    <SizableText fontSize="$6" fontWeight="700" fontFamily="$mono" letterSpacing={-0.4}>
                      {CostCalculator.formatCost(configManager.getLifetimeCosts().total)}
                    </SizableText>
                  </YStack>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Reset lifetime cost tracking? This cannot be undone.')) {
                      configManager.resetLifetimeCosts();
                      toast.success('Lifetime costs reset');
                    }
                  }}
                >
                  Reset Stats
                </Button>
              </XStack>
            </YStack>
          </CollapsibleContent>
        </Collapsible>

        {/* Data Management Section */}
        <Collapsible
          open={openSections.dataManagement}
          onOpenChange={() => toggleSection('dataManagement')}
        >
          <CollapsibleTrigger alignItems="center" justifyContent="space-between" width="100%" padding="$3" borderRadius="$5" hoverStyle={{ backgroundColor: "$color3" }}>
            <XStack alignItems="center" gap="$2">
              <Database size={16} />
              <H4 fontWeight="500" fontSize="$3">Data Management</H4>
            </XStack>
            <ChevronDown
              size={16}
  />
          </CollapsibleTrigger>
          <CollapsibleContent paddingHorizontal="$3" paddingTop="$2" paddingBottom="$3">
            <Paragraph fontSize="$1" color="$color11" marginBottom="$4">
              Backup and restore your projects, conversations, and settings.
            </Paragraph>

            <YStack rowGap="$2.5">
              {/* Export Data */}
              <XStack alignItems="center" gap="$3" padding="$3" borderRadius="$5" borderWidth={1}>
                <Download size={16} />
                <YStack flex={1} minWidth={0}>
                  <YStack><SizableText fontSize="$3" fontWeight="500">Export All Data</SizableText></YStack>
                  <YStack>
                    <SizableText fontSize="$1" color="$color11">
                      Download a backup of all projects and data
                    </SizableText>
                  </YStack>
                </YStack>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </XStack>

              {/* Import Data */}
              <XStack alignItems="center" gap="$3" padding="$3" borderRadius="$5" borderWidth={1}>
                <Upload size={16} />
                <YStack flex={1} minWidth={0}>
                  <YStack><SizableText fontSize="$3" fontWeight="500">Import Data</SizableText></YStack>
                  <YStack>
                    <SizableText fontSize="$1" color="$color11">
                      Restore from a Hanzo backup file
                    </SizableText>
                  </YStack>
                </YStack>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportData}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </XStack>

              {/* Import Progress */}
              {isImporting && (
                <YStack rowGap="$2">
                  <XStack justifyContent="space-between">
                    <SizableText fontSize="$1">{importMessage}</SizableText>
                    <SizableText fontSize="$1">{importProgress}%</SizableText>
                  </XStack>
                  <YStack width="100%" backgroundColor="$color3" borderRadius="$10" height="$2">
                    <YStack
                      backgroundColor="$color12" height="$2" borderRadius="$10"
                      style={{ width: `${importProgress}%` }}
  />
                  </YStack>
                </YStack>
              )}
            </YStack>
          </CollapsibleContent>
        </Collapsible>
      </YStack>
      </YStack>{/* end scrollable content */}

      {/* Footer */}
      <XStack flexShrink={0} alignItems="center" justifyContent="space-between" paddingTop="$4" paddingHorizontal="$3" borderTopWidth={1}>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSettings}
        >
          <SizableText color="$red9">Clear All Settings</SizableText>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAboutModalOpen(true)}
        >
          <Info size={14} />
          About Hanzo App
        </Button>
      </XStack>

      <AboutModal
        open={aboutModalOpen}
        onOpenChange={setAboutModalOpen}
  />
    </YStack>
  );
}
