import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import Select, { components } from "react-select";
import SearchForm from "../components/SearchForm";
import DynamicTable from "../components/DynamicTable";
import AppLayout from "../components/AppLayout";
import TopNav from "../components/TopNav";
import {
  fetchPnames,
  fetchMethodNames,
  searchLogs,
} from "../api/processLogApi";
import { fetchCustomerMap } from "../api/customerApi";

const MenuList = (props) => {
  const ref = useRef(null);
  useEffect(() => {
    if (
      props.selectProps.menuIsOpen &&
      ref.current &&
      props.selectProps.value
    ) {
      const index = props.options.findIndex(
        (option) => option.value === props.selectProps.value.value
      );
      if (index >= 0) {
        const item = ref.current.querySelector(
          "[id^='react-select-'][role='option']"
        );
        const itemHeight = item ? item.offsetHeight : 35;
        if (index >= 0 && ref.current?.children[index]) {
          ref.current.children[index].scrollIntoView({ block: "nearest" });
        }
      }
    }
  }, [props.selectProps.menuIsOpen]);

  return (
    <components.MenuList {...props} innerRef={ref}>
      {props.children}
    </components.MenuList>
  );
};

function getInitialDate() {
  return new Date(Date.now() - 5 * 60000);
}

export default function Logs() {
  const [env, setEnv] = useState("prod");
  const [form, setForm] = useState({
    pname: "ProcessOneClickP",
    methodName: "setResidentApplicationBTDWS",
    fromDate: getInitialDate(),
    limit: 10,
    pseq: "",
    pid: "",
  });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [results, setResults] = useState([]);
  const [pnames, setPnames] = useState([]);
  const [methodNames, setMethodNames] = useState([]);
  const [loadingPnames, setLoadingPnames] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [rashutMap, setRashutMap] = useState({});
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    setLoadingPnames(true);
    fetchPnames(env)
      .then(setPnames)
      .catch((err) => toast.error(`שגיאה בטעינת pnames: ${err.message}`))
      .finally(() => setLoadingPnames(false));
  }, [env]);

  useEffect(() => {
    setResults([]);
    setTotalPages(0);
    setPage(0);
  }, [env]);

  useEffect(() => {
    if (!form.pname) {
      setMethodNames([]);
      return;
    }
    setLoadingMethods(true);
    fetchMethodNames(form.pname, env)
      .then((methods) => {
        setMethodNames(methods);
        setForm((prevForm) => ({
          ...prevForm,
          methodName: methods.includes(prevForm.methodName)
            ? prevForm.methodName
            : methods[0] || "",
        }));
      })
      .catch((err) => toast.error(`שגיאה בטעינת methodNames: ${err.message}`))
      .finally(() => setLoadingMethods(false));
  }, [form.pname, env]);

  useEffect(() => {
    fetchCustomerMap(env)
      .then((map) => {
        const converted = Object.values(map).reduce((acc, obj) => {
          acc[obj.rashutPark?.toString()] = obj;
          return acc;
        }, {});
        setRashutMap(converted);
      })
      .catch(() => toast.error("❌ שגיאה בטעינת לקוחות מהשרת"));
  }, [env]);

  const search = async (pageOverride = 0) => {
    setLoadingSearch(true);

    const params = {
      pname: form.pname,
      methodName: form.methodName,
      fromDate: form.fromDate.toISOString(),
      limit: form.limit,
      page: pageOverride,
    };
    if (form.pseq.trim() !== "") params.pseq = form.pseq.trim();
    if (form.pid.trim() !== "") params.pid = form.pid.trim();

    try {
      const data = await searchLogs(params, env);
      setResults(data.content);
      setTotalPages(data.totalPages);
      setPage(pageOverride);

      // ✅ הצגת toast רק אם לא הוצג כבר
      if (!toastShown) {
        if (data.content.length === 0) {
          toast.info("ℹ️ לא נמצאו תוצאות.");
        } else {
          toast.success("✅ החיפוש הושלם בהצלחה!");
        }
        setToastShown(true);
      }
    } catch (err) {
      toast.error(`❌ קרתה שגיאה: ${err.message}`);
    } finally {
      setLoadingSearch(false);
    }
  };

  const buildPniaLink = (pseq, reqString, env) => {
    try {
      if (!reqString) return pseq;
      const customerMatch = reqString.match(/"Customer":"?(\d+)"?/);
      if (!customerMatch) {
        return pseq;
      }
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
        autoUserPass: isUat ? "Ruthr1122" : "Ruthr1122",
        application: "MGA2",
        page: "3259",
        gApPniya: pseq,
        userIP: "127.0.0.1",
      });

      return `${baseUrl}?${params.toString()}`;
    } catch {
      return null;
    }
  };

  const buildProcessLink = (pname, pid, reqString, env) => {
    try {
      if (!reqString) return pid;

      const customerMatch = reqString.match(/"Customer":"?(\d+)"?/);
      if (!customerMatch) {
        return pid;
      }
      const customerId = parseInt(customerMatch[1], 10);
      // אם אין בכלל Customer – להחזיר null
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
  };

  return (
    <>
      <TopNav />
      <AppLayout title="🔍 חיפוש לוגים">
        <SearchForm
          env={env}
          setEnv={setEnv}
          formData={form}
          setFormData={setForm}
          selectOptions={{
            pnames,
            loadingPnames,
            methodNames,
            loadingMethods,
          }}
          envOptions={[
            { value: "prod", label: "ייצור" },
            { value: "uat", label: "UAT" },
          ]}
          onSubmit={() => search(0)}
          isLoading={loadingSearch}
        />

        <hr />
        <DynamicTable
          pageKey="logs"
          data={results}
          env={env}
          buildPniaLink={buildPniaLink}
          buildProcessLink={buildProcessLink}
        />
        <ToastContainer position="top-center" autoClose={3000} />
      </AppLayout>
    </>
  );
}
