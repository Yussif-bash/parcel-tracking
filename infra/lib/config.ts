export type Stage = "dev" | "prod";

export interface StageConfig {
  stage: Stage;
  /** Production data is kept when the stack is deleted; dev data is not. */
  retainData: boolean;
  /** API Gateway throttling for the public endpoint. */
  throttle: { rateLimit: number; burstLimit: number };
}

export const STAGES: Record<Stage, StageConfig> = {
  dev: { stage: "dev", retainData: false, throttle: { rateLimit: 10, burstLimit: 20 } },
  prod: { stage: "prod", retainData: true, throttle: { rateLimit: 50, burstLimit: 100 } },
};

export function resolveStage(value: unknown): StageConfig {
  if (value === "dev" || value === "prod") return STAGES[value];
  throw new Error(`Unknown stage "${String(value)}". Use -c stage=dev or -c stage=prod.`);
}
