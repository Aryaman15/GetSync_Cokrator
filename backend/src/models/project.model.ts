import mongoose, { Document, Schema } from "mongoose";

export interface ProjectDocument extends Document {
  name: string;
  description: string | null; // Optional description for the project
  emoji: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  totalChapters?: number;
  workspace: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  //can add an additional field which will be having the option to upload the file which other can download
}

const projectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    emoji: {
      type: String,
      required: false,
      trim: true,
      default: "📊",
    },
    description: { type: String, required: false },
    clientId: {
      type: String,
      trim: true,
      required: false,
    },
    clientName: {
      type: String,
      trim: true,
      required: false,
    },
    projectId: {
      type: String,
      trim: true,
      required: false,
    },
    totalChapters: {
      type: Number,
      required: false,
      min: 1,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectModel = mongoose.model<ProjectDocument>("Project", projectSchema);
export default ProjectModel;
