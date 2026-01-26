import mongoose, { Document, Schema } from "mongoose";
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "../enums/task.enum";
import { generateTaskCode } from "../utils/uuid";

interface TaskTimerFields {
  firstStartedAt?: Date | null;
  activeStartAt?: Date | null;
  isRunning: boolean;
  lastStoppedAt?: Date | null;
  totalMinutesSpent: number;
  totalSecondsSpent: number;
  pagesCompleted?: number | null;
  remarks?: string | null;
}

export interface TaskDocument extends Document, TaskTimerFields {
  taskCode: string;
  title: string;
  description: string | null;
  taskTypeCode?: string;
  taskTypeName?: string;
  chapter?: string | null;
  pageRange?: string | null;
  project: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  status: TaskStatusEnumType;
  priority: TaskPriorityEnumType;
  assignedTo: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDocument>(
  {
    taskCode: {
      type: String,
      unique: true,
      default: generateTaskCode,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    taskTypeCode: {
      type: String,
      trim: true,
    },
    taskTypeName: {
      type: String,
      trim: true,
    },
    chapter: {
      type: String,
      trim: true,
      default: null,
    },
    pageRange: {
      type: String,
      trim: true,
      default: null,
    },
    firstStartedAt: {
      type: Date,
      default: null,
    },
    activeStartAt: {
      type: Date,
      default: null,
    },
    isRunning: {
      type: Boolean,
      default: false,
    },
    lastStoppedAt: {
      type: Date,
      default: null,
    },
    totalMinutesSpent: {
      type: Number,
      default: 0,
    },
    totalSecondsSpent: {
      type: Number,
      default: 0,
    },
    pagesCompleted: {
      type: Number,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatusEnum),
      default: TaskStatusEnum.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriorityEnum),
      default: TaskPriorityEnum.MEDIUM,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TaskModel = mongoose.model<TaskDocument>("Task", taskSchema);

export default TaskModel;
