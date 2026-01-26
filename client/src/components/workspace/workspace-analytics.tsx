import useWorkspaceId from "@/hooks/use-workspace-id";
import AnalyticsCard from "./common/analytics-card";
import { useQuery } from "@tanstack/react-query";
import { getAllTasksQueryFn } from "@/lib/api";
import { useAuthContext } from "@/context/auth-provider";
import { Permissions, TaskStatusEnum } from "@/constant";
import { TaskType } from "@/types/api.type";
import { isAssignedToMe } from "./task/task-assignment";

const WorkspaceAnalytics = () => {
  const workspaceId = useWorkspaceId();
  const { user, hasPermission } = useAuthContext();
  const showAllTasks = hasPermission(Permissions.DELETE_TASK);

  const { data, isPending } = useQuery({
    queryKey: ["all-tasks", workspaceId],
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
      }),
    staleTime: 0,
    enabled: !!workspaceId,
  });

  const tasks: TaskType[] = data?.tasks || [];
  const dashboardTasks = showAllTasks
    ? tasks
    : tasks.filter((task) => isAssignedToMe(task, user?._id));
  const completedTasks = dashboardTasks.filter(
    (task) => task.status === TaskStatusEnum.DONE
  );
  const taskLeft = Math.max(0, dashboardTasks.length - completedTasks.length);

  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <AnalyticsCard
        isLoading={isPending}
        title="Total Task"
        value={dashboardTasks.length}
      />
      <AnalyticsCard
        isLoading={isPending}
        title="Task Left"
        value={taskLeft}
      />
      <AnalyticsCard
        isLoading={isPending}
        title="Completed Task"
        value={completedTasks.length}
      />
    </div>
  );
};

export default WorkspaceAnalytics;
