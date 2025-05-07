import {
  performStart,
  performStop,
  startEC2Instances,
  stopEC2Instances,
  startRDSCluster,
  waitForRDSAvailable,
  stopRDSCluster,
} from "./start_stop_env";
import { isHolidayOrWeekend, getResourceMap } from "./common";

async function testCheckHolidayBehavior() {
  console.log("-- checkHoliday = true --");
  await performStart(true);
  console.log("-- checkHoliday = false --");
  await performStart(false);
}

async function testHolidayTypes() {
  console.log("休日判定:", await isHolidayOrWeekend());
}

async function testEC2Operations() {
  const envMap = await getResourceMap();
  const instances = Object.values(envMap)[0]?.instances || [];
  console.log("Testing EC2 instances:", instances);
  await startEC2Instances(instances);
  await stopEC2Instances(instances);
}

async function testRDSOperations() {
  const envMap = await getResourceMap();
  const clusters = Object.values(envMap)[0]?.clusters || [];
  for (const cid of clusters) {
    console.log("Testing RDS cluster:", cid);
    await startRDSCluster(cid);
    await waitForRDSAvailable(cid);
    await stopRDSCluster(cid);
  }
}

const cmd = process.argv[2];
switch (cmd) {
  case "testCheckHoliday":
    testCheckHolidayBehavior();
    break;
  case "testHolidayTypes":
    testHolidayTypes();
    break;
  case "testEC2":
    testEC2Operations();
    break;
  case "testRDS":
    testRDSOperations();
    break;
  default:
    console.log(
      "Usage: node dist/testLocal.js <testCheckHoliday|testHolidayTypes|testEC2|testRDS>"
    );
}
