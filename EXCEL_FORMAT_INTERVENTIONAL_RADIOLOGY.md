# Excel Format Specification for Interventional Radiology

## Overview
This document specifies the exact Excel file format required for uploading test data for Interventional Radiology QA reports.

## File Requirements
- **File Format**: `.xlsx` (Excel 2007+)
- **Sheet Name**: `RAWDATA` or `Raw Data` (preferred) or `Sheet1`
- **Encoding**: UTF-8 compatible

---

## Excel Structure Layout

### **Section 1: General Information (Rows 1-10, Columns A-H)**

| Row | Column A | Column B | Column C | Column D | Column E | Column F | Column G | Column H |
|-----|----------|----------|----------|----------|----------|----------|----------|----------|
| **1** | hospital name | | | | | | | |
| **2** | full address | | | | | | | |
| **3** | | | | | | | | |
| **4** | | | | | | | | |
| **5** | LOCATION | | | | | | | |
| **6** | | | | | | | | |
| **7** | MODEL | | | | | SR NO. | | |
| **8** | QA DATE | | | | | TEMP | 8*1.25 | HUM |
| **9** | MAKE | | | | | SLICE | 10 mm | |

**Field Mapping:**
- **A1**: Hospital Name
- **A2**: Full Address
- **A5**: Location
- **A7**: Model
- **A8**: QA Date (format: YYYY-MM-DD or DD/MM/YYYY)
- **A9**: Make
- **F7**: Serial Number (SR NO.)
- **F8**: Temperature (°C)
- **F9**: Slice thickness
- **G8**: Additional parameter (e.g., 8*1.25)
- **G9**: Slice value (e.g., 10 mm)
- **H8**: Humidity (RH %)

---

### **Section 2: Applied and Measured Data Table (Rows 11-48+, Columns A-J)**

**Row 11 - Header Row:**

| Column | Header | Description |
|--------|--------|-------------|
| **A** | KV | Applied KV |
| **B** | mA | Applied mA |
| **C** | mAs | Applied mAs |
| **D** | time (msec) | Applied Time in milliseconds |
| **E** | KV | Measured KV |
| **F** | TIME (ms) | Measured Time in milliseconds |
| **G** | DOSE | Measured Dose in mGy |
| **H** | DSE RA | Dose Rate |
| **I** | HVL | Half Value Layer |
| **J** | TF | Total Filtration |

**Data Rows (12 onwards):**

| KV | mA | mAs | time (msec) | KV | TIME (ms) | DOSE | DSE RA | HVL | TF |
|----|----|-----|-------------|----|-----------|------|--------|-----|-----|
| 80 | 10 | 1 | 1 | 80.272 | 1008.249 | 0.61529 | 0.6093 | 4.7238 | 6.925 |
| 80 | 50 | 1 | 1 | 80.180 | 1007.850 | 3.1234 | 3.0987 | 4.7123 | 6.910 |
| 80 | 100 | 1 | 1 | 80.150 | 1007.650 | 6.2456 | 6.1987 | 4.7056 | 6.905 |
| 100 | 10 | 1 | 1 | 100.325 | 1008.123 | 1.2345 | 1.2234 | 5.1234 | 7.123 |
| 100 | 50 | 1 | 1 | 100.280 | 1007.890 | 6.1234 | 6.0789 | 5.1123 | 7.110 |
| 100 | 100 | 1 | 1 | 100.250 | 1007.750 | 12.3456 | 12.2345 | 5.1056 | 7.105 |
| 120 | 10 | 1 | 1 | 120.410 | 1007.738 | 2.3456 | 2.3234 | 6.1234 | 7.234 |
| 120 | 50 | 1 | 1 | 120.380 | 1007.650 | 11.2345 | 11.1234 | 6.1123 | 7.223 |
| 120 | 100 | 1 | 1 | 120.350 | 1007.580 | 22.4567 | 22.2345 | 6.1056 | 7.215 |
| 120 | 150 | 1 | 1 | 120.320 | 1007.520 | 33.6789 | 33.3456 | 6.0989 | 7.208 |
| 120 | 200 | 1 | 1 | 120.300 | 1007.480 | 44.8901 | 44.4567 | 6.0922 | 7.201 |
| 140 | 10 | 1 | 1 | 140.450 | 1007.650 | 3.4567 | 3.4234 | 7.1234 | 7.345 |
| 140 | 50 | 1 | 1 | 140.420 | 1007.580 | 17.2345 | 17.0789 | 7.1123 | 7.334 |
| 140 | 100 | 1 | 1 | 140.400 | 1007.520 | 34.4567 | 34.1234 | 7.1056 | 7.326 |
| 140 | 150 | 1 | 1 | 140.380 | 1007.480 | 51.6789 | 51.2345 | 7.0989 | 7.319 |
| 140 | 200 | 1 | 1 | 140.360 | 1007.450 | 68.8901 | 68.3456 | 7.0922 | 7.312 |

