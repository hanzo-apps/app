"use client";

import { YStack, XStack, H1, SizableText } from '@hanzo/gui';
import { useState } from "react";
import { Card, CardContent, Button, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, ScrollArea } from '@hanzo/ui';
import { Bold, Italic, Link, List, ListOrdered, Quote, Code, Heading1, Heading2, Image, Table, Download, Copy, FileText, Save } from "lucide-react";

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(`# Welcome to Hanzo Markdown Editor

Built with **@hanzo/ui components** for a seamless writing experience.

## Features

- 🚀 **Live Preview** - See your changes in real-time
- 🎨 **Syntax Highlighting** - Beautiful code blocks
- 📱 **Responsive Design** - Works on all devices
- 🌙 **Dark Mode Support** - Easy on the eyes

## Code Example

\`\`\`typescript

export function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Button>Click me!</Button>
      </CardContent>
    </Card>
  );
}
\`\`\`

## Lists

### Unordered List
- First item
- Second item
- Third item

### Ordered List
1. Step one
2. Step two
3. Step three

## Blockquote
> "The best way to predict the future is to invent it."
> - Alan Kay

## Table

| Feature | Status | Priority |
|---------|--------|----------|
| Live Preview | ✅ Complete | High |
| Export Options | ✅ Complete | Medium |
| Collaboration | 🚧 In Progress | Low |

---

Start writing your content above!
`);

  const [viewMode, setViewMode] = useState("split");

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.getElementById("markdown-input") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    const newText = before + selectedText + after;

    const newMarkdown =
      markdown.substring(0, start) +
      newText +
      markdown.substring(end);

    setMarkdown(newMarkdown);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown to HTML conversion (in production, use a proper markdown parser)
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>$2</code></pre>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-[#171717] pl-4 my-4 italic">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="ml-6">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6">$1</li>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[#171717] hover:underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^---$/gim, '<hr class="my-6 border-t">');

    return `<div class="prose prose-sm max-w-none"><p class="mb-4">${html}</p></div>`;
  };

  return (
    <YStack minHeight="100%" backgroundColor="$background">
      {/* Header Toolbar */}
      <YStack borderBottomWidth={1}>
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$3">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$4">
              <H1 fontSize="$7" fontWeight="500">Markdown Editor</H1>
              <Separator orientation="vertical" height="$5" />
              <XStack alignItems="center" gap="$1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("**", "**")}
                  title="Bold"
                >
                  <Bold size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("*", "*")}
                  title="Italic"
                >
                  <Italic size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("# ")}
                  title="Heading 1"
                >
                  <Heading1 size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("## ")}
                  title="Heading 2"
                >
                  <Heading2 size={16} />
                </Button>
                <Separator orientation="vertical" height="$5" marginHorizontal="$1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("[", "](url)")}
                  title="Link"
                >
                  <Link size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("![alt text](", ")")}
                  title="Image"
                >
                  <Image size={16} />
                </Button>
                <Separator orientation="vertical" height="$5" marginHorizontal="$1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("- ")}
                  title="Bullet List"
                >
                  <List size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("1. ")}
                  title="Numbered List"
                >
                  <ListOrdered size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("> ")}
                  title="Quote"
                >
                  <Quote size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("```\n", "\n```")}
                  title="Code Block"
                >
                  <Code size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("| Column 1 | Column 2 |\n|----------|----------|\n| ", " | |")}
                  title="Table"
                >
                  <Table size={16} />
                </Button>
              </XStack>
            </XStack>

            <XStack alignItems="center" gap="$2">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger width="$14">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Edit Only</SelectItem>
                  <SelectItem value="split">Split View</SelectItem>
                  <SelectItem value="preview">Preview Only</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Copy size={16} />
                Copy
              </Button>
              <Button variant="outline" size="sm">
                <Download size={16} />
                Export
              </Button>
              <Button size="sm">
                <Save size={16} />
                Save
              </Button>
            </XStack>
          </XStack>
        </YStack>
      </YStack>

      {/* Editor Area */}
      <XStack height="calc(100vh-4rem)">
        {/* Editor Panel */}
        {(viewMode === "edit" || viewMode === "split") && (
          <YStack {...{ width: viewMode === "split" ? "50%" : "100%", borderRightWidth: viewMode === "split" ? 1 : undefined }}>
            <ScrollArea height="100%">
              <Textarea
                id="markdown-input"
                value={markdown}
                onChangeText={(t) => setMarkdown(t)}
                minHeight="100%" padding="$5" borderWidth={0} fontFamily="$mono" fontSize="$3" className="resize-none"
                placeholder="Start writing in markdown..."
  />
            </ScrollArea>
          </YStack>
        )}

        {/* Preview Panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <YStack {...{ width: viewMode === "split" ? "50%" : "100%" }}>
            <ScrollArea height="100%">
              <Card borderWidth={0} borderRadius={0}>
                <CardContent padding="$5">
                  <div
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
  />
                </CardContent>
              </Card>
            </ScrollArea>
          </YStack>
        )}
      </XStack>

      {/* Status Bar */}
      <YStack borderTopWidth={1}>
        <YStack width="100%" maxWidth={1280} alignSelf="center" paddingHorizontal="$5" paddingVertical="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$4">
              <SizableText fontSize="$1" color="$color11">{markdown.length} characters</SizableText>
              <SizableText fontSize="$1" color="$color11">{markdown.split(/\s+/).filter(w => w).length} words</SizableText>
              <SizableText fontSize="$1" color="$color11">{markdown.split("\n").length} lines</SizableText>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <FileText size={12} />
              <SizableText fontSize="$1" color="$color11">Markdown</SizableText>
            </XStack>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  );
}