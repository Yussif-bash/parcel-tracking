import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, it } from "vitest";
import { ApiStack } from "../lib/api-stack.js";
import { AuthStack } from "../lib/auth-stack.js";
import { STAGES } from "../lib/config.js";
import { DataStack } from "../lib/data-stack.js";

// Skip Lambda bundling in tests; it is exercised by `cdk synth` and the Jenkins pipeline.
const newApp = () => new App({ context: { "aws:cdk:bundling-stacks": [] } });

describe("DataStack", () => {
  const stack = new DataStack(newApp(), "Data", { config: STAGES.dev });
  const template = Template.fromStack(stack);

  it("creates an on-demand table with TTL and a stream", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      BillingMode: "PAY_PER_REQUEST",
      TimeToLiveSpecification: { AttributeName: "expiresAt", Enabled: true },
      StreamSpecification: { StreamViewType: "NEW_AND_OLD_IMAGES" },
    });
  });

  it("has the gsi1 index", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      GlobalSecondaryIndexes: Match.arrayWith([Match.objectLike({ IndexName: "gsi1" })]),
    });
  });
});

describe("AuthStack", () => {
  const stack = new AuthStack(newApp(), "Auth", { config: STAGES.dev });
  const template = Template.fromStack(stack);

  it("disables self sign-up and creates the three role groups", () => {
    template.hasResourceProperties("AWS::Cognito::UserPool", {
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: true },
    });
    template.resourceCountIs("AWS::Cognito::UserPoolGroup", 3);
  });
});

describe("ApiStack", () => {
  const app = newApp();
  const data = new DataStack(app, "Data", { config: STAGES.dev });
  const stack = new ApiStack(app, "Api", { config: STAGES.dev, table: data.table });
  const template = Template.fromStack(stack);

  it("runs the API on Node 22 on ARM", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs22.x",
      Architectures: ["arm64"],
    });
  });

  it("throttles the default stage", () => {
    template.hasResourceProperties("AWS::ApiGatewayV2::Stage", {
      DefaultRouteSettings: { ThrottlingRateLimit: 10, ThrottlingBurstLimit: 20 },
    });
  });
});
