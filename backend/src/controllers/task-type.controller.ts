import { Request, Response } from "express";
import { TASK_TYPES } from "../config/task-types";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

export const getTaskTypesController = asyncHandler(
  async (_req: Request, res: Response) => {
    return res.status(HTTPSTATUS.OK).json({
      items: TASK_TYPES,
    });
  }
);
