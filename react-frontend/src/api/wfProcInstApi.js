import axios from "axios";

// פונקציה לבניית headers בהתאם לסביבה
function buildHeaders(env) {
  const headers = {
    "Content-Type": "application/json",
    "X-DB-ENV":
      env === "sqlserverprod_all"
        ? "sqlserverprod_all"
        : env.startsWith("sqlserverprod")
        ? "sqlserverprod"
        : env,
  };

  if (env.startsWith("sqlserverprod") && env !== "sqlserverprod_all") {
    const match = env.match(/sqlserverprod(\d+)/);
    headers["X-DB-NAME"] = match
      ? `AP_Workflow_DB_${match[1]}`
      : "AP_Workflow_DB_231";
  }

  return headers;
}

// CRUD בסיסי על WfProcInst
export async function fetchAllProcInsts(env = "prod") {
  const response = await axios.get("/api/wf-proc-insts", {
    headers: buildHeaders(env),
    params: { env },
  });
  return response.data;
}

export async function fetchProcInstById(id, env = "prod") {
  const response = await axios.get(`/api/wf-proc-insts/${id}`, {
    headers: buildHeaders(env),
    params: { env },
  });
  return response.data;
}

export async function createProcInst(procInst) {
  const response = await axios.post("/api/wf-proc-insts", procInst, {
    headers: buildHeaders(procInst.env || "prod"),
  });
  return response.data;
}

export async function updateProcInst(id, procInst) {
  const response = await axios.put(`/api/wf-proc-insts/${id}`, procInst, {
    headers: buildHeaders(procInst.env || "prod"),
  });
  return response.data;
}

export async function deleteProcInst(id, env = "prod") {
  const response = await axios.delete(`/api/wf-proc-insts/${id}`, {
    headers: buildHeaders(env),
    params: { env },
  });
  return response.data;
}

// שליפות עם סינון ותמיכה ב-env
export async function fetchProcInstsByDate(env, fromDate) {
  const response = await axios.get("/api/wf-proc-insts/by-date", {
    headers: buildHeaders(env),
    params: {
      env,
      fromDate: fromDate.toISOString(),
    },
  });
  return response.data;
}

export async function fetchProcInstsByApplName(env, applName) {
  const response = await axios.get("/api/wf-proc-insts/by-appl-name", {
    headers: buildHeaders(env),
    params: { env, applName },
  });
  return response.data;
}

export async function fetchDistinctApplNames(env) {
  const response = await axios.get("/api/wf-proc-insts/distinct-appl-names", {
    headers: buildHeaders(env),
    params: { env },
  });
  return response.data;
}

export async function fetchProcInstsByApplNameAndDate(env, applName, fromDate) {
  const response = await axios.get("/api/wf-proc-insts/by-appl-name-and-date", {
    headers: buildHeaders(env),
    params: {
      env,
      applName,
      fromDate: fromDate.toISOString(),
    },
  });
  return response.data;
}
