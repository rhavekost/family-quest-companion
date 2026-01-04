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
          if (task.alias) {
            const existing = aliasTaskMap.get(task.alias) || [];
            existing.push({ task, memberId: member.id });
            aliasTaskMap.set(task.alias, existing);
          }
        });
      });

      // Find completed group tasks and delete from other members
      const deletePromises: Promise<void>[] = [];
      
      for (const [alias, taskGroup] of aliasTaskMap) {
        // Skip if we already processed this alias in this session
        if (processedAliases.current.has(alias)) continue;
        
        // Check if any task in the group is completed
        const completedTask = taskGroup.find((t) => t.task.completed);
        
        if (completedTask) {
          processedAliases.current.add(alias);
          
          // Delete from all other members who have uncompleted versions
          const tasksToDelete = taskGroup.filter(
            (t) => t.memberId !== completedTask.memberId && !t.task.completed
          );
          
          for (const { task, memberId } of tasksToDelete) {
            const member = familyMembers.find((m) => m.id === memberId);
            if (member) {
              console.log(`[GroupSync] Deleting task "${task.text}" from ${member.displayName} (completed by another member)`);
              deletePromises.push(
                deleteTask(member.habiticaUserId, member.habiticaApiToken, task.id)
                  .catch((err) => console.error(`Failed to delete group task: ${err.message}`))
              );
            }
          }
        }
      }

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        // Refetch to update the UI
        setTimeout(refetchAll, 500);
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