**Notes:**
- Continue adding rows as needed for all test combinations
- Leave empty cells if data is not available
- Use numeric values only (no text in data cells)

---

### **Section 3: Test Result Tables (Columns P-AD, Starting from Row 11)**

#### **3.1. Accuracy of Operating Potential KV Test (Rows 11-20)**

**Row 11 - Header:**
| Column P | Column Q | Column R | Column S | Column T | Column U | Column V |
|----------|----------|----------|----------|----------|----------|----------|
| ACCURACY OF OPERATING POTENTIAL KV TEST | | | | | | |

**Row 12 - Sub-headers:**
| Applied KV | Measured kV at mA Used | | | AVG KV | RESULT | DIFFERENCE |
|------------|------------------------| | | | | |
| | At mA 10 | At mA 100 | At mA 200 | | | |

**Data Rows (13-16):**

| Applied KV | At mA 10 | At mA 100 | At mA 200 | AVG KV | RESULT | DIFFERENCE |
|------------|----------|-----------|-----------|--------|--------|------------|
| 80 | 80.27 | 80.18 | 80.00 | 80.15 | Pass | 0.15 |
| 100 | 100.32 | 100.25 | 100.20 | 100.26 | Pass | 0.26 |
| 120 | 120.41 | 120.35 | 120.30 | 120.35 | Pass | 0.35 |
| 140 | 140.45 | 140.40 | 140.36 | 140.40 | Pass | 0.40 |

**Row 20 - Note:**
| TOLERANCE IS ± 2KV | | | | | | |

---

#### **3.2. Timer Test (Rows 22-28)**

**Row 22 - Header:**
| Column P | Column Q | Column R | Column S |
|----------|----------|----------|----------|
| TIMER TEST | | | |

**Row 23 - Sub-headers:**
| Applied Time | Measured Time | % Error | Result |
|--------------|---------------|---------|--------|

**Data Rows (24-26):**

| Applied Time | Measured Time | % Error | Result |
|--------------|---------------|---------|--------|
| 1.00 | 1.0082 | 0.82 | Pass |
| 2.00 | 2.0079 | 0.39 | Pass |
| 3.00 | 3.0070 | 0.23 | Pass |

**Row 27 - Note:**
| TOLERANCE IS ±10% | | | |

---

#### **3.3. MA Linearity Test (Rows 30-37)**

**Row 30 - Header:**
| Column P | Column Q | Column R | Column S | Column T | Column U | Column V | Column W |
|----------|----------|----------|----------|----------|----------|----------|----------|
| MA LINEARITY TEST | | | | | | | |

**Row 31 - Sub-headers:**
| Set mA | Dose in mGy | | | KV | TIME | X COL | RESULT |
|--------|-------------| | | | | | |
| | Reading 1 | Reading 2 | Reading 3 | | | | |

**Data Rows (32-35):**

