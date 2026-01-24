"use client";

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hanzo/ui";
import { Button } from "@hanzo/ui";
import { Badge } from "@hanzo/ui";
import { ScrollArea } from "@hanzo/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@hanzo/ui";
import { Input } from "@hanzo/ui";
import { Textarea } from "@hanzo/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hanzo/ui";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Paperclip,
  Clock,
  AlertCircle
} from "lucide-react";

const columns = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-slate-500",
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
    color: "bg-amber-500",
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
    color: "bg-sky-500",
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
    color: "bg-emerald-500",
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
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500"
};

const labelColors = {
  feature: "bg-[#fd4444]/10 text-[#fd4444]",
  auth: "bg-sky-100 text-sky-800",
  design: "bg-pink-100 text-pink-800",
  ui: "bg-[#fd4444]/10 text-[#fd4444]",
  backend: "bg-amber-100 text-amber-800",
  api: "bg-teal-100 text-teal-800",
  docs: "bg-slate-100 text-slate-800",
  performance: "bg-rose-100 text-rose-800",
  optimization: "bg-yellow-100 text-yellow-800",
  setup: "bg-emerald-100 text-emerald-800",
  devops: "bg-[#ff6b6b]/10 text-[#ff6b6b]",
  "ci/cd": "bg-cyan-100 text-cyan-800"
};

export default function KanbanBoard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColumn, setNewTaskColumn] = useState("todo");

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Board</h1>
            <p className="text-muted-foreground">Built with @hanzo/ui components</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <User className="w-4 h-4 mr-2" />
              Team
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#fd4444] hover:bg-[#e03e3e]">
                  <Plus className="w-4 h-4 mr-2" />
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
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Column</label>
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
                    <label className="text-sm font-medium">Description</label>
                    <Textarea placeholder="Task description (optional)" />
                  </div>
                  <Button className="w-full bg-[#fd4444] hover:bg-[#e03e3e]">Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div key={column.id} className="min-w-[320px]">
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <CardTitle className="text-base">{column.title}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-3">
                {column.tasks.map(task => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">
                          {task.title}
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {task.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-3">
                      {/* Labels */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.labels.map(label => (
                          <Badge
                            key={label}
                            variant="secondary"
                            className={`text-xs px-2 py-0 ${labelColors[label as keyof typeof labelColors] || ""}`}
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>

                      {/* Priority indicator */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
                        <span className="text-xs text-muted-foreground">
                          {task.priority} priority
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.dueDate}
                            </div>
                          )}
                          {task.comments > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments}
                            </div>
                          )}
                          {task.attachments > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {task.attachments}
                            </div>
                          )}
                        </div>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {task.assignee.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
              <DialogDescription>{selectedTask.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selectedTask.assignee}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Due {selectedTask.dueDate}</span>
                </div>
                <Badge className={priorityColors[selectedTask.priority as keyof typeof priorityColors]}>
                  {selectedTask.priority}
                </Badge>
              </div>
              <div className="flex gap-1">
                {selectedTask.labels.map(label => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}