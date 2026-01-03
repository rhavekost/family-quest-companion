import { useQuery } from "@tanstack/react-query";
import { getUser, getTasks } from "@/lib/habiticaApi";
import { FamilyMember, HabiticaUser, HabiticaTask } from "@/types/habitica";

export function useHabiticaUser(member: FamilyMember) {
  return useQuery({
    queryKey: ["habitica", "user", member.id],
    queryFn: () => getUser(member.habiticaUserId, member.habiticaApiToken),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useHabiticaTasks(member: FamilyMember) {
  return useQuery({
    queryKey: ["habitica", "tasks", member.id],
    queryFn: () => getTasks(member.habiticaUserId, member.habiticaApiToken),
    staleTime: 5 * 60 * 1000,
    retry: 2,
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
