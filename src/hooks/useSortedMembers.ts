import { useFamilyStore } from "@/store/familyStore";

/**
 * Hook to get family members in their sorted order.
 * This is a convenience hook that wraps the store's getSortedMembers function.
 */
export function useSortedMembers() {
  const getSortedMembers = useFamilyStore(state => state.getSortedMembers);
  return getSortedMembers();
}
