import path from "path";
import { BadRequestException } from "./appError";

export const resolveWorkspacePath = (
  workspaceRoot: string,
  relPath = ""
) => {
  if (path.isAbsolute(relPath)) {
    throw new BadRequestException("Path must be relative");
  }

  const normalizedRoot = path.resolve(workspaceRoot);
  const targetAbs = path.resolve(normalizedRoot, relPath);
  const rootWithSeparator = normalizedRoot.endsWith(path.sep)
    ? normalizedRoot
    : `${normalizedRoot}${path.sep}`;

  if (targetAbs !== normalizedRoot && !targetAbs.startsWith(rootWithSeparator)) {
    throw new BadRequestException("Invalid path");
  }

  return {
    workspaceRoot: normalizedRoot,
    targetAbs,
  };
};

export const sanitizeFileName = (name: string) => {
  const trimmed = name.trim();
  const base = path.basename(trimmed);
  if (!base || base !== trimmed) {
    throw new BadRequestException("Invalid file or folder name");
  }
  return base;
};
