import mongoose from "mongoose";
import { Roles } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/roles-permission.model";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import TaskModel from "../models/task.model";
import { TaskStatusEnum } from "../enums/task.enum";
import ProjectModel from "../models/project.model";
import TaskWorkLogModel from "../models/task-work-log.model";

const resolveDateRange = (from?: string, to?: string) => {
  const now = new Date();
  const parsedTo = to ? new Date(to) : now;
  const endDate = Number.isNaN(parsedTo.getTime()) ? now : parsedTo;
  const parsedFrom = from ? new Date(from) : null;
  let startDate = parsedFrom && !Number.isNaN(parsedFrom.getTime())
    ? parsedFrom
    : new Date(endDate);

  if (!parsedFrom || Number.isNaN(parsedFrom.getTime())) {
    startDate.setDate(startDate.getDate() - 30);
  }

  if (startDate > endDate) {
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
};

//********************************
// CREATE NEW WORKSPACE
//**************** **************/
export const createWorkspaceService = async (
  userId: string,
  body: {
    name: string;
    description?: string | undefined;
  }
) => {
  const { name, description } = body;

  const user = await UserModel.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const ownerRole = await RoleModel.findOne({ name: Roles.OWNER });

  if (!ownerRole) {
    throw new NotFoundException("Owner role not found");
  }

  const workspace = new WorkspaceModel({
    name: name,
    description: description,
    owner: user._id,
  });

  await workspace.save();

  const member = new MemberModel({
    userId: user._id,
    workspaceId: workspace._id,
    role: ownerRole._id,
    joinedAt: new Date(),
  });

  await member.save();

  user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
  await user.save();

  return {
    workspace,
  };
};

//********************************
// GET WORKSPACES USER IS A MEMBER
//**************** **************/
export const getAllWorkspacesUserIsMemberService = async (userId: string) => {
  const memberships = await MemberModel.find({ userId })
    .populate("workspaceId")
    .select("-password")
    .exec();

  // Extract workspace details from memberships
  const workspaces = memberships.map((membership) => membership.workspaceId);

  return { workspaces };
};

export const getWorkspaceByIdService = async (workspaceId: string) => {
  const workspace = await WorkspaceModel.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const members = await MemberModel.find({
    workspaceId,
  }).populate("role");

  const workspaceWithMembers = {
    ...workspace.toObject(),
    members,
  };

  return {
    workspace: workspaceWithMembers,
  };
};

//********************************
// GET ALL MEMEBERS IN WORKSPACE
//**************** **************/

export const getWorkspaceMembersService = async (workspaceId: string) => {
  // Fetch all members of the workspace

  const members = await MemberModel.find({
    workspaceId,
  })
    .populate("userId", "name email profilePicture -password")
    .populate("role", "name");

  const roles = await RoleModel.find({}, { name: 1, _id: 1 })
    .select("-permission")
    .lean();

  return { members, roles };
};

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
  const currentDate = new Date();

  const totalTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
  });

  const overdueTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    dueDate: { $lt: currentDate },
    status: { $ne: TaskStatusEnum.DONE },
  });

  const completedTasks = await TaskModel.countDocuments({
    workspace: workspaceId,
    status: TaskStatusEnum.DONE,
  });

  const analytics = {
    totalTasks,
    overdueTasks,
    completedTasks,
  };

  return { analytics };
};

