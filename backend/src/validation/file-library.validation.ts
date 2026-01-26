import { z } from "zod";

export const filePathQuerySchema = z
  .string()
  .optional()
  .transform((value) => (value ?? "").trim());

export const createFolderSchema = z.object({
  path: z.string().optional().default(""),
  name: z.string().min(1, "Folder name is required"),
});

export const fileActivityQuerySchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return 7;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
  });
