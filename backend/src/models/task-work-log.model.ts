import mongoose, { Document, Schema } from "mongoose";

export interface TaskWorkLogDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startedAt: Date;
  stoppedAt: Date;
  durationMinutes: number;
  pagesCompleted?: number | null;
  remarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskWorkLogSchema = new Schema<TaskWorkLogDocument>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    stoppedAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
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
  },
  {
    timestamps: true,
  }
);

const TaskWorkLogModel = mongoose.model<TaskWorkLogDocument>(
  "TaskWorkLog",
  taskWorkLogSchema
);

export default TaskWorkLogModel;
