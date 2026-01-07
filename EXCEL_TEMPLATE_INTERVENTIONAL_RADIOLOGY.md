# Excel Template - Interventional Radiology (Visual Layout)

## Quick Reference Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROW 1:  hospital name    │ [Hospital Name Here]                                           │
│ ROW 2:  full address      │ [Full Address Here]                                            │
│ ROW 3:  [empty]                                                                             │
│ ROW 4:  [empty]                                                                             │
│ ROW 5:  LOCATION          │ [Location Value]                                                │
│ ROW 6:  [empty]                                                                             │
│ ROW 7:  MODEL             │ [Model]        │ ... │ SR NO.  │ [Serial Number]              │
│ ROW 8:  QA DATE           │ [Date]         │ ... │ TEMP    │ [Temp] │ HUM │ [Humidity]    │
│ ROW 9:  MAKE              │ [Make]         │ ... │ SLICE   │ [Slice Value]                │
│ ROW 10: [empty]                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ROW 11: HEADERS - Applied & Measured Data Table                                            │
│         KV │ mA │ mAs │ time (msec) │ KV │ TIME (ms) │ DOSE │ DSE RA │ HVL │ TF          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ROW 12: 80 │ 10 │ 1   │ 1           │ 80.272 │ 1008.249 │ 0.61529 │ 0.6093 │ 4.7238 │ 6.925│
│ ROW 13: 80 │ 50 │ 1   │ 1           │ 80.180 │ 1007.850 │ 3.1234 │ 3.0987 │ 4.7123 │ 6.910│
│ ROW 14: 80 │ 100│ 1   │ 1           │ 80.150 │ 1007.650 │ 6.2456 │ 6.1987 │ 4.7056 │ 6.905│
│ ... (continue for all test combinations)                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────────────────┐
                    │ RIGHT SIDE - Test Result Tables (Columns P-AD)          │
                    ├─────────────────────────────────────────────────────────┤
                    │ ROW 11: ACCURACY OF OPERATING POTENTIAL KV TEST         │
                    │ ROW 12: Applied KV │ Measured kV │ AVG KV │ RESULT     │
                    │ ROW 13: 80 │ 80.27 │ 80.18 │ 80.00 │ 80.15 │ Pass      │
                    │ ROW 14: 100│ 100.32│ 100.25│ 100.20│ 100.26│ Pass       │
                    │ ...                                                      │
                    ├─────────────────────────────────────────────────────────┤
                    │ ROW 22: TIMER TEST                                      │
                    │ ROW 23: Applied Time │ Measured Time │ % Error │ Result │
                    │ ROW 24: 1.00 │ 1.0082 │ 0.82 │ Pass                    │
                    │ ROW 25: 2.00 │ 2.0079 │ 0.39 │ Pass                    │
                    │ ...                                                      │
                    ├─────────────────────────────────────────────────────────┤
                    │ ROW 30: MA LINEARITY TEST                               │
                    │ ROW 31: Set mA │ Dose (mGy) │ KV │ TIME │ X COL │ Result│
                    │ ROW 32: 50 │ 7.997 │ 7.990 │ 7.996 │ 120 │ 1 │ 0.1598 │ Pass│
                    │ ...                                                      │
                    ├─────────────────────────────────────────────────────────┤
                    │ ROW 39: OUTPUT CONSISTENCY                              │
                    │ ROW 40: Applied │ Dose (mGy) │ MEAN │ COV │ RESULT     │
                    │ ROW 41: 80 │ 6.068 │ 6.070 │ 6.075 │ 6.070 │ 0.0005 │ Pass│
                    │ ...                                                      │
                    ├─────────────────────────────────────────────────────────┤
                    │ ROW 48: Table position from reference position (mm)    │
                    │ ROW 49: Position │ Expected │ Measured │ Difference │ Result│
                    │ ROW 50: 1 │ 10.0 │ 10.0 │ 0.0 │ Pass                   │
                    │ ...                                                      │
                    └─────────────────────────────────────────────────────────┘
```

## Column Mapping Reference

### Columns A-J (Main Data Table)
- **A**: Applied KV / Measured KV (depending on section)
- **B**: Applied mA
- **C**: Applied mAs
- **D**: Applied time (msec)
- **E**: Measured KV
- **F**: Measured TIME (ms)
- **G**: Measured DOSE
- **H**: DSE RA (Dose Rate)
- **I**: HVL (Half Value Layer)
- **J**: TF (Total Filtration)

### Columns P-AD (Test Result Tables)
- **P**: Test section headers and first data column
- **Q-W**: Additional data columns for each test
- **AD**: Last column for test results

## Sample Data Values

### General Information Example:
```
A1: "ABC Hospital"
A2: "123 Medical Street, City, State, PIN 123456"
A5: "Main Radiology Department"
A7: "Interventional Radiology System"
A8: "2024-01-15"
A9: "Manufacturer Name"
F7: "SN123456"
F8: "22"
F9: "8*1.25"
G9: "10 mm"
H8: "55"
```

### Applied/Measured Data Example:
```
Row 12: 80 | 10 | 1 | 1 | 80.272 | 1008.249 | 0.61529 | 0.6093 | 4.7238 | 6.925
Row 13: 80 | 50 | 1 | 1 | 80.180 | 1007.850 | 3.1234 | 3.0987 | 4.7123 | 6.910
Row 14: 100 | 10 | 1 | 1 | 100.325 | 1008.123 | 1.2345 | 1.2234 | 5.1234 | 7.123
```

### Test Results Example:
```
Accuracy Test:
Row 13: 80 | 80.27 | 80.18 | 80.00 | 80.15 | Pass | 0.15

Timer Test:
Row 24: 1.00 | 1.0082 | 0.82 | Pass

MA Linearity:
Row 32: 50 | 7.997 | 7.990 | 7.996 | 120 | 1 | 0.1598 | Pass

Output Consistency:
Row 41: 80 | 6.068 | 6.070 | 6.075 | 6.068 | 6.073 | 6.070 | 0.0005 | Pass
```

## Double Tube Format

### Option 1: Separate Sheets
- **Sheet 1**: `RAWDATA_FRONTAL` - All data for Tube Frontal
- **Sheet 2**: `RAWDATA_LATERAL` - All data for Tube Lateral

### Option 2: Same Sheet with Section Separation
```
Rows 1-10: General Info (same for both tubes)
Rows 11-30: Applied/Measured Data - Tube Frontal
Row 31: [Separator row - "TUBE LATERAL DATA"]
Rows 32-51: Applied/Measured Data - Tube Lateral
Rows 52+: Test Results (can be combined or separated)
```

### Option 3: Add Tube Identifier Column
Add column **K** with values "Frontal" or "Lateral" to identify tube type for each row.

## Common Mistakes to Avoid

1. ❌ Using text for numbers (e.g., "80.272" instead of 80.272)
2. ❌ Merged cells in data rows
3. ❌ Inconsistent date formats
4. ❌ Missing headers
5. ❌ Blank rows between data entries
6. ❌ Using "N/A" or "-" instead of empty cells
7. ❌ Wrong sheet name
8. ❌ Special characters in headers that break parsing

## Best Practices

1. ✅ Use numeric values for all measurements
2. ✅ Keep headers in a single row
3. ✅ Start data immediately after headers
4. ✅ Use consistent date format (YYYY-MM-DD recommended)
5. ✅ Leave cells empty if data is unavailable
6. ✅ Use clear, descriptive headers
7. ✅ Test with a small sample first
8. ✅ Validate data before uploading

