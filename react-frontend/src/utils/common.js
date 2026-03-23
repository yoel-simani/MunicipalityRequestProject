// utils/common.js
import { formatInTimeZone } from "date-fns-tz";

/**
 * פורמט תאריך אחיד לעברית עם שעה מימין
 * @param {string|Date|number} value - ערך התאריך
 * @param {string} timeZone - ברירת מחדל UTC
 * @returns {string}
 */
export function formatDate(value, timeZone = "UTC") {
  if (!value) return "";
  try {
    return formatInTimeZone(value, timeZone, "HH:mm dd-MM-yyyy");
  } catch {
    return "";
  }
}

/**
 * בניית קישור לפנייה (Pnia)
 */
export function buildPniaLink(pseq, reqString, env, rashutMap = {}) {
  try {
    if (!reqString) return pseq;
    const customerMatch = reqString.match(/"Customer":"?(\d+)"?/);
    if (!customerMatch) return pseq;

    const customerId = parseInt(customerMatch[1], 10);
    if (!customerId) return pseq;

    const customer = rashutMap[customerId.toString()];
    if (!customer?.rashutPark || !customer?.schemaName) return null;

    const isUat = env === "uat";
    const baseUrl = isUat
      ? "https://uat.ladpc.net.il/MGA2-D/LoginUI"
      : customer.rashutPark === 813510
      ? "https://portal4.ladpc.net.il/MGA2-T/LoginUI"
      : "https://portal4.ladpc.net.il/MGA2-J/LoginUI";

    const params = new URLSearchParams({
      server: baseUrl.replace("/LoginUI", ""),
      customerID: customer.rashutPark,
      schema: customer.schemaName,
      autoUserID: "325038537",
      autoUserPass: isUat ? "Ruthr6464" : "Ruthr7410",
      application: "MGA2",
      page: "3259",
      gApPniya: pseq,
      userIP: "127.0.0.1",
    });

    return `${baseUrl}?${params.toString()}`;
  } catch {
    return null;
  }
}

/**
 * בניית קישור לתהליך (Process)
 * כולל תמיכה גם ב-WF_PROC_INSTS (env sqlserver)
 */
export function buildProcessLink(pname, pid, reqString, env, rashutMap = {}) {
  try {
    // לוגיקה מיוחדת ל-WF_PROC_INSTS ללא reqString
    if (!reqString && env.startsWith("sqlserver")) {
      const match = env.match(/sqlserverprod(\d+)/);

      if (env === "sqlserver") {
        return pname.startsWith("ProcessOneClick")
          ? `https://agilepoint-dev.ladpc.net.il:60140/manage/index#sections/runtimemanagement/process/detail/params(${pid},1)`
          : `https://agilepoint-dev.ladpc.net.il:60162/manage/index#sections/runtimemanagement/process/detail/params(${pid},1)`;
      }

      if (match?.[1]) {
        return `https://por${match[1]}.cityforms.co.il/manage/index#sections/runtimemanagement/process/detail/params(${pid},1)`;
      }

      return null;
    }

    // לוגיקה רגילה עם reqString (כמו ב-Logs)
    if (!reqString) return pid;

    const customerMatch = reqString.match(/"Customer":"?(\d+)"?/);
    if (!customerMatch) return pid;

    const customerId = parseInt(customerMatch[1], 10);
    if (!customerId) return pid;

    const customer = rashutMap[customerId.toString()];
    if (!customer || !customer.customerNumber) return pid;

    return env === "uat"
      ? pname === "ProcessOneClick"
        ? `https://agilepoint-dev.ladpc.net.il:60140/manage/index#sections/runtimemanagement/process/detail/params(${pid},1)`
        : `https://agilepoint-dev.ladpc.net.il:60162/manage/index#sections/runtimemanagement/process/detail/params(${pid},1)`
      : `https://por${customer.customerNumber}.cityforms.co.il/manage/index#sections/runtimemanagement/process/detail/params(${pid},1)`;
  } catch {
    return null;
  }
}
