import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Eye, Loader } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TaskPriorityEnum, TaskStatusEnum } from "@/constant";
import useWorkspaceId from "@/hooks/use-workspace-id";
import {
  getTaskByIdQueryFn,
  startTaskTimerMutationFn,
  stopTaskTimerMutationFn,
} from "@/lib/api";
import { transformStatusEnum } from "@/lib/helper";
import { TaskType } from "@/types/api.type";
import { toast } from "@/hooks/use-toast";

const formatIstDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const formatSecondsToClock = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(remainingSeconds).padStart(2, "0")}`;
};

const getDurationSeconds = (activeStartAt?: string | null, now?: Date) => {
  if (!activeStartAt || !now) return 0;
  return Math.floor((now.getTime() - new Date(activeStartAt).getTime()) / 1000);
};

const TaskDetailsDialog = ({
  task,
  isOpen,
  onClose,
}: {
  task: TaskType;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const projectId = task.project?._id || "";

  const { data, isLoading } = useQuery({
    queryKey: ["task", task._id, projectId],
    queryFn: () =>
      getTaskByIdQueryFn({
        taskId: task._id,
        projectId,
        workspaceId,
      }),
    enabled: isOpen && !!workspaceId && !!projectId,
  });

  const currentTask = data?.task ?? task;
  const isRunning = currentTask.isRunning ?? false;

  const [now, setNow] = useState(new Date());
  const [openStopDialog, setOpenStopDialog] = useState(false);
  const [pagesCompleted, setPagesCompleted] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!isOpen || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning]);

  const liveDurationSeconds = useMemo(
    () => getDurationSeconds(currentTask.activeStartAt, now),
    [currentTask.activeStartAt, now]
  );

  const baseTotalSeconds =
    currentTask.totalSecondsSpent ??
    (currentTask.totalMinutesSpent ?? 0) * 60;
  const totalSeconds = baseTotalSeconds + (isRunning ? liveDurationSeconds : 0);

  const { mutate: startTimer, isPending: isStarting } = useMutation({
    mutationFn: startTaskTimerMutationFn,
    onSuccess: (response) => {
      queryClient.setQueryData(["task", task._id, projectId], response);
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      toast({
        title: "Success",
        description: response.message,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: stopTimer, isPending: isStopping } = useMutation({
    mutationFn: stopTaskTimerMutationFn,
    onSuccess: (response) => {
      queryClient.setQueryData(["task", task._id, projectId], response);
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      setOpenStopDialog(false);
      setPagesCompleted("");
      setRemarks("");
      toast({
        title: "Success",
        description: response.message,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStart = () => {
    if (isStarting) return;
    startTimer({ taskId: task._id });
  };

  const handleStopSubmit = () => {
    if (isStopping) return;
    const parsedPages = pagesCompleted.trim() ? Number(pagesCompleted) : undefined;
    stopTimer({
      taskId: task._id,
      data: {
        pagesCompleted: Number.isNaN(parsedPages) ? undefined : parsedPages,
        remarks: remarks.trim() ? remarks.trim() : undefined,
      },
    });
  };

  return (
    <>
      <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl border-0">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Task Details</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentTask.taskCode} • {currentTask.title}
                </p>
              </div>
              {isRunning ? (
                <Badge variant="secondary" className="uppercase">
                  Running
                </Badge>
              ) : null}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2 rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Timer
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">First started</p>
                      <p className="text-sm font-medium">
                        {formatIstDateTime(currentTask.firstStartedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last stopped</p>
                      <p className="text-sm font-medium">
                        {formatIstDateTime(currentTask.lastStoppedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total time</p>
                      <p className="text-sm font-medium">
                        {formatSecondsToClock(totalSeconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Live elapsed</p>
                      <p className="text-sm font-medium">
                        {isRunning
                          ? formatSecondsToClock(liveDurationSeconds)
                          : "00:00:00"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={handleStart}
                      disabled={isRunning || isStarting}
                    >
                      {isStarting ? "Starting..." : "Start"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenStopDialog(true)}
                      disabled={!isRunning}
                    >
                      Stop
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 rounded-lg border p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Task Info
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Task Type</p>
                      <p className="text-sm font-medium">
                        {currentTask.taskTypeCode || "—"} • {currentTask.taskTypeName || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Chapter</p>
                      <p className="text-sm font-medium">
                        {currentTask.chapter || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Page Range</p>
                      <p className="text-sm font-medium">
                        {currentTask.pageRange || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned To</p>
                      <p className="text-sm font-medium">
                        {currentTask.assignedTo?.name || "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">
                        {currentTask.dueDate ? format(new Date(currentTask.dueDate), "PPP") : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={TaskStatusEnum[currentTask.status]}>
                        {transformStatusEnum(currentTask.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Priority</p>
                      <Badge variant={TaskPriorityEnum[currentTask.priority]}>
                        {transformStatusEnum(currentTask.priority)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pages Completed</p>
                      <p className="text-sm font-medium">
                        {currentTask.pagesCompleted ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remarks</p>
                      <p className="text-sm font-medium">
                        {currentTask.remarks || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog modal={true} open={openStopDialog} onOpenChange={setOpenStopDialog}>
        <DialogContent className="sm:max-w-md border-0">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stop Timer</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pages Completed</label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={pagesCompleted}
                onChange={(event) => setPagesCompleted(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>
              <Textarea
                placeholder="Add remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenStopDialog(false)}
                disabled={isStopping}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleStopSubmit} disabled={isStopping}>
                {isStopping ? "Stopping..." : "Stop Timer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskDetailsDialog;