export const getWorkspaceProgressSummaryService = async (
  workspaceId: string,
  from?: string,
  to?: string
) => {
  const { startDate, endDate } = resolveDateRange(from, to);
  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
  const currentDate = new Date();

  const [
    totalProjects,
    projectStatusAggregation,
    clientAggregation,
    taskAggregation,
    taskStatsByAssignee,
    workLogStatsByUser,
    members,
  ] = await Promise.all([
    ProjectModel.countDocuments({ workspace: workspaceId }),
    TaskModel.aggregate([
      {
        $match: {
          workspace: workspaceObjectId,
          project: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$project",
          totalTasks: { $sum: 1 },
          doneTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", TaskStatusEnum.DONE] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          isCompleted: {
            $and: [
              { $gt: ["$totalTasks", 0] },
              { $eq: ["$totalTasks", "$doneTasks"] },
            ],
          },
          isActive: {
            $gt: [{ $subtract: ["$totalTasks", "$doneTasks"] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          completedProjects: {
            $sum: { $cond: ["$isCompleted", 1, 0] },
          },
          activeProjects: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
        },
      },
    ]),
    ProjectModel.aggregate([
      { $match: { workspace: workspaceObjectId } },
      {
        $addFields: {
          clientId: { $ifNull: ["$clientId", "unknown"] },
          clientName: { $ifNull: ["$clientName", "Unknown"] },
        },
      },
      {
        $group: {
          _id: { clientId: "$clientId", clientName: "$clientName" },
          projectCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          clientId: "$_id.clientId",
          clientName: "$_id.clientName",
          projectCount: 1,
        },
      },
      { $sort: { projectCount: -1, clientName: 1 } },
    ]),
    TaskModel.aggregate([
      { $match: { workspace: workspaceObjectId } },
      {
        $facet: {
          totalTasks: [{ $count: "count" }],
          doneTasks: [
            { $match: { status: TaskStatusEnum.DONE } },
            { $count: "count" },
          ],
          overdueTasks: [
            {
              $match: {
                dueDate: { $lt: currentDate },
                status: { $ne: TaskStatusEnum.DONE },
              },
            },
            { $count: "count" },
          ],
          tasksByStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: "$_id", count: 1 } },
          ],
        },
      },
    ]),
    TaskModel.aggregate([
      {
        $match: {
          workspace: workspaceObjectId,
          assignedTo: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          totalAssigned: { $sum: 1 },
          done: {
            $sum: { $cond: [{ $eq: ["$status", TaskStatusEnum.DONE] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $ne: ["$status", TaskStatusEnum.DONE] }, 1, 0] },
          },
        },
      },
    ]),
    TaskWorkLogModel.aggregate([
      {
        $addFields: {
          activityAt: { $ifNull: ["$stoppedAt", "$startedAt"] },
        },
      },
      {
        $match: {
          activityAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "taskId",
          foreignField: "_id",
          as: "task",
        },
      },
      { $unwind: "$task" },
      { $match: { "task.workspace": workspaceObjectId } },
      {
        $group: {
          _id: "$userId",
          totalMinutes: { $sum: "$durationMinutes" },
          totalPages: { $sum: { $ifNull: ["$pagesCompleted", 0] } },
          lastActiveAt: { $max: "$activityAt" },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          totalMinutes: 1,
          totalPages: 1,
          lastActiveAt: 1,
        },
      },
    ]),
    MemberModel.find({ workspaceId })
      .populate("userId", "name")
      .select("userId")
      .lean(),
  ]);

  const projectStatus = projectStatusAggregation[0] || {
    activeProjects: 0,
    completedProjects: 0,
  };

  const taskStats = taskAggregation[0] || {};
  const totalTasks = taskStats.totalTasks?.[0]?.count || 0;
  const doneTasks = taskStats.doneTasks?.[0]?.count || 0;
  const overdueTasks = taskStats.overdueTasks?.[0]?.count || 0;
  const tasksByStatus = taskStats.tasksByStatus || [];

  const taskStatsMap = new Map(
    taskStatsByAssignee.map((entry: any) => [entry._id.toString(), entry])
  );
  const workLogStatsMap = new Map(
    workLogStatsByUser.map((entry: any) => [entry.userId.toString(), entry])
  );

  const employeeStats = members.map((member: any) => {
    const user = member.userId;
    const userId = user?._id?.toString();
    const taskEntry = userId ? taskStatsMap.get(userId) : null;
    const workLogEntry = userId ? workLogStatsMap.get(userId) : null;
    const totalMinutes = workLogEntry?.totalMinutes || 0;
    const totalHours = Number((totalMinutes / 60).toFixed(2));

    return {
      userId: user?._id,
      name: user?.name || "Unknown",
      totalAssigned: taskEntry?.totalAssigned || 0,
      done: taskEntry?.done || 0,
      pending: taskEntry?.pending || 0,
      totalMinutes,
      totalHours,
      totalPages: workLogEntry?.totalPages || 0,
      lastActiveAt: workLogEntry?.lastActiveAt || null,
    };
  });

  return {
    dateRange: {
      from: startDate,
      to: endDate,
    },
    projectStats: {
      totalProjects,
      activeProjects: projectStatus.activeProjects || 0,
      completedProjects: projectStatus.completedProjects || 0,
    },
    clientStats: {
      totalClients: clientAggregation.length,
      projectsByClient: clientAggregation,
    },
    taskStats: {
      totalTasks,
      doneTasks,
      pendingTasks: Math.max(0, totalTasks - doneTasks),
      overdueTasks,
      tasksByStatus,
    },
    employeeStats,
  };
};

