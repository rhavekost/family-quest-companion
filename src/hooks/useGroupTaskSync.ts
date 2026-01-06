import { useEffect, useRef } from "react";
import { FamilyMemberWithData, HabiticaTask } from "@/types/habitica";
import { deleteTask } from "@/lib/habiticaApi";
import { useFamilyStore } from "@/store/familyStore";

/**
 * Syncs group tasks across family members.
 * Group tasks are identified by having the same `alias` value.
 * When one member completes a group task, it's deleted from other members.
 */
export function useGroupTaskSync(
  familyData: FamilyMemberWithData[],
  refetchAll: () => void
) {
  const { familyMembers } = useFamilyStore();
  const processedAliases = useRef<Set<string>>(new Set());

  useEffect(() => {
    const syncGroupTasks = async () => {
      // Build a map of alias -> tasks across all members
      const aliasTaskMap = new Map<string, { task: HabiticaTask; memberId: string }[]>();
      
      familyData.forEach((member) => {
        (member.tasks || []).forEach((task) => {
          // Only check todos for group sync (habits and dailies don't have group behavior)
          if (task.alias && task.type === 'todo') {
            const existing = aliasTaskMap.get(task.alias) || [];
            existing.push({ task, memberId: member.id });
            aliasTaskMap.set(task.alias, existing);
          }
        });
      });

      console.log(`[GroupSync] Found ${aliasTaskMap.size} group task sets`);

      // Find completed group tasks and delete from other members
      const deletePromises: Promise<void>[] = [];
      
      for (const [alias, taskGroup] of aliasTaskMap) {
        console.log(`[GroupSync] Checking alias "${alias}" with ${taskGroup.length} tasks`);
        
        // Skip if we already processed this alias in this session
        if (processedAliases.current.has(alias)) {
          console.log(`[GroupSync] Already processed alias "${alias}", skipping`);
          continue;
        }
        
        // Check if any task in the group is completed
        const completedTask = taskGroup.find((t) => t.task.completed);
        
        if (completedTask) {
          console.log(`[GroupSync] Found completed task in alias "${alias}"`);
          processedAliases.current.add(alias);
          
          // Delete from all other members who have uncompleted versions
          const tasksToDelete = taskGroup.filter(
            (t) => t.memberId !== completedTask.memberId && !t.task.completed
          );
          
          console.log(`[GroupSync] Will delete ${tasksToDelete.length} tasks from other members`);
          
          for (const { task, memberId } of tasksToDelete) {
            const member = familyMembers.find((m) => m.id === memberId);
            if (member) {
              console.log(`[GroupSync] Deleting task "${task.text}" from ${member.displayName}`);
              deletePromises.push(
                deleteTask(member.habiticaUserId, member.habiticaApiToken, task.id)
                  .catch((err) => console.error(`Failed to delete group task: ${err.message}`))
              );
            }
          }
        }
      }

      if (deletePromises.length > 0) {
        console.log(`[GroupSync] Executing ${deletePromises.length} delete operations`);
        await Promise.all(deletePromises);
        // Refetch to update the UI
        console.log(`[GroupSync] Refetching all data after deletions`);
        setTimeout(refetchAll, 500);
      } else {
        console.log(`[GroupSync] No tasks to delete`);
      }
    };

    // Only run if we have family data loaded
    if (familyData.some((m) => m.tasks && m.tasks.length > 0)) {
      syncGroupTasks();
    }
  }, [familyData, familyMembers, refetchAll]);

  // Reset processed aliases when component unmounts or family changes
  useEffect(() => {
    return () => {
      processedAliases.current.clear();
    };
  }, [familyMembers]);
}

/**
 * Generates a unique alias for a group task
 */
export function generateGroupAlias(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
