import { z } from "zod";

export const emojiSchema = z.string().trim().optional();
export const nameSchema = z.string().trim().min(1).max(255);
export const descriptionSchema = z.string().trim().optional();

export const projectIdSchema = z.string().trim().min(1);
export const clientIdSchema = z.string().trim().min(1, {
  message: "Client ID is required",
});
export const clientNameSchema = z.string().trim().min(1, {
  message: "Client name is required",
});
export const externalProjectIdSchema = z.string().trim().min(1, {
  message: "Project ID is required",
});
export const totalChaptersSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return value;
  },
  z
    .coerce.number()
    .int()
    .min(1, { message: "Total chapters must be at least 1" })
    .optional()
);

export const createProjectSchema = z.object({
  emoji: emojiSchema,
  name: nameSchema,
  description: descriptionSchema,
  clientId: clientIdSchema,
  clientName: clientNameSchema,
  projectId: externalProjectIdSchema,
  totalChapters: totalChaptersSchema,
});

export const updateProjectSchema = z.object({
  emoji: emojiSchema,
  name: nameSchema,
  description: descriptionSchema,
  clientId: clientIdSchema.optional(),
  clientName: clientNameSchema.optional(),
  projectId: externalProjectIdSchema.optional(),
  totalChapters: totalChaptersSchema,
});
