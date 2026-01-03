import { useQuery } from "@tanstack/react-query";
import { getUser, getTasks } from "@/lib/habiticaApi";
import { FamilyMember } from "@/types/habitica";
import { useFamilyStore } from "@/store/familyStore";
import { DEMO_USERS, DEMO_TASKS } from "@/data/demoData";

export function useHabiticaUser(member: FamilyMember) {
  const { isDemoMode } = useFamilyStore();
  
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
  const { isDemoMode } = useFamilyStore();
  
  return useQuery({
    queryKey: ["habitica", "tasks", member.id],
    queryFn: () => {
      if (isDemoMode) {
        return Promise.resolve(DEMO_TASKS[member.habiticaUserId] || []);
      }
      return getTasks(member.habiticaUserId, member.habiticaApiToken);
    },
    staleTime: 5 * 60 * 1000,
    retry: isDemoMode ? 0 : 2,
  });
}

export function useFamilyData(members: FamilyMember[]) {
  const userQueries = members.map((member) => ({
    member,
    userQuery: useHabiticaUser(member),
    tasksQuery: useHabiticaTasks(member),
  }));

  const isLoading = userQueries.some(
    (q) => q.userQuery.isLoading || q.tasksQuery.isLoading
  );

  const familyData = userQueries.map(({ member, userQuery, tasksQuery }) => ({
    ...member,
    userData: userQuery.data,
    tasks: tasksQuery.data,
    isLoading: userQuery.isLoading || tasksQuery.isLoading,
    error: userQuery.error?.message || tasksQuery.error?.message,
  }));

  const refetchAll = () => {
    userQueries.forEach(({ userQuery, tasksQuery }) => {
      userQuery.refetch();
      tasksQuery.refetch();
    });
  };

  return {
    familyData,
    isLoading,
    refetchAll,
  };
}
