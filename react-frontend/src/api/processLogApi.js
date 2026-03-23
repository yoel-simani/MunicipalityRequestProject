function getBaseUrl(env) {
  return "/api"; // נתיב קבוע ללא תלות ב-env
}

export async function fetchPnames(env) {
  const res = await fetch(`${getBaseUrl()}/process-logs/pnames`, {
    headers: {
      "X-DB-ENV": env, // הוספת ה-Header עם המשתנה הסביבתי
    },
  });
  if (!res.ok) throw new Error(`Error fetching pnames: ${res.status}`);
  return res.json();
}

export async function fetchMethodNames(pname, env) {
  const res = await fetch(
    `${getBaseUrl()}/process-logs/methodNames/by-pname?pname=${encodeURIComponent(
      pname
    )}`,
    {
      headers: {
        "X-DB-ENV": env, // הוספת ה-Header עם המשתנה הסביבתי
      },
    }
  );
  if (!res.ok) throw new Error(`Error fetching method names: ${res.status}`);
  return res.json();
}

export async function searchLogs(params, env) {
  const urlParams = new URLSearchParams(params);
  const res = await fetch(
    `${getBaseUrl()}/process-logs/search/with-paging?${urlParams.toString()}`,
    {
      headers: {
        "X-DB-ENV": env, // הוספת ה-Header עם המשתנה הסביבתי
      },
    }
  );
  if (!res.ok) throw new Error(`Error searching logs: ${res.status}`);
  return res.json();
}
