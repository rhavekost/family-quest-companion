import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FamilyMember, SharedTask } from "@/types/habitica";
import { Calendar, Users, Flag, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyMembers: FamilyMember[];
  onAddTask: (task: Omit<SharedTask, 'id' | 'createdAt' | 'completedBy'>) => void;
  editTask?: SharedTask | null;
  onUpdateTask?: (id: string, updates: Partial<SharedTask>) => void;
}

const PRIORITY_OPTIONS = [
  { value: "0.1", label: "Trivial", color: "text-muted-foreground" },
  { value: "1", label: "Easy", color: "text-task-good" },
  { value: "1.5", label: "Medium", color: "text-task-neutral" },
  { value: "2", label: "Hard", color: "text-task-bad" },
];

export function AddTaskDialog({
  open,
  onOpenChange,
  familyMembers,
  onAddTask,
  editTask,
  onUpdateTask,
}: AddTaskDialogProps) {
  const [text, setText] = useState(editTask?.text || "");
  const [notes, setNotes] = useState(editTask?.notes || "");
  const [type, setType] = useState<'habit' | 'daily' | 'todo'>(editTask?.type || "todo");
  const [priority, setPriority] = useState(String(editTask?.priority || "1"));
  const [dueDate, setDueDate] = useState(editTask?.date || "");
  const [assignedTo, setAssignedTo] = useState<string[]>(editTask?.assignedTo || []);

  const handleSubmit = () => {
    if (!text.trim() || assignedTo.length === 0) return;

    const taskData = {
      text: text.trim(),
      notes: notes.trim(),
      type,
      priority: parseFloat(priority),
      assignedTo,
      date: dueDate || undefined,
    };

    if (editTask && onUpdateTask) {
      onUpdateTask(editTask.id, taskData);
    } else {
      onAddTask(taskData);
    }

    // Reset form
    setText("");
    setNotes("");
    setType("todo");
    setPriority("1");
    setDueDate("");
    setAssignedTo([]);
    onOpenChange(false);
  };

  const toggleMember = (memberId: string) => {
    setAssignedTo((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    setAssignedTo(familyMembers.map((m) => m.id));
  };

  const selectNone = () => {
    setAssignedTo([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            {editTask ? "Edit Task" : "Add New Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label>Task Name</Label>
            <Input
              placeholder="What needs to be done?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-input"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-input resize-none"
              rows={2}
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To-Do</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="habit">Habit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Flag size={14} />
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={opt.color}>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date (for todos) */}
          {type === "todo" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar size={14} />
                Due Date (optional)
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-input"
              />
            </div>
          )}

          {/* Assign To */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Users size={14} />
                Assign To
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="h-6 text-xs"
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectNone}
                  className="h-6 text-xs"
                >
                  None
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {familyMembers.map((member) => (
                <motion.button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                    assignedTo.includes(member.id)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: member.color + "30",
                      color: member.color,
                    }}
                  >
                    {member.avatarEmoji || member.displayName[0]}
                  </div>
                  <span className="text-sm truncate">{member.displayName}</span>
                </motion.button>
              ))}
            </div>
            {assignedTo.length === 0 && (
              <p className="text-xs text-destructive">
                Select at least one family member
              </p>
            )}
          </div>

          {/* Shared task info */}
          {assignedTo.length > 1 && (
            <div className="bg-accent/20 border border-accent/30 rounded-lg p-3 text-sm">
              <span className="text-accent font-medium">Shared Task:</span>
              <span className="text-muted-foreground ml-1">
                When any assigned person completes this, it clears for everyone.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={!text.trim() || assignedTo.length === 0}
          >
            {editTask ? "Save Changes" : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
