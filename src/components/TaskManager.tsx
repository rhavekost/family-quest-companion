import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { useFamilyStore } from "@/store/familyStore";
import { useSharedTaskStore } from "@/store/sharedTaskStore";
import { useFamilyData } from "@/hooks/useHabiticaData";
import { FamilyMember, HabiticaTask, SharedTask } from "@/types/habitica";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  X,
  Calendar,
  Users,
  Flame,
  Target,
  RotateCcw,
  ChevronLeft,
  Flag,
  CheckCircle,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, isToday, parseISO } from "date-fns";

interface TaskManagerProps {
  onBack: () => void;
}

type TaskFilter = "all" | "todo" | "daily" | "habit" | "shared";
type StatusFilter = "all" | "pending" | "completed";
type SortField = "text" | "type" | "priority" | "date" | "assignee";
type SortDirection = "asc" | "desc";

interface UnifiedTask {
  id: string;
  text: string;
  notes: string;
  type: "habit" | "daily" | "todo";
  priority: number;
  completed: boolean;
  date?: string;
  assignedTo: string[];
  isShared: boolean;
  source: "habitica" | "local";
  ownerId?: string;
  streak?: number;
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  0.1: { label: "Trivial", color: "bg-muted text-muted-foreground" },
  1: { label: "Easy", color: "bg-task-good/20 text-task-good" },
  1.5: { label: "Medium", color: "bg-task-neutral/20 text-task-neutral" },
  2: { label: "Hard", color: "bg-task-bad/20 text-task-bad" },
};

