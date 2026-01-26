export type TaskTypeItem = {
  code: string;
  name: string;
};

export const TASK_TYPES: TaskTypeItem[] = [
  { code: "1001-1", name: "Keying/Scanning/OCR/Script Running" },
  { code: "1006-1", name: "Int. Revised Correction" },
  { code: "1002-1", name: "Paging" },
  { code: "1007-1", name: "II. Rev. Crx." },
  { code: "1003-1", name: "Corr./Paging check" },
  { code: "1008-1", name: "Check II. Rev. Crx." },
  { code: "2001-1", name: "Art Rendering" },
  { code: "2002-1", name: "Art crx." },
  { code: "2003-1", name: "Art rev. crx." },
  { code: "2004-1", name: "2nd Rev. Art Crx." },
  { code: "9999-1", name: "Misc./Training/other type job" },
];

export const getTaskTypeByCode = (code: string) =>
  TASK_TYPES.find((taskType) => taskType.code === code);
