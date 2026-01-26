import { Router } from "express";
import { getTaskTypesController } from "../controllers/task-type.controller";

const taskTypeRoutes = Router();

taskTypeRoutes.get("/", getTaskTypesController);

export default taskTypeRoutes;