export function TaskManager({ onBack }: TaskManagerProps) {
  const { familyMembers, isDemoMode } = useFamilyStore();
  const { sharedTasks, addSharedTask, updateSharedTask, deleteSharedTask, completeSharedTask, uncompleteSharedTask } = useSharedTaskStore();
  const { familyData } = useFamilyData(familyMembers);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TaskFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("text");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<SharedTask | null>(null);

  // Combine all tasks from all family members + shared tasks
  const unifiedTasks = useMemo(() => {
    const tasks: UnifiedTask[] = [];

    // Add Habitica tasks from each family member
    familyData.forEach((member) => {
      (member.tasks || [])
        .filter((t) => t.type !== "reward")
        .forEach((task) => {
          tasks.push({
            id: `${member.id}-${task.id}`,
            text: task.text,
            notes: task.notes,
            type: task.type as "habit" | "daily" | "todo",
            priority: task.priority,
            completed: task.completed || false,
            date: task.date,
            assignedTo: [member.id],
            isShared: false,
            source: "habitica",
            ownerId: member.id,
            streak: task.streak,
          });
        });
    });

    // Add shared/local tasks
    sharedTasks.forEach((task) => {
      const isCompleted = (task.completedBy || []).length >= task.assignedTo.length;
      tasks.push({
        id: task.id,
        text: task.text,
        notes: task.notes,
        type: task.type,
        priority: task.priority,
        completed: isCompleted,
        date: task.date,
        assignedTo: task.assignedTo,
        isShared: task.assignedTo.length > 1,
        source: "local",
      });
    });

    return tasks;
  }, [familyData, sharedTasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...unifiedTasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.text.toLowerCase().includes(query) ||
          t.notes.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "shared") {
        filtered = filtered.filter((t) => t.isShared);
      } else {
        filtered = filtered.filter((t) => t.type === typeFilter);
      }
    }

    // Status filter
    if (statusFilter === "pending") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (statusFilter === "completed") {
      filtered = filtered.filter((t) => t.completed);
    }

    // Member filter
    if (memberFilter !== "all") {
      filtered = filtered.filter((t) => t.assignedTo.includes(memberFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "text":
          comparison = a.text.localeCompare(b.text);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "priority":
          comparison = a.priority - b.priority;
          break;
        case "date":
          if (!a.date && !b.date) comparison = 0;
          else if (!a.date) comparison = 1;
          else if (!b.date) comparison = -1;
          else comparison = a.date.localeCompare(b.date);
          break;
        case "assignee":
          comparison = a.assignedTo.length - b.assignedTo.length;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [unifiedTasks, searchQuery, typeFilter, statusFilter, memberFilter, sortField, sortDirection]);

  const getMemberById = (id: string) => familyMembers.find((m) => m.id === id);

  const handleToggleComplete = (task: UnifiedTask) => {
    if (task.source === "local") {
      const sharedTask = sharedTasks.find((t) => t.id === task.id);
      if (sharedTask) {
        if (task.completed) {
          uncompleteSharedTask(task.id, task.assignedTo[0]);
        } else {
          completeSharedTask(task.id, task.assignedTo[0]);
        }
        toast({
          title: task.completed ? "Task reopened" : "Task completed!",
          description: task.isShared
            ? "Cleared for all assigned family members"
            : undefined,
        });
      }
    } else {
      toast({
        title: "Habitica sync required",
        description: "This task is from Habitica. Complete it in the member detail view.",
      });
    }
  };

  const handleEditTask = (task: UnifiedTask) => {
    if (task.source === "local") {
      const sharedTask = sharedTasks.find((t) => t.id === task.id);
      if (sharedTask) {
        setEditingTask(sharedTask);
        setShowAddDialog(true);
      }
    } else {
      toast({
        title: "Cannot edit Habitica task",
        description: "This task is synced from Habitica. Edit it there.",
      });
    }
  };

  const handleDeleteTask = (task: UnifiedTask) => {
    if (task.source === "local") {
      deleteSharedTask(task.id);
      toast({ title: "Task deleted" });
    } else {
      toast({
        title: "Cannot delete Habitica task",
        description: "This task is synced from Habitica. Delete it there.",
      });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "habit":
        return <Flame size={14} className="text-task-bad" />;
      case "daily":
        return <Calendar size={14} className="text-mana" />;
      case "todo":
        return <Target size={14} className="text-task-good" />;
      default:
        return null;
    }
  };

  const getDueDateBadge = (date?: string) => {
    if (!date) return null;
    const dueDate = parseISO(date);
    const today = new Date();

    if (isBefore(dueDate, today) && !isToday(dueDate)) {
      return (
        <Badge variant="destructive" className="text-xs">
          Overdue
        </Badge>
      );
    }
    if (isToday(dueDate)) {
      return (
        <Badge className="bg-task-bad/20 text-task-bad text-xs">Today</Badge>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        {format(dueDate, "MMM d")}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient-gold">
              Task Manager
            </h1>
            <p className="text-muted-foreground text-sm">
              {filteredTasks.length} tasks • Airtable-style view
            </p>
          </div>
        </div>

        <Button variant="hero" onClick={() => setShowAddDialog(true)}>
          <Plus size={18} className="mr-2" />
          Add Task
        </Button>
      </motion.header>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-input"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(v: TaskFilter) => setTypeFilter(v)}>
          <SelectTrigger className="w-[130px] bg-input">
            <Filter size={14} className="mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="todo">To-Dos</SelectItem>
            <SelectItem value="daily">Dailies</SelectItem>
            <SelectItem value="habit">Habits</SelectItem>
            <SelectItem value="shared">Shared Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
          <SelectTrigger className="w-[130px] bg-input">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Member Filter */}
        <Select value={memberFilter} onValueChange={setMemberFilter}>
          <SelectTrigger className="w-[150px] bg-input">
            <Users size={14} className="mr-2" />
            <SelectValue placeholder="Member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {familyMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center gap-2">
                  <span style={{ color: member.color }}>{member.avatarEmoji}</span>
                  {member.displayName}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("text")}
                  >
                    <div className="flex items-center gap-1">
                      Task
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[100px] cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("type")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[100px] cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("priority")}
                  >
                    <div className="flex items-center gap-1">
                      Priority
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[120px] cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Due
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px]">Assigned To</TableHead>
                  <TableHead className="w-[80px]">Source</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredTasks.map((task, index) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "border-border hover:bg-secondary/50 transition-colors",
                        task.completed && "opacity-60"
                      )}
                    >
                      {/* Checkbox */}
                      <TableCell>
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                            task.completed
                              ? "bg-healer border-healer text-white"
                              : "border-muted-foreground hover:border-healer"
                          )}
                        >
                          {task.completed && <Check size={12} />}
                        </button>
                      </TableCell>

                      {/* Task Name */}
                      <TableCell>
                        <div>
                          <p
                            className={cn(
                              "font-medium",
                              task.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {task.text}
                          </p>
                          {task.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {task.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getTypeIcon(task.type)}
                          <span className="text-sm capitalize">{task.type}</span>
                        </div>
                      </TableCell>

                      {/* Priority */}
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-xs",
                            PRIORITY_LABELS[task.priority]?.color || "bg-muted"
                          )}
                        >
                          {PRIORITY_LABELS[task.priority]?.label || "Medium"}
                        </Badge>
                      </TableCell>

                      {/* Due Date */}
                      <TableCell>{getDueDateBadge(task.date)}</TableCell>

                      {/* Assigned To */}
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {task.assignedTo.slice(0, 3).map((memberId) => {
                            const member = getMemberById(memberId);
                            if (!member) return null;
                            return (
                              <div
                                key={memberId}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                style={{
                                  backgroundColor: member.color + "30",
                                  color: member.color,
                                }}
                                title={member.displayName}
                              >
                                {member.avatarEmoji || member.displayName[0]}
                              </div>
                            );
                          })}
                          {task.assignedTo.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{task.assignedTo.length - 3}
                            </span>
                          )}
                          {task.isShared && (
                            <Badge variant="outline" className="text-xs ml-1">
                              <Users size={10} className="mr-1" />
                              Shared
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Source */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            task.source === "local"
                              ? "border-accent text-accent"
                              : "border-primary text-primary"
                          )}
                        >
                          {task.source === "local" ? "Local" : "Habitica"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              <Edit size={14} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task)}
                              className="text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>

                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <p className="text-muted-foreground">No tasks found</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowAddDialog(true)}
                      >
                        <Plus size={16} className="mr-2" />
                        Add your first task
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Add/Edit Dialog */}
      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingTask(null);
        }}
        familyMembers={familyMembers}
        onAddTask={addSharedTask}
        editTask={editingTask}
        onUpdateTask={updateSharedTask}
      />
    </div>
  );
}
