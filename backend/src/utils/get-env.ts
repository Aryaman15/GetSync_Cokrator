export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value !== undefined) {
    return value;
  }
  if (defaultValue !== undefined) {   // accepts "" as a valid default
    return defaultValue;
  }
  throw new Error(`Environment variable ${key} is not set`);
};
