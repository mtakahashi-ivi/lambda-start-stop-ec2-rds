import {
  performStart,
  performStop,
  startEC2Instances,
  stopEC2Instances,
  startRDSCluster,
  waitForRDSAvailable,
  stopRDSCluster,
} from "./start_stop_env.js";
import { isHolidayOrWeekend, getResourceMap } from "./common.js";

async function testCheckHolidayBehavior() {
  console.log("-- checkHoliday = true --");
  await performStart(true);
  console.log("-- checkHoliday = false --");
  await performStart(false);
}

async function testHolidayTypes() {
  console.log("休日判定:", await isHolidayOrWeekend());
}

async function testGetResourceMap() {
  const envMap = await getResourceMap();
  console.log("getResourceMap result:", JSON.stringify(envMap, null, 2));
}

async function testStartEC2() {
  const envMap = await getResourceMap();
  const instances = Object.values(envMap)[0]?.instances || [];
  console.log("Testing startEC2Instances:", instances);
  await startEC2Instances(instances);
}

async function testStopEC2() {
  const envMap = await getResourceMap();
  const instances = Object.values(envMap)[0]?.instances || [];
  console.log("Testing stopEC2Instances:", instances);
  await stopEC2Instances(instances);
}

async function testStartRDS() {
  const envMap = await getResourceMap();
  const clusters = Object.values(envMap)[0]?.clusters || [];
  for (const cid of clusters) {
    console.log("Testing startRDSCluster:", cid);
    await startRDSCluster(cid);
  }
}

async function testWaitForRDSAvailable() {
  const envMap = await getResourceMap();
  const clusters = Object.values(envMap)[0]?.clusters || [];
  for (const cid of clusters) {
    console.log("Testing waitForRDSAvailable:", cid);
    await waitForRDSAvailable(cid);
  }
}

async function testStopRDS() {
  const envMap = await getResourceMap();
  const clusters = Object.values(envMap)[0]?.clusters || [];
  for (const cid of clusters) {
    console.log("Testing stopRDSCluster:", cid);
    await stopRDSCluster(cid);
  }
}

const cmd = process.argv[2];
(async () => {
	console.log("------- Starting test -------");
	switch (cmd) {
	case "testHolidayTypes":
		await testHolidayTypes();
		break;
	case "testGetResourceMap":
		await testGetResourceMap();
		break;
	case "testStartEC2":
		await testStartEC2();
		break;
	case "testStopEC2":
		await testStopEC2();
		break;
	case "testStartRDS":
		await testStartRDS();
		break;
	case "testWaitForRDSAvailable":
		await testWaitForRDSAvailable();
		break;
	case "testStopRDS":
		await testStopRDS();
		break;
	case "testCheckHoliday":
		await testCheckHolidayBehavior();
		break;
	default:
		console.log(
		"Usage: node dist/testLocal.js <testCheckHoliday|testHolidayTypes|testEC2|testRDS|testGetResourceMap|testStartEC2|testStopEC2|testStartRDS|testWaitForRDSAvailable|testStopRDS>"
		);
	}
	console.log("------- Test completed -------");
})();
