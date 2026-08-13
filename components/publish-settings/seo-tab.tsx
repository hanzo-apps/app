'use client';

import { sends } from '@hanzo/ui/chat';
import { YStack, H3, Paragraph, H4, SizableText, XStack, Image } from '@hanzo/ui';
import { useState } from 'react';
import { PublishSettings, SeoConfig } from '@/lib/vfs/types';
import { Label, Input, Textarea, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@hanzo/ui';
import { Search, X } from 'lucide-react';

interface SeoTabProps {
  settings: PublishSettings;
  onChange: (settings: PublishSettings) => void;
}

export function SeoTab({ settings, onChange }: SeoTabProps) {
  const [keywords, setKeywords] = useState('');

  const handleSeoChange = (field: keyof SeoConfig, value: any) => {
    onChange({
      ...settings,
      seo: {
        ...settings.seo,
        [field]: value,
      },
    });
  };

  const handleAddKeyword = () => {
    if (!keywords.trim()) return;

    const currentKeywords = settings.seo.keywords || [];
    const newKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k && !currentKeywords.includes(k));

    if (newKeywords.length > 0) {
      handleSeoChange('keywords', [...currentKeywords, ...newKeywords]);
      setKeywords('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    const currentKeywords = settings.seo.keywords || [];
    handleSeoChange(
      'keywords',
      currentKeywords.filter((k) => k !== keyword)
    );
  };

  return (
    <YStack rowGap="$5">
      <div>
        <H3 fontSize="$6" fontWeight="500">SEO Configuration</H3>
        <Paragraph fontSize="$3" color="$color11">
          Optimize your deployment for search engines and social sharing
        </Paragraph>
      </div>

      {/* Basic Meta Tags */}
      <YStack rowGap="$4">
        <div>
          <H4 fontWeight="500" marginBottom="$4">Basic Meta Tags</H4>
        </div>

        <YStack rowGap="$2">
          <Label htmlFor="seo-title">Meta Title</Label>
          <Input
            id="seo-title"
            placeholder="Your Deployment Title"
            value={settings.seo.title || ''}
            onChange={(e) => handleSeoChange('title', e.target.value || undefined)}
  />
          <Paragraph fontSize="$1" color="$color11">
            Recommended: 50-60 characters
            {settings.seo.title && (
              <SizableText marginLeft="$2">
                ({settings.seo.title.length} characters)
              </SizableText>
            )}
          </Paragraph>
        </YStack>

        <YStack rowGap="$2">
          <Label htmlFor="seo-description">Meta Description</Label>
          <Textarea
            id="seo-description"
            placeholder="A brief description of your deployment"
            rows={3}
            value={settings.seo.description || ''}
            onChange={(e) =>
              handleSeoChange('description', e.target.value || undefined)
            }
  />
          <Paragraph fontSize="$1" color="$color11">
            Recommended: 150-160 characters
            {settings.seo.description && (
              <SizableText marginLeft="$2">
                ({settings.seo.description.length} characters)
              </SizableText>
            )}
          </Paragraph>
        </YStack>

        <YStack rowGap="$2">
          <Label htmlFor="seo-keywords">Keywords</Label>
          <XStack gap="$2">
            <Input
              id="seo-keywords"
              placeholder="Enter keywords (comma-separated)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyPress={(e) => {
                if (sends(e.key, e.nativeEvent)) {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
  />
            <Button type="button" onClick={handleAddKeyword} variant="outline">
              Add
            </Button>
          </XStack>
          {settings.seo.keywords && settings.seo.keywords.length > 0 && (
            <XStack flexWrap="wrap" gap="$2" marginTop="$2">
              {settings.seo.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                  <Button
                    onClick={() => handleRemoveKeyword(keyword)}
                    variant="ghost"
                    group
                    marginLeft="$1"
                  >
                    <SizableText $group-hover={{ color: "$red9" }}>
                      <X size={12} />
                    </SizableText>
                  </Button>
                </Badge>
              ))}
            </XStack>
          )}
        </YStack>

        <YStack rowGap="$2">
          <Label htmlFor="seo-canonical">Canonical URL</Label>
          <Input
            id="seo-canonical"
            type="url"
            placeholder="https://example.com/page"
            value={settings.seo.canonical || ''}
            onChange={(e) =>
              handleSeoChange('canonical', e.target.value || undefined)
            }
  />
          <Paragraph fontSize="$1" color="$color11">
            Prevent duplicate content issues by specifying the primary URL
          </Paragraph>
        </YStack>
      </YStack>

      {/* Open Graph */}
      <YStack rowGap="$4">
        <div>
          <H4 fontWeight="500" marginBottom="$4">Open Graph (Facebook, LinkedIn)</H4>
        </div>

        <YStack rowGap="$2">
          <Label htmlFor="og-title">OG Title</Label>
          <Input
            id="og-title"
            placeholder="Title for social media sharing"
            value={settings.seo.ogTitle || ''}
            onChange={(e) => handleSeoChange('ogTitle', e.target.value || undefined)}
  />
        </YStack>

        <YStack rowGap="$2">
          <Label htmlFor="og-description">OG Description</Label>
          <Textarea
            id="og-description"
            placeholder="Description for social media sharing"
            rows={2}
            value={settings.seo.ogDescription || ''}
            onChange={(e) =>
              handleSeoChange('ogDescription', e.target.value || undefined)
            }
  />
        </YStack>

        <YStack rowGap="$2">
          <Label htmlFor="og-image">OG Image URL</Label>
          <Input
            id="og-image"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={settings.seo.ogImage || ''}
            onChange={(e) => handleSeoChange('ogImage', e.target.value || undefined)}
  />
          <Paragraph fontSize="$1" color="$color11">
            Recommended: 1200x630px for best results
          </Paragraph>
        </YStack>

        {settings.seo.ogImage && (
          <YStack padding="$4" borderWidth={1} borderRadius="$5">
            <Paragraph fontSize="$3" fontWeight="500" marginBottom="$2">Image Preview</Paragraph>
            {/* OG images are 1200×630 — the preview frames at that ratio so the
                crop shown is the crop social cards will make. */}
            <XStack position="relative" aspectRatio={1200 / 630} backgroundColor="$color3" borderRadius="$2" alignItems="center" justifyContent="center" overflow="hidden">
              <Image
                src={settings.seo.ogImage}
                alt="OG Image preview"
                objectFit="cover" width="100%" height="100%"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<div class="flex items-center gap-2 text-muted-foreground"><svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>Unable to load image</span></div>';
                }}
  />
            </XStack>
          </YStack>
        )}
      </YStack>

      {/* Twitter Card */}
      <YStack rowGap="$4">
        <div>
          <H4 fontWeight="500" marginBottom="$4">Twitter Card</H4>
        </div>

        <YStack rowGap="$2">
          <Label htmlFor="twitter-card">Card Type</Label>
          <Select
            value={settings.seo.twitterCard || 'summary'}
            onValueChange={(value: 'summary' | 'summary_large_image') =>
              handleSeoChange('twitterCard', value)
            }
          >
            <SelectTrigger id="twitter-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary</SelectItem>
              <SelectItem value="summary_large_image">
                Summary Large Image
              </SelectItem>
            </SelectContent>
          </Select>
          <Paragraph fontSize="$1" color="$color11">
            How your deployment appears when shared on Twitter/X
          </Paragraph>
        </YStack>
      </YStack>

      {/* Preview */}
      <YStack rowGap="$4">
        <div>
          <H4 fontWeight="500" marginBottom="$4">Search Result Preview</H4>
        </div>

        <YStack padding="$4" borderWidth={1} borderRadius="$5" backgroundColor="$color3">
          <XStack gap="$2" marginBottom="$2">
            <Search size={20} />
            <YStack flex={1}>
              <YStack marginBottom="$1"><SizableText fontSize="$3" color="$blue10">https://your-domain.com</SizableText></YStack>
              <H3 fontSize="$6" color="$blue11" fontWeight="500" marginBottom="$1" $theme-dark={{ color: "$blue8" }}>
                {settings.seo.title || settings.seo.ogTitle || 'Your Deployment Title'}
              </H3>
              <Paragraph fontSize="$3" color="$color11">
                {settings.seo.description ||
                  settings.seo.ogDescription ||
                  'Your deployment description will appear here in search results.'}
              </Paragraph>
            </YStack>
          </XStack>
        </YStack>
      </YStack>

      {/* Social Share Preview */}
      {(settings.seo.ogTitle || settings.seo.ogImage) && (
        <YStack rowGap="$4">
          <div>
            <H4 fontWeight="500" marginBottom="$4">Social Share Preview</H4>
          </div>

          <YStack padding="$4" borderWidth={1} borderRadius="$5" backgroundColor="$color3">
            <YStack rowGap="$2">
              {settings.seo.ogImage && (
                <YStack aspectRatio={1200 / 630} backgroundColor="$color3" borderRadius="$2" overflow="hidden">
                  <Image
                    src={settings.seo.ogImage}
                    alt="Social preview"
                    objectFit="cover" width="100%" height="100%"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
  />
                </YStack>
              )}
              <YStack rowGap="$1">
                <YStack><SizableText fontSize="$1" color="$color11">your-domain.com</SizableText></YStack>
                <H4 fontWeight="500">
                  {settings.seo.ogTitle || settings.seo.title || 'Your Deployment Title'}
                </H4>
                <Paragraph fontSize="$3" color="$color11">
                  {settings.seo.ogDescription ||
                    settings.seo.description ||
                    'Your deployment description'}
                </Paragraph>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}
