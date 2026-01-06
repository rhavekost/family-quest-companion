import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { getUser, getAllTasks } from "@/lib/habiticaApi";
import { FamilyMember } from "@/types/habitica";
import { useFamilyStore } from "@/store/familyStore";
import { DEMO_USERS, DEMO_TASKS } from "@/data/demoData";

export function useHabiticaUser(member: FamilyMember) {
  const isDemoMode = useFamilyStore((state) => state.isDemoMode);
  
  return useQuery({
    queryKey: ["habitica", "user", member.id],
    queryFn: () => {
      if (isDemoMode) {
        return Promise.resolve(DEMO_USERS[member.habiticaUserId]);
      }
      return getUser(member.habiticaUserId, member.habiticaApiToken);
    },
    staleTime: 5 * 60 * 1000,
    retry: isDemoMode ? 0 : 2,
  });
}

export function useHabiticaTasks(member: FamilyMember) {
  const isDemoMode = useFamilyStore((state) => state.isDemoMode);
  
  return useQuery({
    queryKey: ["habitica", "tasks", member.id],
    queryFn: () => {
      if (isDemoMode) {
        return Promise.resolve(DEMO_TASKS[member.habiticaUserId] || []);
      }
      return getAllTasks(member.habiticaUserId, member.habiticaApiToken);
    },
    staleTime: 5 * 60 * 1000,
    retry: isDemoMode ? 0 : 2,
  });
}

export function useFamilyData(members: FamilyMember[]) {
  const isDemoMode = useFamilyStore((state) => state.isDemoMode);
  const queryClient = useQueryClient();

  const userQueries = useQueries({
    queries: members.map((member) => ({
      queryKey: ["habitica", "user", member.id],
      queryFn: () => {
        if (isDemoMode) {
          return Promise.resolve(DEMO_USERS[member.habiticaUserId]);
        }
        return getUser(member.habiticaUserId, member.habiticaApiToken);
      },
      staleTime: 5 * 60 * 1000,
      retry: isDemoMode ? 0 : 2,
    })),
  });

  const taskQueries = useQueries({
    queries: members.map((member) => ({
      queryKey: ["habitica", "tasks", member.id],
      queryFn: () => {
        if (isDemoMode) {
          return Promise.resolve(DEMO_TASKS[member.habiticaUserId] || []);
        }
        return getAllTasks(member.habiticaUserId, member.habiticaApiToken);
      },
      staleTime: 5 * 60 * 1000,
      retry: isDemoMode ? 0 : 2,
    })),
  });

  const isLoading = userQueries.some((q) => q.isLoading) || taskQueries.some((q) => q.isLoading);

  const familyData = members.map((member, index) => ({
    ...member,
    userData: userQueries[index]?.data,
    tasks: taskQueries[index]?.data,
    isLoading: userQueries[index]?.isLoading || taskQueries[index]?.isLoading,
    error: userQueries[index]?.error?.message || taskQueries[index]?.error?.message,
  }));

  const refetchAll = async () => {
    // Invalidate all queries first to force fresh fetches
    await queryClient.invalidateQueries({ queryKey: ["habitica"] });
    
    // Then trigger refetch on all queries
    await Promise.all([
      ...userQueries.map((q) => q.refetch()),
      ...taskQueries.map((q) => q.refetch()),
    ]);
  };

  return {
    familyData,
    isLoading,
    refetchAll,
  };
}
