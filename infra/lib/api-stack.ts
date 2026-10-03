import path from "node:path";
import { CfnOutput, Duration, Stack, type StackProps } from "aws-cdk-lib";
import { CfnStage, HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type { Table } from "aws-cdk-lib/aws-dynamodb";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import type { StageConfig } from "./config.js";

export interface ApiStackProps extends StackProps {
  config: StageConfig;
  table: Table;
}

const repoRoot = path.resolve(import.meta.dirname, "../..");

export class ApiStack extends Stack {
  public readonly httpApi: HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const { config, table } = props;

    const apiFunction = new NodejsFunction(this, "ApiFunction", {
      entry: path.join(repoRoot, "services/api/src/handler.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(10),
      projectRoot: repoRoot,
      depsLockFilePath: path.join(repoRoot, "pnpm-lock.yaml"),
      environment: { STAGE: config.stage, TABLE_NAME: table.tableName },
      bundling: { minify: true, sourceMap: true, target: "node22" },
    });
    table.grantReadWriteData(apiFunction);

    this.httpApi = new HttpApi(this, "HttpApi", {
      apiName: `parcel-api-${config.stage}`,
      defaultIntegration: new HttpLambdaIntegration("ApiIntegration", apiFunction),
    });

    // Throttle the public endpoint (customer tracking links) against scraping and guessing.
    const stage = this.httpApi.defaultStage?.node.defaultChild as CfnStage | undefined;
    if (stage) {
      stage.defaultRouteSettings = {
        throttlingRateLimit: config.throttle.rateLimit,
        throttlingBurstLimit: config.throttle.burstLimit,
      };
    }

    new CfnOutput(this, "ApiUrl", { value: this.httpApi.apiEndpoint });
  }
}
