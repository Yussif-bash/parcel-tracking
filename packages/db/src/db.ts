import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createEntities } from "./entities.js";

export interface DbConfig {
  /** The DynamoDB table name. In Lambda this comes from the TABLE_NAME environment variable. */
  tableName: string;
  /** Optional. Pass your own client in tests. */
  client?: DynamoDBDocumentClient;
}

export function createDocumentClient(): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
}

export function createDb(config: DbConfig) {
  const client = config.client ?? createDocumentClient();
  return createEntities({ table: config.tableName, client });
}

export type Db = ReturnType<typeof createDb>;
