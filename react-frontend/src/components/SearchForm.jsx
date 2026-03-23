import React from "react";
import Select from "react-select";
import ReactDatePicker, { registerLocale } from "react-datepicker";
import he from "date-fns/locale/he";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("he", he);

const SearchForm = ({
  env = "prod",
  setEnv = () => {},
  formData = {},
  setFormData = () => {},
  selectOptions = {},
  onSubmit = () => {},
  isLoading = false,
  envOptions = [],
}) => {
  const pnameOptions =
    selectOptions.pnames?.map((name) => ({
      label: name,
      value: name,
    })) || [];

  const methodOptions =
    selectOptions.methodNames?.map((name) => ({
      label: name,
      value: name,
    })) || [];

  const selectedPname = pnameOptions.find(
    (opt) => opt.value === formData.pname
  );

  const selectedMethod = methodOptions.find(
    (opt) => opt.value === formData.methodName
  );

  return (
    <form
      className="row g-3 align-items-end mb-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      dir="rtl"
    >
      {/* סביבה */}
      <div className="col-md-3">
        <label className="form-label">סביבה</label>
        <select
          className="form-select"
          value={env}
          onChange={(e) => setEnv(e.target.value)}
        >
          {envOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* תאריך */}
      <div className="col-md-3">
        <label className="form-label">מתאריך</label>
        <ReactDatePicker
          selected={formData.fromDate}
          onChange={(date) => setFormData({ ...formData, fromDate: date })}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          timeCaption="שעה"
          dateFormat="HH:mm dd-MM-yyyy"
          locale="he"
          className="form-control"
          maxDate={new Date()}
        />
      </div>

      {/* אפליקציה */}
      <div className="col-md-3">
        <label className="form-label">אפליקציה</label>
        <Select
          isLoading={selectOptions.loadingPnames}
          options={pnameOptions}
          value={selectedPname || null}
          onChange={(selected) =>
            setFormData({
              ...formData,
              pname: selected ? selected.value : "",
              methodName: selected ? "" : formData.methodName,
            })
          }
          isClearable
          placeholder="בחר אפליקציה..."
          menuShouldScrollIntoView={false}
        />
      </div>

      {/* פונקציה */}
      {formData.pname && selectOptions.methodNames && (
        <div className="col-md-3">
          <label className="form-label">פונקציה</label>
          <Select
            isLoading={selectOptions.loadingMethods}
            options={methodOptions}
            value={selectedMethod || null}
            onChange={(selected) =>
              setFormData({
                ...formData,
                methodName: selected ? selected.value : "",
              })
            }
            isClearable
            placeholder="בחר פונקציה..."
            menuShouldScrollIntoView={false}
          />
        </div>
      )}

      {/* מספר פנייה */}
      {formData.pseq !== undefined && (
        <div className="col-md-3">
          <label className="form-label">מספר פנייה</label>
          <input
            type="text"
            className="form-control"
            value={formData.pseq}
            onChange={(e) => setFormData({ ...formData, pseq: e.target.value })}
          />
        </div>
      )}

      {/* מספר תהליך */}
      {formData.pid !== undefined && (
        <div className="col-md-3">
          <label className="form-label">מספר תהליך</label>
          <input
            type="text"
            className="form-control"
            value={formData.pid}
            onChange={(e) => setFormData({ ...formData, pid: e.target.value })}
          />
        </div>
      )}

      {/* מגבלה */}
      {formData.limit !== undefined && (
        <div className="col-md-3">
          <label className="form-label">מגבלה</label>
          <input
            type="number"
            min="1"
            max="100"
            className="form-control"
            value={formData.limit}
            onChange={(e) =>
              setFormData({ ...formData, limit: Number(e.target.value) })
            }
          />
        </div>
      )}

      {/* כפתור חיפוש */}
      <div className="col-md-2">
        <button
          type="submit"
          className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? "⏳ מחפש..." : "🔍 חפש"}
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
