import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { findMissingNumbers, getNumber, removeNumber } from "./helpeValidate";
import * as XLSX from "xlsx-js-style";
dayjs.extend(customParseFormat);
export type AllowedTypes = "number" | "string" | "boolean";

export interface ICell {
  [key: string]: string;
}

interface IResultValid {
  success: boolean;
  columnName: string;
  rows: string[];
}
//==========================get data sheet====================
export const getDataSheet = (
  file: File
): Promise<{ sheetNames: string[]; sheets: XLSX.WorkSheet }> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("File could not be read");
        }
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;
        const sheets = workbook.Sheets;
        resolve({ sheetNames, sheets });
      } catch (error) {
        reject(error);
      }
    };
    fileReader.onerror = (error) => {
      reject(error);
    };
    fileReader.readAsArrayBuffer(file);
  });
};

//=================================get name column===========================
const getNameColumn = (column: ICell[]) => {
  const col = Object.keys(column[0])[0].slice(0, 1) || "";
  return removeNumber(col);
};

//==================================check row rỗng===========================
export const checkEmptyRow = (
  column: ICell[],
  startRow: number | undefined,
  endRow: number | undefined
): IResultValid => {
  if (!startRow || !endRow) return { success: false, columnName: "", rows: [] };
  let result: IResultValid;
  const nameColumn = getNameColumn(column);
  const row = column.map((col) => getNumber(Object.keys(col)[0]));
  row.sort((a, b) => a - b);
  const missRow = findMissingNumbers(startRow, endRow, row);
  if (missRow.length > 0) {
    const nameRowMiss = missRow.map((row) => nameColumn + row);
    result = { success: false, columnName: nameColumn, rows: nameRowMiss };
  } else {
    result = { success: true, columnName: "", rows: [] };
  }
  return result;
};
//===============================check type column===========================
export const checkTypeRow = (
  column: ICell[],
  type: AllowedTypes | undefined
): IResultValid => {
  if (!type) return { success: false, columnName: "", rows: [] };
  let result: IResultValid;
  const rows: string[] = [];
  const nameColumn = getNameColumn(column);
  column.forEach((row) => {
    const value = Object.values(row)[0];
    const nameRow = Object.keys(row)[0];
    if (typeof value !== type) {
      rows.push(nameRow);
    }
  });
  if (rows.length > 0) {
    result = { success: false, columnName: nameColumn, rows };
  } else {
    result = { success: true, columnName: "", rows: [] };
  }
  return result;
};
//=============================check row có giá trị trùng lặp======================
export const checkDuplicateRowValue = (column: ICell[]): IResultValid => {
  let result: IResultValid;
  const nameColumn = getNameColumn(column);
  const valueToKeys: { [key: string]: string[] } = {};
  const rows: string[] = [];

  column.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      const valueKey = JSON.stringify(value); // Chuyển giá trị thành chuỗi để so sánh
      if (!valueToKeys[valueKey]) {
        valueToKeys[valueKey] = [];
      }
      valueToKeys[valueKey].push(key);
    });
  });
  Object.values(valueToKeys).forEach((keys) => {
    if (keys.length > 1) {
      rows.push(...keys);
    }
  });
  if (rows.length > 0) {
    result = { success: false, columnName: nameColumn, rows };
  } else {
    result = { success: true, columnName: "", rows: [] };
  }
  return result;
};
//=============================check giá trị tăng dần======================
export const checkAscendingRowValueNumber = (column: ICell[]): IResultValid => {
  const nameColumn = getNameColumn(column);
  let result: IResultValid;
  const rows: string[] = [];
  const numArray = column.map((row) => {
    const [key, value] = Object.entries(row)[0];
    return { [key]: +value };
  });
  for (let i = 0; i < numArray.length - 1; i++) {
    const rowValue = Object.values(numArray[i])[0];
    const rowNextValue = Object.values(numArray[i + 1])[0];
    if (rowValue >= rowNextValue || isNaN(rowValue)) {
      const rowName = Object.keys(numArray[i])[0];
      rows.push(rowName);
    }
  }
  if (rows.length > 0) {
    result = { success: false, columnName: nameColumn, rows };
  } else {
    result = { success: true, columnName: "", rows: [] };
  }
  return result;
};
//==============================check giá trị theo mẫu=====================
export const checSampleValueRow = (
  column: ICell[],
  sampleValue: string | number | undefined
): IResultValid => {
  if (!sampleValue) return { success: false, columnName: "", rows: [] };
  const nameColumn = getNameColumn(column);
  let result: IResultValid;
  const rows: string[] = [];

  column.forEach((row) => {
    const [key, value] = Object.entries(row)[0];
    if (value !== sampleValue) {
      rows.push(key);
    }
  });
  if (rows.length > 0) {
    result = { success: false, columnName: nameColumn, rows };
  } else {
    result = { success: true, columnName: "", rows: [] };
  }
  return result;
};
//========================================check format date=================
export const checkFormatDateRow = (
  column: ICell[],
  dateFormat: string | undefined
): IResultValid => {
  if (!dateFormat) return { success: false, columnName: "", rows: [] };
  const nameColumn = getNameColumn(column);
  let result: IResultValid;
  const rows: string[] = [];
  column.forEach((row) => {
    const [key, value] = Object.entries(row)[0];
    if (!dayjs(value, dateFormat, true).isValid()) {
      rows.push(key);
    }
  });
  if (rows.length > 0) {
    result = { success: false, columnName: nameColumn, rows };
  } else {
    result = { success: true, columnName: "", rows: [] };
  }
  return result;
};
//================================check số điện thoại======================
export const checkPhoneNumberRow = (column: ICell[]): IResultValid => {
  const nameColumn = getNameColumn(column);
  let result: IResultValid;
  const rows: string[] = [];

  column.forEach((row) => {
    const [key, value] = Object.entries(row)[0];
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(value.toString())) {
      rows.push(key);
    }
  });
  if (rows.length > 0) {
    result = { success: false, columnName: nameColumn, rows };
  } else {
    result = { success: true, columnName: "", rows: [] };
  }
  return result;
};
