import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FamilyMember, HabiticaTask } from "@/types/habitica";
import { Loader2, Link2, Users } from "lucide-react";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: FamilyMember[];
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialData?: Partial<HabiticaTask> & { ownerId?: string };
  mode: "create" | "edit";
}

export interface TaskFormData {
  text: string;
  notes: string;
  type: "habit" | "daily" | "todo";
  priority: number;
  date?: string;
  assignees: string[]; // member IDs
  up?: boolean;
  down?: boolean;
  isGroupTask: boolean; // When true, completing one deletes from others
}

const PRIORITY_OPTIONS = [
  { value: 0.1, label: "Trivial" },
  { value: 1, label: "Easy" },
  { value: 1.5, label: "Medium" },
  { value: 2, label: "Hard" },
];

export function TaskFormDialog({
  open,
  onOpenChange,
  members,
  onSubmit,
  initialData,
  mode,
}: TaskFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    text: "",
    notes: "",
    type: "todo",
    priority: 1,
    date: "",
    assignees: [],
    up: true,
    down: true,
    isGroupTask: false,
  });

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        text: initialData.text || "",
        notes: initialData.notes || "",
        type: (initialData.type as "habit" | "daily" | "todo") || "todo",
        priority: initialData.priority || 1,
        date: initialData.date?.split("T")[0] || "",
        assignees: initialData.ownerId ? [initialData.ownerId] : [],
        up: initialData.up ?? true,
        down: initialData.down ?? true,
        isGroupTask: !!initialData.alias,
      });
    } else if (open && !initialData) {
      setFormData({
        text: "",
        notes: "",
        type: "todo",
        priority: 1,
        date: "",
        assignees: [],
        up: true,
        down: true,
        isGroupTask: false,
      });
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim() || formData.assignees.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter((id) => id !== memberId)
        : [...prev.assignees, memberId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "create" ? "Create Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Task Name</Label>
            <Input
              id="text"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Enter task name..."
              className="bg-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes..."
              className="bg-input resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                disabled={mode === "edit"}
              >
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
              <Label>Priority</Label>
              <Select
                value={String(formData.priority)}
                onValueChange={(v) => setFormData({ ...formData, priority: parseFloat(v) })}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.type === "todo" && (
            <div className="space-y-2">
              <Label htmlFor="date">Due Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-input"
              />
            </div>
          )}

          {formData.type === "habit" && (
            <div className="space-y-2">
              <Label>Habit Directions</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.up}
                    onCheckedChange={(checked) => setFormData({ ...formData, up: !!checked })}
                  />
                  <span className="text-sm">Positive (+)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.down}
                    onCheckedChange={(checked) => setFormData({ ...formData, down: !!checked })}
                  />
                  <span className="text-sm">Negative (-)</span>
                </label>
              </div>
            </div>
          )}

          {/* Group Task Toggle - only show when multiple assignees */}
          {mode === "create" && formData.assignees.length > 1 && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30 border-border">
              <div className="flex items-center gap-3">
                <Link2 size={18} className="text-primary" />
                <div>
                  <Label className="text-sm font-medium">Group Task</Label>
                  <p className="text-xs text-muted-foreground">
                    When one person completes it, remove from others
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.isGroupTask}
                onCheckedChange={(checked) => setFormData({ ...formData, isGroupTask: checked })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>
              {mode === "create" ? "Assign to" : "Owner"} 
              {mode === "create" && formData.assignees.length > 1 && !formData.isGroupTask && (
                <span className="text-muted-foreground ml-2 text-xs">
                  <Users size={12} className="inline mr-1" />
                  Multi-create: separate independent tasks
                </span>
              )}
              {mode === "create" && formData.assignees.length > 1 && formData.isGroupTask && (
                <span className="text-primary ml-2 text-xs">
                  <Link2 size={12} className="inline mr-1" />
                  Group task: linked across members
                </span>
              )}
            </Label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <label
                  key={member.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    formData.assignees.includes(member.id)
                      ? "bg-primary/20 border-primary"
                      : "bg-input border-border hover:border-primary/50"
                  } ${mode === "edit" ? "pointer-events-none opacity-60" : ""}`}
                >
                  <Checkbox
                    checked={formData.assignees.includes(member.id)}
                    onCheckedChange={() => toggleAssignee(member.id)}
                    disabled={mode === "edit"}
                  />
                  <span
                    className="text-lg"
                    style={{ color: member.color }}
                  >
                    {member.avatarEmoji || member.displayName[0]}
                  </span>
                  <span className="text-sm">{member.displayName}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.text.trim() || formData.assignees.length === 0}
            >
              {isSubmitting && <Loader2 className="mr-2 animate-spin" size={16} />}
              {mode === "create" 
                ? formData.assignees.length > 1 
                  ? `Create ${formData.assignees.length} Tasks` 
                  : "Create Task"
                : "Save Changes"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
