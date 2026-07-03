"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hanzo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hanzo/ui";
import { Separator } from "@hanzo/ui";
import { ScrollArea } from "@hanzo/ui";
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Image,
  Table,
  Download,
  Copy,
  Eye,
  FileText,
  Save
} from "lucide-react";

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
import { Card } from "@hanzo/ui";
import { Button } from "@hanzo/ui";

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
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 my-4 italic">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="ml-6">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6">$1</li>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^---$/gim, '<hr class="my-6 border-t">');

    return `<div class="prose prose-sm max-w-none"><p class="mb-4">${html}</p></div>`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Toolbar */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Markdown Editor</h1>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("**", "**")}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("*", "*")}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("# ")}
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("## ")}
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("[", "](url)")}
                  title="Link"
                >
                  <Link className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("![alt text](", ")")}
                  title="Image"
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("- ")}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("1. ")}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("> ")}
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("```\n", "\n```")}
                  title="Code Block"
                >
                  <Code className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => insertMarkdown("| Column 1 | Column 2 |\n|----------|----------|\n| ", " | |")}
                  title="Table"
                >
                  <Table className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Edit Only</SelectItem>
                  <SelectItem value="split">Split View</SelectItem>
                  <SelectItem value="preview">Preview Only</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Editor Panel */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className={viewMode === "split" ? "w-1/2 border-r" : "w-full"}>
            <ScrollArea className="h-full">
              <Textarea
                id="markdown-input"
                value={markdown}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMarkdown(e.target.value)}
                className="min-h-full p-6 resize-none border-0 focus-visible:ring-0 font-mono text-sm"
                placeholder="Start writing in markdown..."
              />
            </ScrollArea>
          </div>
        )}

        {/* Preview Panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={viewMode === "split" ? "w-1/2" : "w-full"}>
            <ScrollArea className="h-full">
              <Card className="border-0 rounded-none">
                <CardContent className="p-6">
                  <div
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
                  />
                </CardContent>
              </Card>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{markdown.length} characters</span>
              <span>{markdown.split(/\s+/).filter(w => w).length} words</span>
              <span>{markdown.split("\n").length} lines</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3" />
              <span>Markdown</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}