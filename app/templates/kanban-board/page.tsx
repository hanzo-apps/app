"use client";

import { YStack, XStack, H1, Paragraph, SizableText } from '@hanzo/gui';
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  assignee: string;
  dueDate: string;
  comments: number;
  attachments: number;
  labels: string[];
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, ScrollArea, Avatar, AvatarFallback, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from '@hanzo/ui';
import { Plus, MoreHorizontal, Calendar, User, MessageSquare, Paperclip } from "lucide-react";

const columns = [
  {
    id: "todo",
    title: "To Do",
    color: "#64748b",
    tasks: [
      {
        id: "1",
        title: "Implement user authentication",
        description: "Add login/logout functionality using @hanzo/ui forms",
        priority: "high",
        assignee: "Sarah Chen",
        dueDate: "Dec 15",
        comments: 3,
        attachments: 2,
        labels: ["feature", "auth"]
      },
      {
        id: "2",
        title: "Design dashboard layout",
        description: "Create responsive dashboard using @hanzo/ui components",
        priority: "medium",
        assignee: "Alex Rivera",
        dueDate: "Dec 18",
        comments: 5,
        attachments: 1,
        labels: ["design", "ui"]
      }
    ]
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "#f59e0b",
    tasks: [
      {
        id: "3",
        title: "API integration",
        description: "Connect frontend to backend services",
        priority: "high",
        assignee: "Jordan Park",
        dueDate: "Dec 14",
        comments: 8,
        attachments: 3,
        labels: ["backend", "api"]
      },
      {
        id: "4",
        title: "Write documentation",
        description: "Document component usage and API endpoints",
        priority: "low",
        assignee: "Sarah Chen",
        dueDate: "Dec 20",
        comments: 2,
        attachments: 0,
        labels: ["docs"]
      }
    ]
  },
  {
    id: "review",
    title: "In Review",
    color: "#0ea5e9",
    tasks: [
      {
        id: "5",
        title: "Performance optimization",
        description: "Optimize bundle size and loading speed",
        priority: "medium",
        assignee: "Alex Rivera",
        dueDate: "Dec 13",
        comments: 12,
        attachments: 4,
        labels: ["performance", "optimization"]
      }
    ]
  },
  {
    id: "done",
    title: "Done",
    color: "#10b981",
    tasks: [
      {
        id: "6",
        title: "Setup project structure",
        description: "Initialize repository with @hanzo/ui",
        priority: "high",
        assignee: "Jordan Park",
        dueDate: "Dec 10",
        comments: 6,
        attachments: 2,
        labels: ["setup"]
      },
      {
        id: "7",
        title: "Configure CI/CD pipeline",
        description: "Setup automated testing and deployment",
        priority: "high",
        assignee: "Sarah Chen",
        dueDate: "Dec 11",
        comments: 4,
        attachments: 1,
        labels: ["devops", "ci/cd"]
      }
    ]
  }
];

const priorityColors = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e"
};

const labelColors = {
  feature: "bg-[#171717]/10 text-[#171717]",
  auth: "bg-sky-100 text-sky-800",
  design: "bg-pink-100 text-pink-800",
  ui: "bg-[#171717]/10 text-[#171717]",
  backend: "bg-amber-100 text-amber-800",
  api: "bg-teal-100 text-teal-800",
  docs: "bg-slate-100 text-slate-800",
  performance: "bg-rose-100 text-rose-800",
  optimization: "bg-yellow-100 text-yellow-800",
  setup: "bg-emerald-100 text-emerald-800",
  devops: "bg-[#404040]/10 text-[#404040]",
  "ci/cd": "bg-cyan-100 text-cyan-800"
};

