'use client';

import { YStack, XStack, Paragraph } from '@hanzo/gui';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModelSettingsPanel } from '@/components/settings/model-settings';
import { SettingsPanel } from '@/components/settings';

interface SettingsViewProps {
  tab?: 'model' | 'application';
}

function SettingsViewInner({ tab }: SettingsViewProps) {
  const searchParams = useSearchParams();
  // URL param takes precedence, then prop, then default to 'model'
  const settingsTab = searchParams.get('settings') as 'model' | 'application' | null;
  const activeTab = settingsTab || tab || 'model';

  return (
    <YStack height="100%">
      <YStack flex={1} overflow="scroll" padding="$5">
        {activeTab === 'application' ? <SettingsPanel /> : <ModelSettingsPanel />}
      </YStack>
    </YStack>
  );
}

export function SettingsView({ tab }: SettingsViewProps) {
  return (
    <Suspense fallback={<XStack height="100%" alignItems="center" justifyContent="center"><Paragraph color="$color11">Loading...</Paragraph></XStack>}>
      <SettingsViewInner tab={tab} />
    </Suspense>
  );
}
