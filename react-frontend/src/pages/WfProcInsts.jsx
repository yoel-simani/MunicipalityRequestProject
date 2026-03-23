import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import SearchForm from "../components/SearchForm";
import TopNav from "../components/TopNav";
import AppLayout from "../components/AppLayout";
import DynamicTable from "../components/DynamicTable";
import {
  fetchDistinctApplNames,
  fetchProcInstsByApplNameAndDate,
  fetchProcInstsByDate,
} from "../api/wfProcInstApi";

function getInitialDate() {
  return new Date(Date.now() - 5 * 60000);
}

export default function WfProcInsts() {
  const [procInsts, setProcInsts] = useState([]);
  const [env, setEnv] = useState("sqlserver");
  const [formData, setFormData] = useState({
    fromDate: getInitialDate(),
    pname: "OneClickP",
  });
  const [applOptions, setApplOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    fetchDistinctApplNames(env)
      .then((names) => {
        setApplOptions(names);
        const defaultOpt = names.find((name) => name === "OneClickP");
        setFormData((prev) => ({
          ...prev,
          pname: defaultOpt || "",
        }));
      })
      .catch((err) =>
        toast.error(`שגיאה בטעינת רשימת אפליקציות: ${err.message}`)
      );
  }, [env]);

  useEffect(() => {
    setProcInsts([]);
    setToastShown(false);
  }, [env]);

  const loadData = () => {
    setIsLoading(true);
    setToastShown(false);

    const { pname, fromDate } = formData;
    const fetchFunc = pname
      ? fetchProcInstsByApplNameAndDate(env, pname, fromDate)
      : fetchProcInstsByDate(env, fromDate);

    fetchFunc
      .then((data) => {
        // מיון הנתונים לפי sourceDb (עולה) ואז startedDate (יורד)
        const sortedData = data.sort((a, b) => {
          const sourceDbCompare = (a.sourceDb || "").localeCompare(
            b.sourceDb || ""
          );
          if (sourceDbCompare !== 0) {
            return sourceDbCompare; // מיון לפי sourceDb בסדר אלפביתי
          }
          const dateA = new Date(a.startedDate);
          const dateB = new Date(b.startedDate);
          return dateB - dateA; // מיון לפי startedDate בסדר יורד
        });
        setProcInsts(sortedData);
        if (!toastShown) {
          toast.success("✅ הנתונים נטענו בהצלחה!");
          setToastShown(true);
        }
      })
      .catch((err) => toast.error(`שגיאה בטעינת נתונים: ${err.message}`))
      .finally(() => setIsLoading(false));
  };

  // פונקציה לבניית הלינק למזהה תהליך
  const buildProcessLink = (procInstName, procInstId, sourceDb) => {
    try {
      // טיפול במקרה שבו sourceDb הוא null או לא מוגדר
      if (env === "sqlserver") {
        // במקרה של סביבת sqlserver, השתמש בברירת מחדל
        if (procInstName.split("-")[0] === "ProcessOneClick") {
          return `https://agilepoint-dev.ladpc.net.il:60140/manage/index#sections/runtimemanagement/process/detail/params(${procInstId},1)`;
        } else {
          return `https://agilepoint-dev.ladpc.net.il:60162/manage/index#sections/runtimemanagement/process/detail/params(${procInstId},1)`;
        }
      }

      // בדיקה אם sourceDb הוא מסביבת sqlserver
      if (sourceDb === "AP_Workflow_DB") {
        if (procInstName.split("-")[0] === "ProcessOneClick") {
          return `https://agilepoint-dev.ladpc.net.il:60140/manage/index#sections/runtimemanagement/process/detail/params(${procInstId},1)`;
        } else {
          return `https://agilepoint-dev.ladpc.net.il:60162/manage/index#sections/runtimemanagement/process/detail/params(${procInstId},1)`;
        }
      }

      // בדיקה אם sourceDb הוא מסביבת sqlserverprodX והוצאת המספר X
      const match = sourceDb.match(/AP_Workflow_DB_(\d+)/);

      if (match && match[1]) {
        // במקרה של סביבה sqlserverprodX
        return `https://por${match[1]}.cityforms.co.il/manage/index#sections/runtimemanagement/process/detail/params(${procInstId},1)`;
      }

      // ברירת מחדל אם לא תואם כלום
      return null;
    } catch (e) {
      // במקרה של שגיאה כלשהי, מחזירים null
      return null;
    }
  };

  return (
    <>
      <TopNav />
      <AppLayout title="📋 רשימת תהליכים (WF_PROC_INSTS)">
        <SearchForm
          env={env}
          setEnv={setEnv}
          formData={formData}
          setFormData={setFormData}
          selectOptions={{ pnames: applOptions, loadingPnames: isLoading }}
          envOptions={[
            { value: "sqlserver", label: "טסטים" },
            { value: "sqlserverprod_all", label: "כל סביבות הייצור" },
            { value: "sqlserverprod140", label: "ראשלצ 140" },
            { value: "sqlserverprod146", label: "דימונה 146" },
            { value: "sqlserverprod154", label: "אשקלון 154" },
            { value: "sqlserverprod185", label: "מגדל העמק 185" },
            { value: "sqlserverprod188", label: "אור עקיבא 188" },
            { value: "sqlserverprod193", label: "כרמיאל 193" },
            { value: "sqlserverprod231", label: "עומר 231" },
            { value: "sqlserverprod256", label: "מודיעין 256" },
            { value: "sqlserverprod277", label: "גבעת זאב 277" },
            { value: "sqlserverprod361", label: "שדות נגב 361" },
            { value: "sqlserverprod370", label: "מגדל-תפן 370" },
            { value: "sqlserverprod809", label: "באקה אל גרביה 809" },
            { value: "sqlserverprod939", label: "חריש 939" },
          ]}
          onSubmit={loadData}
          isLoading={isLoading}
        />

        <hr />
        <DynamicTable
          pageKey="wf"
          data={procInsts}
          env={env}
          buildProcessLink={buildProcessLink}
        />
        <ToastContainer position="top-center" autoClose={3000} />
      </AppLayout>
    </>
  );
}
