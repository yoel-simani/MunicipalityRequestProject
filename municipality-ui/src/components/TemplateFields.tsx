import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppConfig } from '../config/appConfig';
import { getMunicipalityById } from '../municipalities';
import type { TemplateFieldConfig } from '../config/municipalityConfig';
import { getAppealReasons, getSettlements, getStreets } from '../api/municipalityApi';
import type { RequestDetails } from './RequestDetailsForm';

let cachedSettlements: { id: string; nameHebrew: string; rashutId: string }[] | null = null;
const cachedStreetsByRashut = new Map<string, { id: string; nameHebrew: string; rashutId: string }[]>();
let cachedAppealReasonsByTable = new Map<string, { key: string; value: string }[]>();
let cachedTableOptionsById = new Map<string, { key: string; value: string }[]>();

// Standalone SelectField component moved to module scope to avoid remounting on parent renders
function SelectField({ value, onChange, options, placeholder = 'בחר', disabled = false, inputRef, hasError = false }: { value: string; onChange: (next: string) => void; options: { value: string; label: string; disabled?: boolean }[]; placeholder?: string; disabled?: boolean; inputRef?: (el: HTMLElement | null) => void; hasError?: boolean; }) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const searchRef = useRef<{ value: string; timeout?: number }>({ value: '' });

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => { if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => { if (!open) return; const selectedIndex = options.findIndex((opt) => opt.value === value); setHighlightedIndex(selectedIndex); }, [open, value]);

  useEffect(() => {
    if (!open || highlightedIndex < 0) return;
    const el = optionRefs.current[highlightedIndex];
    if (el && listRef.current) {
      const { top, bottom } = el.getBoundingClientRect();
      const listRect = listRef.current.getBoundingClientRect();
      if (top < listRect.top || bottom > listRect.bottom) el.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || '';
  const enabledIndexes = options.map((opt, idx) => (opt.disabled ? -1 : idx)).filter((idx) => idx !== -1);
  const moveHighlight = (direction: 1 | -1) => {
    if (enabledIndexes.length === 0) return;
    const current = highlightedIndex; const currentPos = enabledIndexes.indexOf(current);
    const nextPos = currentPos === -1 ? (direction === 1 ? 0 : enabledIndexes.length - 1) : (currentPos + direction + enabledIndexes.length) % enabledIndexes.length;
    setHighlightedIndex(enabledIndexes[nextPos]);
  };

  const handleTypeahead = (char: string) => {
    const nextValue = `${searchRef.current.value}${char}`;
    searchRef.current.value = nextValue;
    if (searchRef.current.timeout) window.clearTimeout(searchRef.current.timeout);
    searchRef.current.timeout = window.setTimeout(() => { searchRef.current.value = ''; }, 500);
    const lower = nextValue.toLowerCase();
    const matchIndex = options.findIndex((opt) => !opt.disabled && opt.label.toLowerCase().startsWith(lower));
    if (matchIndex !== -1) setHighlightedIndex(matchIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); moveHighlight(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (!open) setOpen(true); moveHighlight(-1); return; }
    if (e.key === 'Enter') { if (open && highlightedIndex >= 0) { e.preventDefault(); const opt = options[highlightedIndex]; if (opt && !opt.disabled) { onChange(opt.value); setOpen(false); } } return; }
    if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } return; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { if (!open) setOpen(true); handleTypeahead(e.key); }
  };

  return (
  <div ref={(el) => { wrapperRef.current = el; if (inputRef) inputRef(el); }} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => { e.stopPropagation(); setOpen((prev) => !prev); }}
        onKeyDown={handleKeyDown}
        style={{ width: '100%', padding: '10px 36px 10px 10px', fontSize: '16px', border: hasError ? '1px solid #d32f2f' : '1px solid #ddd', borderRadius: '25px', textAlign: 'right', backgroundColor: disabled ? '#f5f5f5' : '#fff', color: disabled ? '#999' : '#333', cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none', position: 'relative' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#6a1b9a')}
        onBlur={(e) => (e.currentTarget.style.borderColor = hasError ? '#d32f2f' : '#ddd')}
      >
        {selectedLabel || placeholder}
        <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', fontSize: '12px' }}>▼</span>
      </button>
      {open && !disabled && (
        <div ref={listRef} style={{ position: 'absolute', top: '100%', right: 0, left: 0, marginTop: '6px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '18px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', maxHeight: '260px', overflowY: 'auto', zIndex: 9999, pointerEvents: 'auto' }}>
          {options.map((opt, idx) => (
            <div key={`${opt.value}-${idx}`} ref={(el) => { optionRefs.current[idx] = el; }} onClick={() => { if (opt.disabled) return; onChange(opt.value); setOpen(false); }} onMouseEnter={() => setHighlightedIndex(idx)} style={{ padding: '10px 16px', cursor: opt.disabled ? 'not-allowed' : 'pointer', color: opt.disabled ? '#999' : '#333', backgroundColor: idx === highlightedIndex ? '#f3e5f5' : 'transparent', borderBottom: idx === options.length - 1 ? 'none' : '1px solid #eee' }}>{opt.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TemplateFieldsProps {
  initialData?: RequestDetails | null;
  selectedItem?: any;
  municipalityId?: string;
  onBack: () => void;
  onNext: (data: RequestDetails) => void;
  onSave?: (data: RequestDetails) => void;
}

export default function TemplateFields({ initialData, selectedItem, municipalityId, onBack, onNext, onSave }: TemplateFieldsProps) {
  const municipality = getMunicipalityById(municipalityId || AppConfig.municipalityId) || AppConfig.getMunicipality();
  const templateFields: TemplateFieldConfig[] = useMemo(() => {
    const pattern = Number(selectedItem?.pattern || 0);
    return municipality.templateConfig?.templates?.[pattern]?.fields || [];
  }, [municipality.templateConfig, selectedItem?.pattern]);

  const [formData, setFormData] = useState<RequestDetails>({ additionalDetails: '', fields: initialData?.fields || {} });

  useEffect(() => {
    if (!initialData) return;
    const formFieldsEmpty = !formData.fields || Object.keys(formData.fields).length === 0;
    const initialFieldsEmpty = !initialData.fields || Object.keys(initialData.fields).length === 0;
    // Only initialize from initialData when local form is still empty to avoid overwriting user input
    if (formFieldsEmpty && !initialFieldsEmpty) {
      setFormData({ additionalDetails: initialData.additionalDetails || '', fields: initialData.fields || {} });
    }
  }, [initialData]);

  // Persist form data to parent when it changes (debounced to avoid frequent parent re-renders)
  useEffect(() => {
    if (typeof onSave !== 'function') return;
    let active = true;
    const timer = setTimeout(() => {
      if (active) onSave(formData);
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [formData, onSave]);

  const settlementField = templateFields.find((f) => f.dataSource === 'settlements');
  const streetField = templateFields.find((f) => f.dataSource === 'streets');
  const appealReasonField = templateFields.find((f) => f.dataSource === 'appealReasons');

  const [settlementOptions, setSettlementOptions] = useState<{ id: string; nameHebrew: string; rashutId?: string }[]>([]);
  const [streetOptions, setStreetOptions] = useState<{ id: string; nameHebrew: string }[]>([]);
  const [appealReasonOptions, setAppealReasonOptions] = useState<{ key: string; value: string }[]>([]);
  const [tableOptionsById, setTableOptionsById] = useState<Record<string, { key: string; value: string }[]>>({});
  const [loadingTables, setLoadingTables] = useState<Record<string, boolean>>({});
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [loadingAppealReasons, setLoadingAppealReasons] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const lastStreetsRashutId = useRef<string | null>(null);

  const getSettlement = (settlementId: string) => settlementOptions.find((opt) => opt.id === settlementId);

  const fetchStreets = async (settlementId: string) => {
    setLoadingStreets(true);
    const settlement = getSettlement(settlementId);
    if (!settlement?.rashutId) {
      setStreetOptions([]);
      setLoadingStreets(false);
      return;
    }
    const cached = cachedStreetsByRashut.get(settlement.rashutId);
    if (cached && cached.length > 0) {
      setStreetOptions(cached);
      lastStreetsRashutId.current = settlement.rashutId;
      setLoadingStreets(false);
      return;
    }
    if (lastStreetsRashutId.current === settlement.rashutId && streetOptions.length > 0) {
      setLoadingStreets(false);
      return;
    }
    const result = await getStreets({ rashutId: settlement?.rashutId });
    const streets = result.success && result.data ? result.data : [];
    streets.sort((a, b) => a.nameHebrew.localeCompare(b.nameHebrew, 'he'));
    setStreetOptions(streets);
    cachedStreetsByRashut.set(settlement.rashutId, streets);
    lastStreetsRashutId.current = settlement.rashutId;
    setLoadingStreets(false);
  };

  const selectedSettlementId = settlementField ? formData.fields?.[settlementField.name] : '';

  useEffect(() => {
    if (!settlementField) return;
    if (settlementOptions.length > 0) return;
    if (cachedSettlements && cachedSettlements.length > 0) {
      setSettlementOptions(cachedSettlements);
      return;
    }
    let active = true;
    const load = async () => {
      setLoadingSettlements(true);
      const result = await getSettlements({});
      if (active) {
        const settlements = result.success && result.data ? result.data : [];
        settlements.sort((a, b) => a.nameHebrew.localeCompare(b.nameHebrew, 'he'));
        setSettlementOptions(settlements);
        cachedSettlements = settlements;
        setLoadingSettlements(false);
      }
    };
    load();
    return () => { active = false; };
  }, [settlementField, municipality.longCustomer]);

  useEffect(() => {
    if (!streetField || !selectedSettlementId) {
      setStreetOptions([]);
      return;
    }
    let active = true;
    const load = async () => {
      setLoadingStreets(true);
      const settlement = getSettlement(String(selectedSettlementId));
      if (!settlement?.rashutId) {
        setStreetOptions([]);
        setLoadingStreets(false);
        return;
      }
      const cached = cachedStreetsByRashut.get(settlement.rashutId);
      if (cached && cached.length > 0) {
        setStreetOptions(cached);
        lastStreetsRashutId.current = settlement.rashutId;
        setLoadingStreets(false);
        return;
      }
      if (lastStreetsRashutId.current === settlement.rashutId && streetOptions.length > 0) {
        setLoadingStreets(false);
        return;
      }
      const result = await getStreets({ rashutId: settlement?.rashutId });
      if (active) {
        const streets = result.success && result.data ? result.data : [];
        streets.sort((a, b) => a.nameHebrew.localeCompare(b.nameHebrew, 'he'));
        setStreetOptions(streets);
        cachedStreetsByRashut.set(settlement.rashutId, streets);
        lastStreetsRashutId.current = settlement.rashutId;
        setLoadingStreets(false);
      }
    };
    load();
    return () => { active = false; };
  }, [streetField, selectedSettlementId, settlementOptions]);

  useEffect(() => {
    if (!appealReasonField) return;
    const pattern = Number(selectedItem?.pattern || 0);
    const tableNum = pattern === 62 ? '9328' : pattern === 63 ? '9327' : pattern === 13 ? '2364' : '9326';
    let active = true;
    if (appealReasonOptions.length > 0) return;
    const cached = cachedAppealReasonsByTable.get(tableNum);
    if (cached && cached.length > 0) {
      setAppealReasonOptions(cached);
      return;
    }
    const load = async () => {
      setLoadingAppealReasons(true);
      const result = await getAppealReasons({ pInfoId: municipality.pInfoId, tableNum });
      if (active) {
        const reasons = result.success && result.data ? result.data : [];
        reasons.sort((a, b) => a.value.localeCompare(b.value, 'he'));
        setAppealReasonOptions(reasons);
        cachedAppealReasonsByTable.set(tableNum, reasons);
        setLoadingAppealReasons(false);
      }
    };
    load();
    return () => { active = false; };
  }, [appealReasonField, municipality.pInfoId, selectedItem?.pattern, appealReasonOptions.length]);

  useEffect(() => {
    const tableNums = Array.from(new Set(
      templateFields
        .map((field) => (field.dataSource?.startsWith('table:') ? field.dataSource.replace('table:', '') : null))
        .filter((value): value is string => Boolean(value))
    ));

    if (tableNums.length === 0) return;

    tableNums.forEach((tableNum) => {
      if (tableOptionsById[tableNum]?.length) return;
      const cached = cachedTableOptionsById.get(tableNum);
      if (cached && cached.length > 0) {
        setTableOptionsById((prev) => ({ ...prev, [tableNum]: cached }));
        return;
      }

      if (loadingTables[tableNum]) return;
      setLoadingTables((prev) => ({ ...prev, [tableNum]: true }));

      getAppealReasons({ pInfoId: municipality.pInfoId, tableNum })
        .then((result) => {
          const options = result.success && result.data ? result.data : [];
          options.sort((a, b) => a.value.localeCompare(b.value, 'he'));
          cachedTableOptionsById.set(tableNum, options);
          setTableOptionsById((prev) => ({ ...prev, [tableNum]: options }));
        })
        .finally(() => {
          setLoadingTables((prev) => ({ ...prev, [tableNum]: false }));
        });
    });
  }, [municipality.pInfoId, templateFields, tableOptionsById, loadingTables]);

  const handleFieldChange = (name: string, value: any, label?: string) => {
    setFormData((prev) => {
      const nextFields = { ...(prev.fields || {}), [name]: value } as Record<string, any>;
      if (label !== undefined) nextFields[`${name}__label`] = label;
      if (streetField && name === settlementField?.name) {
        nextFields[streetField.name] = '';
        nextFields[`${streetField.name}__label`] = '';
      }
      return { ...prev, fields: nextFields };
    });

    if (streetField && name === settlementField?.name) {
      setStreetOptions([]);
      if (value) fetchStreets(String(value));
    }
  };

  


  const renderField = (field: TemplateFieldConfig, options?: { compact?: boolean; maxWidth?: string; marginTop?: string }) => {
    if (!field.visible) return null;
    const value = formData.fields?.[field.name] ?? '';
    const isRequired = field.required;
    const marginBottom = options?.compact ? '10px' : '8px';
    const containerStyle: React.CSSProperties = { marginBottom, width: '100%' };
    if (options?.marginTop) containerStyle.marginTop = options.marginTop;
    if (options?.maxWidth) containerStyle.maxWidth = options.maxWidth;

    const label = (
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{field.label} {isRequired && <span style={{ color: '#d32f2f' }}>*</span>}</label>
    );

    if (field.type === 'textarea') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <textarea ref={(el) => { fieldRefs.current[field.name] = el as HTMLElement | null; }} value={value} onChange={(e) => handleFieldChange(field.name, e.target.value)} rows={5} style={{ width: '100%', padding: '10px', fontSize: '14px', border: fieldErrors[field.name] ? '1px solid #d32f2f' : '1px solid #ddd', borderRadius: '4px', textAlign: 'right', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }} />
          {fieldErrors[field.name] && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors[field.name]}</div>}
        </div>
      );
    }

    if (field.type === 'select' && field.dataSource === 'settlements') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField hasError={!!fieldErrors[field.name]} inputRef={(el) => { fieldRefs.current[field.name] = el; }} value={String(value || '')} onChange={(next) => { const label = settlementOptions.find((opt) => opt.id === next)?.nameHebrew || ''; handleFieldChange(field.name, next, label); }} options={[{ value: '', label: 'בחר' }, ...(loadingSettlements ? [{ value: '__loading__', label: 'טוען...', disabled: true }] : settlementOptions.map((opt) => ({ value: opt.id, label: opt.nameHebrew })))]} />
          {fieldErrors[field.name] && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors[field.name]}</div>}
        </div>
      );
    }

    if (field.type === 'select' && field.dataSource === 'streets') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField hasError={!!fieldErrors[field.name]} inputRef={(el) => { fieldRefs.current[field.name] = el; }} value={String(value || '')} onChange={(next) => { const label = streetOptions.find((opt) => opt.id === next)?.nameHebrew || ''; handleFieldChange(field.name, next, label); }} disabled={!selectedSettlementId} options={[{ value: '', label: 'בחר' }, ...(loadingStreets ? [{ value: '__loading__', label: 'טוען...', disabled: true }] : streetOptions.map((opt) => ({ value: opt.id, label: opt.nameHebrew })))]} />
          {fieldErrors[field.name] && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors[field.name]}</div>}
        </div>
      );
    }

    if (field.type === 'select' && field.dataSource === 'appealReasons') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField hasError={!!fieldErrors[field.name]} inputRef={(el) => { fieldRefs.current[field.name] = el; }} value={String(value || '')} onChange={(next) => { const label = appealReasonOptions.find((opt) => opt.key === next)?.value || ''; handleFieldChange(field.name, next, label); }} options={[{ value: '', label: 'בחר' }, ...(loadingAppealReasons ? [{ value: '__loading__', label: 'טוען...', disabled: true }] : appealReasonOptions.map((opt) => ({ value: opt.key, label: opt.value })))]} />
          {fieldErrors[field.name] && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors[field.name]}</div>}
        </div>
      );
    }

    if (field.type === 'select' && field.dataSource?.startsWith('table:')) {
      const tableNum = field.dataSource.replace('table:', '');
      const tableOptions = tableOptionsById[tableNum] || [];
      const loadingTable = loadingTables[tableNum];
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField hasError={!!fieldErrors[field.name]} inputRef={(el) => { fieldRefs.current[field.name] = el; }} value={String(value || '')} onChange={(next) => { const label = tableOptions.find((opt) => opt.key === next)?.value || ''; handleFieldChange(field.name, next, label); }} options={[{ value: '', label: 'בחר' }, ...(loadingTable ? [{ value: '__loading__', label: 'טוען...', disabled: true }] : tableOptions.map((opt) => ({ value: opt.key, label: opt.value })))]} />
          {fieldErrors[field.name] && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors[field.name]}</div>}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField hasError={!!fieldErrors[field.name]} inputRef={(el) => { fieldRefs.current[field.name] = el; }} value={String(value || '')} onChange={(next) => { const label = field.options?.find((opt) => opt.value === next)?.label || ''; handleFieldChange(field.name, next, label); }} options={[{ value: '', label: 'בחר' }, ...(field.options || []).map((opt) => ({ value: opt.value, label: opt.label }))]} />
          {fieldErrors[field.name] && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors[field.name]}</div>}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} style={containerStyle}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: fieldErrors[field.name] ? '#d32f2f' : '#333' }}>
            <input ref={(el) => { fieldRefs.current[field.name] = el as HTMLElement | null; }} type="checkbox" checked={value === true} onChange={(e) => handleFieldChange(field.name, e.target.checked)} style={{ marginLeft: '8px' }} />
            {field.label} {isRequired && <span style={{ color: '#d32f2f' }}>*</span>}
          </label>
          {fieldErrors[field.name] && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors[field.name]}</div>}
        </div>
      );
    }

    return (
      <div key={field.name} style={containerStyle}>
        {label}
          <input ref={(el) => { fieldRefs.current[field.name] = el as HTMLElement | null; }} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={value} onChange={(e) => handleFieldChange(field.name, e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '14px', border: fieldErrors[field.name] ? '1px solid #d32f2f' : '1px solid #ddd', borderRadius: '4px', textAlign: 'right' }} />
        {fieldErrors[field.name] && <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{fieldErrors[field.name]}</div>}
      </div>
    );
  };

  const addressFieldNames = new Set(['ddlYeshuv','ddlRechov','txtMisparBayit','txtOtBayit','txtMisparDira','txtKnisa','txtTeDoar','txtMikud']);
  const addressFields = templateFields.filter((field) => addressFieldNames.has(field.name));
  const otherFields = templateFields.filter((field) => !addressFieldNames.has(field.name));
  const addressFieldMap = Object.fromEntries(addressFields.map((field) => [field.name, field]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    const newFieldErrors: Record<string, string> = {};
    templateFields.forEach((f) => {
      if (!f.visible || !f.required) return;
      const val = formData.fields?.[f.name];
      if (f.type === 'checkbox') {
        if (val !== true) newFieldErrors[f.name] = 'שדה חובה';
      } else {
        if (val === undefined || val === null || String(val).trim() === '' || String(val) === '__loading__') {
          newFieldErrors[f.name] = 'שדה חובה';
        } else if (f.validation?.minLength && typeof val === 'string' && val.trim().length < (f.validation.minLength || 0)) {
          newFieldErrors[f.name] = `מינימום ${f.validation.minLength}`;
        }
      }
    });

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      // focus first missing field
      const firstMissing = templateFields.find((f) => !!newFieldErrors[f.name]);
      if (firstMissing) {
        const refEl = fieldRefs.current[firstMissing.name];
        if (refEl && typeof (refEl as HTMLElement).focus === 'function') {
          (refEl as HTMLElement).focus();
        }
      }
      // scroll to top of the form to show the error
      const el = document.querySelector('[dir="rtl"] form');
      if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setFieldErrors({});
    onNext({ additionalDetails: '', fields: formData.fields });
  };

  const renderAddressField = (field?: TemplateFieldConfig, maxWidth?: string) => field ? (<div style={{ minWidth: 0, width: '100%', maxWidth: maxWidth || 'none' }}>{renderField(field)}</div>) : null;

  return (
    <div dir="rtl" lang="he" style={{ padding: '10px 12px 20px', width: '100%', boxSizing: 'border-box', margin: 0 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          {otherFields.map((field) => renderField(field, { compact: true, maxWidth: ['isVehicleOwner', 'cmbSibatIrur'].includes(field.name) ? '780px' : undefined, marginTop: field.name === 'cmbSibatIrur' ? '6px' : undefined }))}
          {addressFields.length > 0 && (
            <div style={{ marginTop: '32px', marginBottom: '10px' }}>
              <div style={{ marginBottom: '14px', fontSize: '16px', fontWeight: 'bold', color: '#333', textAlign: 'right' }}>כתובת למשלוח תשובה</div>
              <div style={{ display: 'grid', gridTemplateColumns: '360px 410px', columnGap: '8px', rowGap: '14px', marginBottom: '14px', justifyItems: 'start', width: 'fit-content', maxWidth: '100%' }}>
                {renderAddressField(addressFieldMap.ddlYeshuv)}
                {renderAddressField(addressFieldMap.ddlRechov)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 220px)', columnGap: '48px', rowGap: '18px' }}>
                {renderAddressField(addressFieldMap.txtMikud, '220px')}
                {renderAddressField(addressFieldMap.txtTeDoar, '220px')}
                {renderAddressField(addressFieldMap.txtKnisa, '220px')}
                {renderAddressField(addressFieldMap.txtMisparBayit, '220px')}
                {renderAddressField(addressFieldMap.txtMisparDira, '220px')}
                {renderAddressField(addressFieldMap.txtOtBayit, '220px')}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center', marginTop: '32px' }}>
          <button type="button" onClick={onBack} style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#d3d3d3', color: 'white', border: 'none', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b0b0b0')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d3d3d3')}>חזור</button>

          <button type="submit" style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#9b59b6', color: 'white', border: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7d3c98')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#9b59b6')}>המשך</button>
        </div>
      </form>
    </div>
  );
}
