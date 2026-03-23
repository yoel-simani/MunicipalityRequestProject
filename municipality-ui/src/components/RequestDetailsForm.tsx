import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppConfig } from '../config/appConfig';
import { getMunicipalityById } from '../municipalities';
import type { TemplateFieldConfig } from '../config/municipalityConfig';
import { getAppealReasons, getSettlements, getStreets } from '../api/municipalityApi';

let cachedSettlements: { id: string; nameHebrew: string; rashutId: string }[] | null = null;
let cachedAppealReasonsByTable = new Map<string, { key: string; value: string }[]>();
let cachedTableOptionsById = new Map<string, { key: string; value: string }[]>();
const cachedStreetsByRashut = new Map<string, { id: string; nameHebrew: string; rashutId: string }[]>();

interface RequestDetailsFormProps {
  onBack: () => void;
  onNext: (data: RequestDetails) => void;
  initialData?: RequestDetails | null;
  selectedItem?: any;
  municipalityId?: string;
  showFields?: boolean;
  showAdditionalDetails?: boolean;
  requireAdditionalDetails?: boolean;
}

export interface RequestDetails {
  additionalDetails: string;
  selectedTav?: string | null;
  fields?: Record<string, any>;
}

export default function RequestDetailsForm({
  onBack,
  onNext,
  initialData,
  selectedItem,
  municipalityId,
  showFields = true,
  showAdditionalDetails = true,
  requireAdditionalDetails = false
}: RequestDetailsFormProps) {
  const municipality = getMunicipalityById(municipalityId || AppConfig.municipalityId) || AppConfig.getMunicipality();
  const templateFields: TemplateFieldConfig[] = useMemo(() => {
    const pattern = Number(selectedItem?.pattern || 0);
    return municipality.templateConfig?.templates?.[pattern]?.fields || [];
  }, [municipality.templateConfig, selectedItem?.pattern]);

  const [formData, setFormData] = useState<RequestDetails>({
    additionalDetails: initialData?.additionalDetails || '',
    fields: initialData?.fields || {}
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!initialData) {
      return;
    }
    setFormData({
      additionalDetails: initialData.additionalDetails || '',
      fields: initialData.fields || {}
    });
  }, [initialData]);

  const settlementField = templateFields.find((f) => f.dataSource === 'settlements');
  const streetField = templateFields.find((f) => f.dataSource === 'streets');
  const appealReasonField = templateFields.find((f) => f.dataSource === 'appealReasons');

  const [settlementOptions, setSettlementOptions] = useState<{ id: string; nameHebrew: string }[]>([]);
  const [streetOptions, setStreetOptions] = useState<{ id: string; nameHebrew: string }[]>([]);
  const [appealReasonOptions, setAppealReasonOptions] = useState<{ key: string; value: string }[]>([]);
  const [appealTableNum, setAppealTableNum] = useState<string | null>(null);
  const [tableOptionsById, setTableOptionsById] = useState<Record<string, { key: string; value: string }[]>>({});
  const [loadingTables, setLoadingTables] = useState<Record<string, boolean>>({});
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [loadingAppealReasons, setLoadingAppealReasons] = useState(false);
  const lastStreetsRashutId = useRef<string | null>(null);
  const getSettlement = (settlementId: string) =>
    settlementOptions.find((opt) => opt.id === settlementId);

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
    const result = await getStreets({
      rashutId: settlement?.rashutId,
    });
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
    return () => {
      active = false;
    };
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
      const result = await getStreets({
        rashutId: settlement?.rashutId,
      });
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
    return () => {
      active = false;
    };
  }, [streetField, selectedSettlementId, settlementOptions]);

  useEffect(() => {
    if (!appealReasonField) return;
    const pattern = Number(selectedItem?.pattern || 0);
    const tableNum = pattern === 62 ? '9328' : pattern === 63 ? '9327' : pattern === 13 ? '2364' : '9326';
    if (appealTableNum !== tableNum) {
      setAppealTableNum(tableNum);
      setAppealReasonOptions([]);
    }
    if (appealReasonOptions.length > 0 && appealTableNum === tableNum) return;
    const cached = cachedAppealReasonsByTable.get(tableNum);
    if (cached && cached.length > 0) {
      setAppealReasonOptions(cached);
      return;
    }
    let active = true;
    const load = async () => {
      setLoadingAppealReasons(true);
      const result = await getAppealReasons({
        pInfoId: municipality.pInfoId,
          tableNum
      });
      if (active) {
        const reasons = result.success && result.data ? result.data : [];
        reasons.sort((a, b) => a.value.localeCompare(b.value, 'he'));
        setAppealReasonOptions(reasons);
        cachedAppealReasonsByTable.set(tableNum, reasons);
        setLoadingAppealReasons(false);
      }
    };
    load();
    return () => {
      active = false;
    };
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

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      additionalDetails: e.target.value
    });
  };

  const handleFieldChange = (name: string, value: any, label?: string) => {
    setFormData((prev) => {
      const nextFields = {
        ...(prev.fields || {}),
        [name]: value
      } as Record<string, any>;

      if (label !== undefined) {
        nextFields[`${name}__label`] = label;
      }

      if (streetField && name === settlementField?.name) {
        nextFields[streetField.name] = '';
        nextFields[`${streetField.name}__label`] = '';
      }

      return {
        ...prev,
        fields: nextFields
      };
    });

    if (streetField && name === settlementField?.name) {
      setStreetOptions([]);
      if (value) {
        fetchStreets(String(value));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missingRequired = showFields ? templateFields.filter((field) => {
      if (!field.required || !field.visible) return false;
      const value = formData.fields?.[field.name];
      if (field.name === 'ext63_txtCompanyName') {
        const entityType = String(formData.fields?.ext63_RBPratiToPdf || '').trim();
        if (entityType !== 'חברה') {
          return false;
        }
      }
      if (field.type === 'checkbox') {
        return value !== true;
      }
      return value === undefined || value === null || String(value).trim() === '';
    }) : [];

    if (requireAdditionalDetails && !formData.additionalDetails.trim()) {
      setError('יש למלא פרטים נוספים');
      return;
    }

    if (missingRequired.length > 0) {
      setError(`יש למלא את השדות החובה: ${missingRequired.map((f) => f.label.replace(' (חובה)', '')).join(', ')}`);
      return;
    }

    setError('');
    onNext(formData);
  };

  const SelectField = ({
    value,
    onChange,
    options,
    placeholder = 'בחר',
    disabled = false,
  }: {
    value: string;
    onChange: (next: string) => void;
    options: { value: string; label: string; disabled?: boolean }[];
    placeholder?: string;
    disabled?: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const optionRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const searchRef = useRef<{ value: string; timeout?: number }>({ value: '' });

    useEffect(() => {
      if (!open) return;
      const handleClick = (event: MouseEvent) => {
        if (!wrapperRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    useEffect(() => {
      if (!open) return;
      const selectedIndex = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIndex);
    }, [open, options, value]);

    useEffect(() => {
      if (!open || highlightedIndex < 0) return;
      const el = optionRefs.current[highlightedIndex];
      if (el && listRef.current) {
        const { top, bottom } = el.getBoundingClientRect();
        const listRect = listRef.current.getBoundingClientRect();
        if (top < listRect.top || bottom > listRect.bottom) {
          el.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [open, highlightedIndex]);

    const selectedLabel = options.find((opt) => opt.value === value)?.label || '';
    const enabledIndexes = options
      .map((opt, idx) => (opt.disabled ? -1 : idx))
      .filter((idx) => idx !== -1);

    const moveHighlight = (direction: 1 | -1) => {
      if (enabledIndexes.length === 0) return;
      const current = highlightedIndex;
      const currentPos = enabledIndexes.indexOf(current);
      const nextPos = currentPos === -1
        ? (direction === 1 ? 0 : enabledIndexes.length - 1)
        : (currentPos + direction + enabledIndexes.length) % enabledIndexes.length;
      setHighlightedIndex(enabledIndexes[nextPos]);
    };

    const handleTypeahead = (char: string) => {
      const nextValue = `${searchRef.current.value}${char}`;
      searchRef.current.value = nextValue;
      if (searchRef.current.timeout) {
        window.clearTimeout(searchRef.current.timeout);
      }
      searchRef.current.timeout = window.setTimeout(() => {
        searchRef.current.value = '';
      }, 500);

      const lower = nextValue.toLowerCase();
      const matchIndex = options.findIndex(
        (opt) => !opt.disabled && opt.label.toLowerCase().startsWith(lower)
      );
      if (matchIndex !== -1) {
        setHighlightedIndex(matchIndex);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open) setOpen(true);
        moveHighlight(1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open) setOpen(true);
        moveHighlight(-1);
        return;
      }
      if (e.key === 'Enter') {
        if (open && highlightedIndex >= 0) {
          e.preventDefault();
          const opt = options[highlightedIndex];
          if (opt && !opt.disabled) {
            onChange(opt.value);
            setOpen(false);
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!open) setOpen(true);
        handleTypeahead(e.key);
      }
    };

    return (
      <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '12px 40px 12px 12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '25px',
            textAlign: 'right',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            color: disabled ? '#999' : '#333',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            position: 'relative'
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#6a1b9a')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
        >
          {selectedLabel || placeholder}
          <span style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            pointerEvents: 'none',
            fontSize: '12px'
          }}>▼</span>
        </button>
        {open && !disabled && (
          <div ref={listRef} style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            left: 0,
            marginTop: '6px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '18px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 10
          }}>
            {options.map((opt, idx) => (
              <div
                key={`${opt.value}-${idx}`}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                style={{
                  padding: '10px 16px',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  color: opt.disabled ? '#999' : '#333',
                  backgroundColor: idx === highlightedIndex ? '#f3e5f5' : 'transparent',
                  borderBottom: idx === options.length - 1 ? 'none' : '1px solid #eee'
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderField = (field: TemplateFieldConfig, options?: { compact?: boolean; maxWidth?: string; marginTop?: string }) => {
    if (!field.visible) return null;

    const value = formData.fields?.[field.name] ?? '';
    const isRequired = field.required;
    const marginBottom = options?.compact ? '10px' : '8px';
    const containerStyle: React.CSSProperties = {
      marginBottom,
      width: '100%'
    };
    if (options?.marginTop) {
      containerStyle.marginTop = options.marginTop;
    }
    if (options?.maxWidth) {
      containerStyle.maxWidth = options.maxWidth;
    }

    let label = (
      <label style={{
        display: 'block',
        marginBottom: '6px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        {field.label} {isRequired && <span style={{ color: '#d32f2f' }}>*</span>}
      </label>
    );

    // (no special-case) — keep default label rendering for all fields including 'isVehicleOwner'

    if (field.type === 'textarea') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={5}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              textAlign: 'right',
              boxSizing: 'border-box',
              fontFamily: 'Arial, sans-serif'
            }}
          />
        </div>
      );
    }

    if (field.type === 'select' && field.dataSource === 'settlements') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField
            value={String(value || '')}
            onChange={(next) => {
              const label = settlementOptions.find((opt) => opt.id === next)?.nameHebrew || '';
              handleFieldChange(field.name, next, label);
            }}
            options={[
              { value: '', label: 'בחר' },
              ...(loadingSettlements
                ? [{ value: '__loading__', label: 'טוען...', disabled: true }]
                : settlementOptions.map((opt) => ({ value: opt.id, label: opt.nameHebrew })))
            ]}
          />
        </div>
      );
    }

    if (field.type === 'select' && field.dataSource === 'streets') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField
            value={String(value || '')}
            onChange={(next) => {
              const label = streetOptions.find((opt) => opt.id === next)?.nameHebrew || '';
              handleFieldChange(field.name, next, label);
            }}
            disabled={!selectedSettlementId}
            options={[
              { value: '', label: 'בחר' },
              ...(loadingStreets
                ? [{ value: '__loading__', label: 'טוען...', disabled: true }]
                : streetOptions.map((opt) => ({ value: opt.id, label: opt.nameHebrew })))
            ]}
          />
        </div>
      );
    }

    if (field.type === 'select' && field.dataSource === 'appealReasons') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField
            value={String(value || '')}
            onChange={(next) => {
              const label = appealReasonOptions.find((opt) => opt.key === next)?.value || '';
              handleFieldChange(field.name, next, label);
            }}
            options={[
              { value: '', label: 'בחר' },
              ...(loadingAppealReasons
                ? [{ value: '__loading__', label: 'טוען...', disabled: true }]
                : appealReasonOptions.map((opt) => ({ value: opt.key, label: opt.value })))
            ]}
          />
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
          <SelectField
            value={String(value || '')}
            onChange={(next) => {
              const label = tableOptions.find((opt) => opt.key === next)?.value || '';
              handleFieldChange(field.name, next, label);
            }}
            options={[
              { value: '', label: 'בחר' },
              ...(loadingTable
                ? [{ value: '__loading__', label: 'טוען...', disabled: true }]
                : tableOptions.map((opt) => ({ value: opt.key, label: opt.value })))
            ]}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} style={containerStyle}>
          {label}
          <SelectField
            value={String(value || '')}
            onChange={(next) => {
              const label = field.options?.find((opt) => opt.value === next)?.label || '';
              handleFieldChange(field.name, next, label);
            }}
            options={[
              { value: '', label: 'בחר' },
              ...(field.options || []).map((opt) => ({ value: opt.value, label: opt.label }))
            ]}
          />
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} style={containerStyle}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              style={{ marginLeft: '8px' }}
            />
            {field.label} {isRequired && <span style={{ color: '#d32f2f' }}>*</span>}
          </label>
        </div>
      );
    }

      return (
        <div key={field.name} style={containerStyle}>
        {label}
        <input
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            textAlign: 'right'
          }}
        />
      </div>
    );
  };

  const addressFieldNames = new Set([
    'ddlYeshuv',
    'ddlRechov',
    'txtMisparBayit',
    'txtOtBayit',
    'txtMisparDira',
    'txtKnisa',
    'txtTeDoar',
    'txtMikud'
  ]);
  const addressFields = templateFields.filter((field) => addressFieldNames.has(field.name));
  const otherFields = templateFields.filter((field) => !addressFieldNames.has(field.name));
  const addressFieldMap = Object.fromEntries(addressFields.map((field) => [field.name, field]));
  const renderAddressField = (field?: TemplateFieldConfig, maxWidth?: string) =>
    field ? (
      <div style={{ minWidth: 0, width: '100%', maxWidth: maxWidth || 'none' }}>
        {renderField(field)}
      </div>
    ) : null;

  return (
    <div style={{
      maxWidth: '800px',
      marginInlineStart: 0,
      marginInlineEnd: 'auto',
      padding: '20px',
      direction: 'rtl',
      fontFamily: 'Arial, sans-serif'
    }}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #ffcdd2',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {error}
          </div>
        )}

        {showFields && templateFields.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            {otherFields.map((field) =>
              renderField(field, {
                compact: true,
                maxWidth: ['isVehicleOwner', 'cmbSibatIrur'].includes(field.name) ? '780px' : undefined,
                marginTop: field.name === 'cmbSibatIrur' ? '6px' : undefined
              })
            )}
            {addressFields.length > 0 && (
              <div style={{ marginTop: '32px', marginBottom: '10px' }}>
                <div style={{
                  marginBottom: '14px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: 'right'
                }}>
                  כתובת למשלוח תשובה
                </div>
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
        )}
        {showAdditionalDetails && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center'
            }}>
              נימוקי הבקשה ופרטים נוספים
            </label>
            <textarea
              name="additionalDetails"
              value={formData.additionalDetails}
              onChange={handleTextAreaChange}
              rows={10}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                textAlign: 'right',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif',
                resize: 'vertical'
              }}
            />
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '40px',
          alignItems: 'center',
          marginTop: '32px' 
        }}>
          {/* Back Button */}
          <button
            type="button"
            onClick={onBack}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#d3d3d3',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b0b0b0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d3d3d3'}
          >
            חזור
          </button>

          {/* Next Button */}
          <button
            type="submit"
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7d3c98'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9b59b6'}
          >
            המשך
          </button>
        </div>
      </form>
    </div>
  );
}
