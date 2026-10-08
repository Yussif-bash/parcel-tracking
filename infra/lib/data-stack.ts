import { RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";
import type { StageConfig } from "./config.js";

export interface DataStackProps extends StackProps {
  config: StageConfig;
}

/** Single DynamoDB table (section 8 of the project document). */
export class DataStack extends Stack {
  public readonly table: Table;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);
    const { config } = props;

    this.table = new Table(this, "Table", {
      partitionKey: { name: "pk", type: AttributeType.STRING },
      sortKey: { name: "sk", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      // Location points carry `expiresAt` (epoch seconds) so old GPS data is deleted automatically.
      timeToLiveAttribute: "expiresAt",
      // The stream triggers the Processor Lambda on every new location point.
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: config.retainData },
      removalPolicy: config.retainData ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // gsi1 and gsi2 are shared by several kinds of item, each with its own key prefix (see packages/db).
    // gsi1: trips by status, parcels by tracking code, lists of routes and drivers.
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "gsi1pk", type: AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: AttributeType.STRING },
    });

    // gsi2: trips by driver, parcels by tracking-token hash.
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "gsi2pk", type: AttributeType.STRING },
      sortKey: { name: "gsi2sk", type: AttributeType.STRING },
    });
  }
}