export default function KanbanBoard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColumn, setNewTaskColumn] = useState("todo");

  return (
    <YStack minHeight="100%" backgroundColor="$background" padding="$5">
      {/* Header */}
      <YStack marginBottom="$5">
        <XStack alignItems="center" justifyContent="space-between">
          <div>
            <H1 fontSize="$10" fontWeight="500">Project Board</H1>
            <Paragraph color="$color11">Built with @hanzo/ui components</Paragraph>
          </div>
          <XStack alignItems="center" gap="$2">
            <Button variant="outline">
              <User size={16} />
              Team
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button backgroundColor="#171717" hoverStyle={{ backgroundColor: "#000000" }}>
                  <Plus size={16} />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your kanban board
                  </DialogDescription>
                </DialogHeader>
                <YStack rowGap="$4" paddingTop="$4">
                  <div>
                    <Label fontSize="$3" fontWeight="500">Title</Label>
                    <Input
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
  />
                  </div>
                  <div>
                    <Label fontSize="$3" fontWeight="500">Column</Label>
                    <Select value={newTaskColumn} onValueChange={setNewTaskColumn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label fontSize="$3" fontWeight="500">Description</Label>
                    <Textarea placeholder="Task description (optional)" />
                  </div>
                  <Button width="100%" backgroundColor="#171717" hoverStyle={{ backgroundColor: "#000000" }}>Create Task</Button>
                </YStack>
              </DialogContent>
            </Dialog>
          </XStack>
        </XStack>
      </YStack>

      {/* Board */}
      <XStack gap="$4" paddingBottom="$4" overflow="scroll">
        {columns.map(column => (
          <YStack key={column.id} minWidth={320}>
            <Card marginBottom="$4">
              <CardHeader paddingBottom="$3">
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" gap="$2">
                    <YStack width="$3" height="$3" borderRadius="$10" {...{ backgroundColor: column.color }} />
                    <CardTitle fontSize="$4">{column.title}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {column.tasks.length}
                    </Badge>
                  </XStack>
                  <Button variant="ghost" size="icon">
                    <Plus size={16} />
                  </Button>
                </XStack>
              </CardHeader>
            </Card>

            <ScrollArea height="calc(100vh-240px)">
              <YStack rowGap="$3">
                {column.tasks.map(task => (
                  <Card
                    key={task.id}
                    cursor="pointer" hoverStyle={{ elevation: 3 }}
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardHeader paddingBottom="$3">
                      <XStack alignItems="flex-start" justifyContent="space-between">
                        <CardTitle fontSize="$3" fontWeight="500">
                          {task.title}
                        </CardTitle>
                        <Button variant="ghost" size="icon" marginRight="-2" marginTop="-1">
                          <MoreHorizontal size={12} />
                        </Button>
                      </XStack>
                      <CardDescription fontSize="$1" numberOfLines={2}>
                        {task.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent paddingBottom="$3">
                      {/* Labels */}
                      <XStack flexWrap="wrap" gap="$1" marginBottom="$3">
                        {task.labels.map(label => (
                          <Badge
                            key={label}
                            variant="secondary"
                            className={`text-xs px-2 py-0 ${labelColors[label as keyof typeof labelColors] || ""}`}
                          >
                            {label}
                          </Badge>
                        ))}
                      </XStack>

                      {/* Priority indicator */}
                      <XStack alignItems="center" gap="$2" marginBottom="$3">
                        <YStack width="$2" height="$2" borderRadius="$10" {...{ backgroundColor: priorityColors[task.priority as keyof typeof priorityColors] }} />
                        <SizableText fontSize="$1" color="$color11">
                          {task.priority} priority
                        </SizableText>
                      </XStack>

                      {/* Meta info */}
                      <SizableText alignItems="center" justifyContent="space-between" fontSize="$1" color="$color11" display="flex" flexDirection="row">
                        <XStack alignItems="center" gap="$3">
                          {task.dueDate && (
                            <XStack alignItems="center" gap="$1">
                              <Calendar size={12} />
                              {task.dueDate}
                            </XStack>
                          )}
                          {task.comments > 0 && (
                            <XStack alignItems="center" gap="$1">
                              <MessageSquare size={12} />
                              {task.comments}
                            </XStack>
                          )}
                          {task.attachments > 0 && (
                            <XStack alignItems="center" gap="$1">
                              <Paperclip size={12} />
                              {task.attachments}
                            </XStack>
                          )}
                        </XStack>
                        <Avatar height="$5" width="$5">
                          <AvatarFallback>
                            <SizableText fontSize="$1">{task.assignee.split(" ").map(n => n[0]).join("")}</SizableText>
                          </AvatarFallback>
                        </Avatar>
                      </SizableText>
                    </CardContent>
                  </Card>
                ))}
              </YStack>
            </ScrollArea>
          </YStack>
        ))}
      </XStack>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent maxWidth={672}>
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
              <DialogDescription>{selectedTask.description}</DialogDescription>
            </DialogHeader>
            <YStack rowGap="$4" paddingTop="$4">
              <XStack alignItems="center" gap="$4">
                <XStack alignItems="center" gap="$2">
                  <User size={16} color="$color11" />
                  <SizableText fontSize="$3">{selectedTask.assignee}</SizableText>
                </XStack>
                <XStack alignItems="center" gap="$2">
                  <Calendar size={16} color="$color11" />
                  <SizableText fontSize="$3">Due {selectedTask.dueDate}</SizableText>
                </XStack>
                <Badge {...{ backgroundColor: priorityColors[selectedTask.priority as keyof typeof priorityColors], color: "white" }}>
                  {selectedTask.priority}
                </Badge>
              </XStack>
              <XStack gap="$1">
                {selectedTask.labels.map(label => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </XStack>
            </YStack>
          </DialogContent>
        </Dialog>
      )}
    </YStack>
  );
}