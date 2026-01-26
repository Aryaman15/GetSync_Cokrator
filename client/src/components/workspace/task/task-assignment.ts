import { TaskType } from "@/types/api.type";

type TaskAssignment = TaskType & {
  assignedToId?: string | null;
};

export const isAssignedToMe = (
  task: TaskAssignment,
  userId?: string
): boolean => {
  if (!userId) return false;

  const assignedId = task.assignedToId ?? task.assignedTo?._id ?? null;
  if (!assignedId) return false;

  return assignedId === userId;
};
