import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const columnDefsByPage = {
  logs: [
    {
      header: "תאריך",
      field: "ldate",
      type: "date",
      filterable: true,
      sortable: true,
      width: "18%",
      cellRenderer: ({ value }) => {
        if (!value) return "";
        return formatInTimeZone(value, "UTC", "HH:mm dd-MM-yyyy");
      },
    },
    {
      header: "אפליקציה",
      field: "pname",
      type: "text",
      filterable: true,
      sortable: true,
      width: "18%",
      cellRenderer: ({ value }) => value || "",
    },
    {
      header: "פונקציה",
      field: "methodName",
      type: "text",
      filterable: true,
      sortable: true,
      width: "27%",
      valueFormatter: ({ value }) => value ?? "",
    },
    {
      header: "מספר פנייה",
      field: "pseq",
      type: "link",
      filterable: true,
      sortable: true,
      width: "10%",
      valueFormatter: ({ value }) => value ?? "",
      customLinkBuilder: (row, env, buildPniaLink) =>
        buildPniaLink?.(row.pseq, row.req, env),
    },
    {
      header: "מספר תהליך",
      field: "pid",
      type: "link",
      filterable: true,
      sortable: true,
      valueFormatter: ({ value }) => value ?? "",
      customLinkBuilder: (row, env, buildProcessLink) =>
        buildProcessLink?.(row.pname, row.pid, row.req, env),
    },
  ],

  wf: [
    {
      header: "מקור נתונים",
      field: "sourceDb",
      type: "text",
      filterable: true,
      sortable: true,
      width: "17%",
      valueFormatter: ({ value }) => value ?? "",
    },
    {
      header: "תאריך פתיחה",
      field: "startedDate",
      type: "date",
      filterable: true,
      sortable: true,
      width: "15%",
      cellRenderer: ({ value }) => {
        if (!value) return "";
        return formatInTimeZone(value, "UTC", "HH:mm dd-MM-yyyy");
      },
    },
    {
      header: "מזהה",
      field: "procInstId",
      type: "link", // שונה מ-"text" ל-"link"
      filterable: true,
      sortable: true,
      width: "31%",
      valueFormatter: ({ value }) => value ?? "",
      customLinkBuilder: (row, env, buildProcessLink) =>
        buildProcessLink?.(row.procInstName, row.procInstId, row.sourceDb), // קריאה ל-buildProcessLink לפי הלוגיקה שלך
    },
    {
      header: "שם",
      field: "procInstName",
      type: "text",
      filterable: true,
      sortable: true,
      width: "30%",
      valueFormatter: ({ value }) => value ?? "",
    },
    {
      header: "סטטוס",
      field: "status",
      type: "text",
      filterable: true,
      sortable: true,
      width: "10%",
      valueFormatter: ({ value }) => value ?? "",
    },
    {
      header: "נמצא בשלב",
      field: "displayNameTokenPos3",
      type: "text",
      filterable: true,
      sortable: true,
      width: "15%",
      valueFormatter: ({ value }) => value ?? "",
    },
    {
      header: "תאריך סטטוס",
      field: "lastTokenPos3Date",
      type: "date",
      filterable: true,
      sortable: true,
      width: "15%",
      cellRenderer: ({ value }) => {
        if (!value) return "";
        return formatInTimeZone(value, "UTC", "HH:mm dd-MM-yyyy");
      },
    },
  ],

  users: [
    {
      header: "שם משתמש",
      field: "username",
      type: "text",
      filterable: true,
      sortable: true,
      valueFormatter: ({ value }) => value ?? "",
    },
    {
      header: "אימייל",
      field: "email",
      type: "text",
      filterable: true,
      sortable: true,
      valueFormatter: ({ value }) => value ?? "",
    },
    {
      header: "נרשם בתאריך",
      field: "createdAt",
      type: "date",
      filterable: true,
      sortable: true,
      width: "170px",
    },
  ],
};
