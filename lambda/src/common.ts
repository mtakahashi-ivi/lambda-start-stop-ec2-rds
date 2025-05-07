import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

export const REGION = process.env.AWS_REGION || "ap-northeast-1";
export const TAG_KEY = "ops_auto_start_stop";
export const TAG_VALUE = "true";

export async function getResourceMap(): Promise<
  Record<string, { clusters: string[]; instances: string[] }>
> {
  const { ResourceGroupsTaggingAPIClient, GetResourcesCommand } = await import(
    "@aws-sdk/client-resource-groups-tagging-api"
  );
  const taggingClient = new ResourceGroupsTaggingAPIClient({ region: REGION });
  const res = await taggingClient.send(
    new GetResourcesCommand({
      TagFilters: [{ Key: TAG_KEY, Values: [TAG_VALUE] }],
      ResourceTypeFilters: ["rds:cluster", "ec2:instance"],
    })
  );
  const map: Record<string, { clusters: string[]; instances: string[] }> = {};
  for (const m of res.ResourceTagMappingList || []) {
    const arn = m.ResourceARN!;
    const tags = m.Tags || [];
    const env = tags.find((t) => t.Key === "Env")?.Value;
    if (!env) continue;
    if (!map[env]) map[env] = { clusters: [], instances: [] };

    if (arn.includes(":cluster:")) {
      const id = arn.split(":").pop()!;
      map[env].clusters.push(id);
    } else if (arn.includes(":instance/")) {
      const id = arn.split("/").pop()!;
      map[env].instances.push(id);
    }
  }
  return map;
}

async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

export async function isHolidayOrWeekend(
  date: Date = new Date()
): Promise<boolean> {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const day = jst.getDay();
  if (day === 0 || day === 6) return true;

  const localFile = process.env.NON_WORKING_DAYS_FILE;
  let holidayData: Record<string, string>;
  if (localFile && fs.existsSync(localFile)) {
    holidayData = JSON.parse(fs.readFileSync(path.resolve(localFile), "utf-8"));
  } else {
    const bucket = process.env.HOLIDAY_S3_BUCKET;
    const key = process.env.HOLIDAY_S3_KEY;
    const ttlDays = parseInt(process.env.HOLIDAY_TTL_DAYS || "10", 10);
    const apiUrl = process.env.HOLIDAY_API_URL ||
      "https://holidays-jp.github.io/api/v1/date.json";
    if (bucket && key) {
      const s3 = new S3Client({ region: REGION });
      let needRefresh = false;
      try {
        const head = await s3.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key })
        );
        if (head.LastModified) {
          const ageMs = Date.now() - head.LastModified.getTime();
          needRefresh = ageMs > ttlDays * 24 * 60 * 60 * 1000;
        } else {
          needRefresh = true;
        }
      } catch {
        needRefresh = true;
      }
      if (needRefresh) {
        const resp = await fetch(apiUrl);
        const data = await resp.json();
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(data),
            ContentType: "application/json",
          })
        );
        holidayData = data;
      } else {
        const obj = await s3.send(
          new GetObjectCommand({ Bucket: bucket, Key: key })
        );
        holidayData = JSON.parse(await streamToString(obj.Body));
      }
    } else {
      holidayData = await fetch(apiUrl).then((r) => r.json());
    }
  }
  const dateStr = jst.toISOString().slice(0, 10);
  return Boolean(holidayData[dateStr]);
}
