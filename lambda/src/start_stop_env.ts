import {
  RDSClient,
  StartDBClusterCommand,
  StopDBClusterCommand,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";
import { getResourceMap, isHolidayOrWeekend, REGION } from "./common";

const rdsClient = new RDSClient({ region: REGION });
const ec2Client = new EC2Client({ region: REGION });

export async function startRDSCluster(clusterId: string): Promise<void> {
  console.log(`-> RDS クラスター起動: ${clusterId}`);
  await rdsClient.send(new StartDBClusterCommand({ DBClusterIdentifier: clusterId }));
}

export async function waitForRDSAvailable(clusterId: string): Promise<void> {
  while (true) {
    const desc = await rdsClient.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
    );
    const status = desc.DBClusters?.[0]?.Status;
    console.log(`  クラスター: ${status}`);
    if (status === "available") break;
    await new Promise((r) => setTimeout(r, 10_000));
  }
  const clusterDesc = await rdsClient.send(
    new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId })
  );
  const writer = clusterDesc.DBClusters?.[0]?.DBClusterMembers?.find((m) => m.IsWriter);
  if (!writer?.DBInstanceIdentifier) {
    console.warn(`Writer 未検出: ${clusterId}`);
    return;
  }
  const writerId = writer.DBInstanceIdentifier;
  while (true) {
    const instDesc = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: writerId })
    );
    const instStatus = instDesc.DBInstances?.[0]?.DBInstanceStatus;
    console.log(`  Writer: ${instStatus}`);
    if (instStatus === "available") break;
    await new Promise((r) => setTimeout(r, 10_000));
  }
}

export async function stopRDSCluster(clusterId: string): Promise<void> {
  console.log(`-> RDS クラスター停止: ${clusterId}`);
  await rdsClient.send(new StopDBClusterCommand({ DBClusterIdentifier: clusterId }));
}

export async function startEC2Instances(instanceIds: string[]): Promise<void> {
  console.log(`-> EC2 起動: ${instanceIds.join(", ")}`);
  await ec2Client.send(new StartInstancesCommand({ InstanceIds: instanceIds }));
}

export async function stopEC2Instances(instanceIds: string[]): Promise<void> {
  console.log(`-> EC2 停止: ${instanceIds.join(", ")}`);
  await ec2Client.send(new StopInstancesCommand({ InstanceIds: instanceIds }));
}

export async function performStart(checkHoliday: boolean): Promise<void> {
  if (checkHoliday && (await isHolidayOrWeekend())) {
    console.log("休日または週末のため起動スキップ");
    return;
  }
  const envMap = await getResourceMap();
  for (const [env, { clusters, instances }] of Object.entries(envMap)) {
    console.log(`=== 起動: Env=${env} ===`);
    for (const cid of clusters) {
      await startRDSCluster(cid);
      await waitForRDSAvailable(cid);
    }
    await startEC2Instances(instances);
  }
  console.log("全リソース起動完了");
}

export async function performStop(): Promise<void> {
  const envMap = await getResourceMap();
  for (const [env, { clusters, instances }] of Object.entries(envMap)) {
    console.log(`=== 停止: Env=${env} ===`);
    await stopEC2Instances(instances);
    console.log("EC2 停止後 1 分待機");
    await new Promise((r) => setTimeout(r, 60_000));
    for (const cid of clusters) {
      await stopRDSCluster(cid);
    }
  }
  console.log("全リソース停止完了");
}
