/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams } from "react-router-dom";
import CreateTaskDialog from "../task/create-task-dialog";
import EditProjectDialog from "./edit-project-dialog";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProjectByIdQueryFn } from "@/lib/api";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";
import { Badge } from "@/components/ui/badge";

const ProjectHeader = () => {
  const param = useParams();
  const projectId = param.projectId as string;

  const workspaceId = useWorkspaceId();

  const { data, isPending, isError } = useQuery({
    queryKey: ["singleProject", projectId],
    queryFn: () =>
      getProjectByIdQueryFn({
        workspaceId,
        projectId,
      }),
    staleTime: Infinity,
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });

  const project = data?.project;

  // Fallback if no project data is found
  const projectEmoji = project?.emoji || "📊";
  const projectName = project?.name || "Untitled project";
  const clientName = project?.clientName || "Client name unavailable";
  const externalProjectId = project?.projectId || "Project ID unavailable";
  const totalChapters = project?.totalChapters;

  const renderContent = () => {
    if (isPending) return <span>Loading...</span>;
    if (isError) return <span>Error occured</span>;
    return (
      <>
        <span>{projectEmoji}</span>
        {projectName}
      </>
    );
  };
  return (
    <div className="flex items-start justify-between space-y-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-3 text-xl font-medium truncate tracking-tight">
            {renderContent()}
          </h2>
          <PermissionsGuard requiredPermission={Permissions.EDIT_PROJECT}>
            <EditProjectDialog project={project} />
          </PermissionsGuard>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="font-medium">
            {clientName}
          </Badge>
          <Badge variant="secondary" className="font-medium">
            {externalProjectId}
          </Badge>
          {typeof totalChapters === "number" ? (
            <Badge variant="secondary" className="font-medium">
              {totalChapters} chapters
            </Badge>
          ) : null}
        </div>
      </div>
      <CreateTaskDialog projectId={projectId} />
    </div>
  );
};

export default ProjectHeader;