| Set mA | Reading 1 | Reading 2 | Reading 3 | KV | TIME | X COL | RESULT |
|--------|-----------|-----------|-----------|----|----|-------|--------|
| 50 | 7.997 | 7.990 | 7.996 | 120 | 1 | 0.1598 | Pass |
| 100 | 15.990 | 15.985 | 15.992 | 120 | 1 | 0.1580 | Pass |
| 150 | 23.985 | 23.980 | 23.988 | 120 | 1 | 0.1584 | Pass |
| 200 | 31.980 | 31.975 | 31.983 | 120 | 1 | 0.1588 | Pass |

**Row 36 - Additional Data:**
| | | | | | | 0.005 | |

---

#### **3.4. Output Consistency (Rows 39-46)**

**Row 39 - Header:**
| Column P | Column Q | Column R | Column S | Column T | Column U | Column V | Column W |
|----------|----------|----------|----------|----------|----------|----------|----------|
| OUTPUT CONSISTENCY | | | | | | | |

**Row 40 - Sub-headers:**
| Applied | Dose in mGy | | | | MEAN (X) | COV | RESULT |
|---------|-------------| | | | | | |
| | Reading 1 | Reading 2 | Reading 3 | Reading 4 | Reading 5 | | |

**Data Rows (41-44):**

| Applied | Reading 1 | Reading 2 | Reading 3 | Reading 4 | Reading 5 | MEAN (X) | COV | RESULT |
|---------|-----------|-----------|-----------|-----------|-----------|----------|-----|--------|
| 80 | 6.068 | 6.070 | 6.075 | 6.068 | 6.073 | 6.070 | 0.0005 | Pass |
| 100 | 10.560 | 10.562 | 10.565 | 10.560 | 10.563 | 10.560 | 0.0002 | Pass |
| 120 | 15.802 | 15.804 | 15.807 | 15.802 | 15.805 | 15.802 | 0.0002 | Pass |
| 140 | 21.592 | 21.594 | 21.597 | 21.592 | 21.595 | 21.592 | 0.0004 | Pass |

---

#### **3.5. Table Position from Reference Position (Rows 48-53)**

**Row 48 - Header:**
| Column P | Column Q | Column R | Column S | Column T | Column U |
|----------|----------|----------|----------|----------|----------|
| Table position from reference position (mm) | | | | | |

**Row 49 - Sub-headers:**
| Position | Expected (mm) | Measured (mm) | Difference | Result |
|----------|----------------|---------------|------------|--------|

**Data Rows (50-53):**

| Position | Expected (mm) | Measured (mm) | Difference | Result |
|----------|---------------|---------------|------------|--------|
| 1 | 10.0 | 10.0 | 0.0 | Pass |
| 2 | 20.0 | 20.0 | 0.0 | Pass |
| 3 | 30.0 | 30.0 | 0.0 | Pass |
| 4 | 5.0 cm | 5.0 | 0.0 | Pass |
| 5 | 40.0 | 40.0 | 0.0 | Pass |
| 6 | 50.0 | 50.0 | 0.0 | Pass |

---

## Additional Test Sections (If Applicable)

### **Central Beam Alignment**
- Can be added in a separate section or sheet
- Format: Position, Expected, Measured, Difference, Result

### **Effective Focal Spot Measurement**
- Format: FCD, Focal Spot Size, Measured, Tolerance, Result

### **Total Filtration**
- Format: KV, HVL, TF, Result

### **Consistency of Radiation Output**
- Similar to Output Consistency format above

### **Low Contrast Resolution**
- Format: Object Size, Contrast, Visible (Yes/No)

### **High Contrast Resolution**
- Format: LP/cm, Visible (Yes/No)

### **Exposure Rate at Table Top**
- Format: KV, mA, Distance, Exposure Rate, Result

### **Tube Housing Leakage**
- Format: Position, Leakage Rate, Limit, Result

### **Radiation Protection Survey**
- Format: Location, Reading, Limit, Result

