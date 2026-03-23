function getBaseUrl() {
  return "/api";
}

export async function fetchCustomerMap(env) {
  const res = await fetch(`${getBaseUrl()}/customers/map`, {
    headers: {
      "X-DB-ENV": env, // ה-Header לא ישפיע, אבל נשאיר אותו לעקביות
    },
  });
  if (!res.ok) throw new Error(`שגיאה בקבלת לקוחות: ${res.status}`);
  return res.json(); // פורמט: { "813510": {customerNumber: ..., rashutPark: ...}, ... }
}
