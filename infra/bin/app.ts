import { App } from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack.js";
import { AuthStack } from "../lib/auth-stack.js";
import { resolveStage } from "../lib/config.js";
import { DataStack } from "../lib/data-stack.js";

const app = new App();
const config = resolveStage(app.node.tryGetContext("stage") ?? "dev");

// Account and region come from the AWS credentials in use (CDK_DEFAULT_*), so the region decision
// (section 7.6) is made by where you deploy, not by editing code. Unset during local synth and tests.
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const data = new DataStack(app, `ParcelData-${config.stage}`, { env, config });
new AuthStack(app, `ParcelAuth-${config.stage}`, { env, config });
new ApiStack(app, `ParcelApi-${config.stage}`, { env, config, table: data.table });