---

## Excel Format Rules

### **1. Data Types**
- **Numbers**: Use numeric values only (e.g., 80.272, not "80.272")
- **Text**: Use text for headers, labels, and result values (e.g., "Pass", "Fail")
- **Dates**: Use date format (YYYY-MM-DD or DD/MM/YYYY)
- **Empty Cells**: Leave cells empty if data is not available (don't use "N/A" or "-")

### **2. Column Headers**
- Headers should be in **Row 11** for main data table
- Use clear, descriptive headers
- Sub-headers can be in the row immediately below main headers

### **3. Data Organization**
- Start data rows immediately after header rows
- No blank rows between headers and data
- Leave one blank row between different test sections

### **4. Sheet Naming**
- Preferred: `RAWDATA` or `Raw Data`
- Alternative: `Sheet1` or `Data`
- For double tube: Can use `RAWDATA_FRONTAL` and `RAWDATA_LATERAL` or combine in one sheet

### **5. Special Considerations**

#### **Single Tube Configuration:**
- All test data in one sheet
- No tube identifier needed

#### **Double Tube Configuration:**
- Option 1: Separate sheets (`RAWDATA_FRONTAL`, `RAWDATA_LATERAL`)
- Option 2: Same sheet with clear section separation
  - First half of data rows = Tube Frontal
  - Second half of data rows = Tube Lateral
- Option 3: Add a "Tube" column to identify Frontal/Lateral

---

## Example Excel File Structure

```
Sheet: RAWDATA

Row 1:  hospital name | [Hospital Name Value]
Row 2:  full address  | [Full Address Value]
Row 3:  [empty]
Row 4:  [empty]
Row 5:  LOCATION      | [Location Value]
Row 6:  [empty]
Row 7:  MODEL         | [Model Value] | ... | SR NO. | [Serial Number]
Row 8:  QA DATE       | [Date Value]  | ... | TEMP   | [Temp] | HUM | [Humidity]
Row 9:  MAKE          | [Make Value] | ... | SLICE  | [Slice Value]
Row 10: [empty]
Row 11: [HEADERS: KV | mA | mAs | time (msec) | KV | TIME (ms) | DOSE | DSE RA | HVL | TF]
Row 12+: [DATA ROWS]
...
Row 11 (Column P): ACCURACY OF OPERATING POTENTIAL KV TEST
Row 12 (Column P): Applied KV | Measured kV at mA Used | AVG KV | RESULT | DIFFERENCE
Row 13+: [Test Data]
...
Row 22 (Column P): TIMER TEST
Row 23 (Column P): Applied Time | Measured Time | % Error | Result
Row 24+: [Test Data]
...
```

---

## Validation Checklist

Before uploading, ensure:

- [ ] File is in `.xlsx` format
- [ ] Sheet name is `RAWDATA`, `Raw Data`, or `Sheet1`
- [ ] General information is in rows 1-10, columns A-H
- [ ] Applied/Measured data table starts at row 11, columns A-J
- [ ] Test result tables are in columns P-AD
- [ ] All numeric values are actual numbers (not text)
- [ ] Headers are clearly labeled
- [ ] No merged cells in data rows
- [ ] Date format is consistent
- [ ] For double tube: Data is clearly separated or in separate sheets

---

## Notes

1. **Flexibility**: The parser will attempt to find sections even if exact row numbers vary slightly
2. **Missing Data**: Empty cells are acceptable; the parser will skip them
3. **Case Sensitivity**: Headers are case-insensitive (e.g., "KV" = "kv" = "Kv")
4. **Multiple Sheets**: If multiple sheets exist, the parser will auto-select based on tube type
5. **Error Handling**: Invalid data will be logged but won't stop the entire import

---

## Support

For questions or issues with Excel format:
- Check that all required sections are present
- Verify data types (numbers vs text)
- Ensure sheet naming follows conventions
- Review the validation checklist above