export const getWorkspaceProgressEmployeeService = async (
  workspaceId: string,
  userId: string,
  from?: string,
  to?: string
) => {
  const { startDate, endDate } = resolveDateRange(from, to);
  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [taskCounts, workLogStats, tasks, workLogs] = await Promise.all([
    TaskModel.aggregate([
      {
        $match: {
          workspace: workspaceObjectId,
          assignedTo: userObjectId,
        },
      },
      {
        $group: {
          _id: null,
          totalAssigned: { $sum: 1 },
          done: {
            $sum: { $cond: [{ $eq: ["$status", TaskStatusEnum.DONE] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $ne: ["$status", TaskStatusEnum.DONE] }, 1, 0] },
          },
        },
      },
    ]),
    TaskWorkLogModel.aggregate([
      {
        $addFields: {
          activityAt: { $ifNull: ["$stoppedAt", "$startedAt"] },
        },
      },
      {
        $match: {
          userId: userObjectId,
          activityAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "taskId",
          foreignField: "_id",
          as: "task",
        },
      },
      { $unwind: "$task" },
      { $match: { "task.workspace": workspaceObjectId } },
      {
        $group: {
          _id: "$userId",
          totalMinutes: { $sum: "$durationMinutes" },
          totalPages: { $sum: { $ifNull: ["$pagesCompleted", 0] } },
          lastActiveAt: { $max: "$activityAt" },
        },
      },
      {
        $project: {
          _id: 0,
          totalMinutes: 1,
          totalPages: 1,
          lastActiveAt: 1,
        },
      },
    ]),
    TaskModel.find({
      workspace: workspaceObjectId,
      assignedTo: userObjectId,
    })
      .select("taskCode title taskTypeCode taskTypeName status project")
      .populate("project", "_id name clientId clientName")
      .lean(),
    TaskWorkLogModel.aggregate([
      {
        $addFields: {
          activityAt: { $ifNull: ["$stoppedAt", "$startedAt"] },
        },
      },
      {
        $match: {
          userId: userObjectId,
          activityAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "taskId",
          foreignField: "_id",
          as: "task",
        },
      },
      { $unwind: "$task" },
      { $match: { "task.workspace": workspaceObjectId } },
      {
        $lookup: {
          from: "projects",
          localField: "task.project",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          taskId: 1,
          durationMinutes: 1,
          pagesCompleted: { $ifNull: ["$pagesCompleted", 0] },
          remarks: 1,
          startedAt: 1,
          stoppedAt: 1,
          activityAt: 1,
          taskTitle: "$task.title",
          taskCode: "$task.taskCode",
          projectName: "$project.name",
        },
      },
      { $sort: { activityAt: -1 } },
    ]),
  ]);

  const taskSummary = taskCounts[0] || {
    totalAssigned: 0,
    done: 0,
    pending: 0,
  };

  const workLogSummary = workLogStats[0] || {
    totalMinutes: 0,
    totalPages: 0,
    lastActiveAt: null,
  };
  const totalMinutes = workLogSummary.totalMinutes || 0;

  return {
    dateRange: {
      from: startDate,
      to: endDate,
    },
    employee: {
      userId,
      totalAssigned: taskSummary.totalAssigned || 0,
      done: taskSummary.done || 0,
      pending: taskSummary.pending || 0,
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(2)),
      totalPages: workLogSummary.totalPages || 0,
      lastActiveAt: workLogSummary.lastActiveAt || null,
    },
    tasks,
    workLogs,
  };
};

export const changeMemberRoleService = async (
  workspaceId: string,
  memberId: string,
  roleId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const role = await RoleModel.findById(roleId);
  if (!role) {
    throw new NotFoundException("Role not found");
  }

  const member = await MemberModel.findOne({
    userId: memberId,
    workspaceId: workspaceId,
  });

  if (!member) {
    throw new Error("Member not found in the workspace");
  }

  member.role = role;
  await member.save();

  return {
    member,
  };
};

//********************************
// UPDATE WORKSPACE
//**************** **************/
export const updateWorkspaceByIdService = async (
  workspaceId: string,
  name: string,
  description?: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  // Update the workspace details
  workspace.name = name || workspace.name;
  workspace.description = description || workspace.description;
  await workspace.save();

  return {
    workspace,
  };
};

export const deleteWorkspaceService = async (
  workspaceId: string,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const workspace = await WorkspaceModel.findById(workspaceId).session(
      session
    );
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    // Check if the user owns the workspace
    if (!workspace.owner.equals(new mongoose.Types.ObjectId(userId))) { 
      throw new BadRequestException(
        "You are not authorized to delete this workspace"
      );
    }

    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await ProjectModel.deleteMany({ workspace: workspace._id }).session(
      session
    );
    await TaskModel.deleteMany({ workspace: workspace._id }).session(session);

    await MemberModel.deleteMany({
      workspaceId: workspace._id,
    }).session(session);

    // Update the user's currentWorkspace if it matches the deleted workspace
    if (user?.currentWorkspace?.equals(workspaceId)) {
      const memberWorkspace = await MemberModel.findOne({ userId }).session(
        session
      );
      // Update the user's currentWorkspace
      user.currentWorkspace = memberWorkspace
        ? memberWorkspace.workspaceId
        : null;

      await user.save({ session });
    }

    await workspace.deleteOne({ session });

    await session.commitTransaction();

    session.endSession();

    return {
      currentWorkspace: user.currentWorkspace,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
