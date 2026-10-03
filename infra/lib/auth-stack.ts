import { CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { CfnUserPoolGroup, UserPool } from "aws-cdk-lib/aws-cognito";
import type { Construct } from "constructs";
import type { StageConfig } from "./config.js";

export interface AuthStackProps extends StackProps {
  config: StageConfig;
}

/** Staff and driver sign-in. Customers have no accounts; they use tracking links. */
export class AuthStack extends Stack {
  public readonly userPool: UserPool;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);
    const { config } = props;

    this.userPool = new UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 10,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
      },
      removalPolicy: config.retainData ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    for (const groupName of ["cashier", "driver", "admin"]) {
      new CfnUserPoolGroup(this, `Group-${groupName}`, {
        userPoolId: this.userPool.userPoolId,
        groupName,
      });
    }

    const webClient = this.userPool.addClient("WebClient", {
      authFlows: { userSrp: true },
      generateSecret: false,
    });

    new CfnOutput(this, "UserPoolId", { value: this.userPool.userPoolId });
    new CfnOutput(this, "WebClientId", { value: webClient.userPoolClientId });
  }
}
