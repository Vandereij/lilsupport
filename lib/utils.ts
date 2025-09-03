export const assertEnv = (keys: string[]) => {
  for (const k of keys) if (!process.env[k]) throw new Error(`Missing env: ${k}`);
};

export const appUrl = () => process.env.APP_URL!.replace(/\/$/, '');
