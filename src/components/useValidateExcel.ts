import {
  getNumber,
  isArraysEqual,
  removeNumber,
  startsWithAlphabeticCharacter,
} from "../util/helpeValidate";
import * as XLSX from "xlsx-js-style";
import {
  AllowedTypes,
  ICell,
  checSampleValueRow,
  checkAscendingRowValueNumber,
  checkDuplicateRowValue,
  checkEmptyRow,
  checkFormatDateRow,
  checkPhoneNumberRow,
  checkTypeRow,
  getDataSheet,
} from "../util/validateExcel";

enum ERuleValidation {
  require = "require", // giá trị không được trống
  valueIncreasing = "valueIncreasing", // giá trị phải tăng dần (number)
  valueUnique = "valueUnique", // giá trị không được trùng
  valueMatchesPattern = "valueMatchesPattern", // giá trị phải giống mẫu
  valueDateFormat = "valueDateFormat", // giá trị phải theo format (Date)
  valueIsPhoneNumber = "valueIsPhoneNumber", // giá trị là số điện thoại
  valueOfType = "valueOfType", // giá trị phải theo type được cung cấp
}
type TRule = keyof typeof ERuleValidation;

interface IValidationRules {
  rowStart?: number;
  rowEnd?: number;
  schoolYear?: string;
  dateFormat?: string;
  typeRow?: AllowedTypes;
}
interface IRuleColumn {
  [key: string]: TRule[];
}
interface IvalidateSheet {
  validate: IRuleColumn;
  sizeColSheet: { colStart: string; colEnd: string };
  option?: IValidationRules;
}
interface IValidate {
  [key: string]: IvalidateSheet;
}
interface IValidateExcel {
  sheetNamesExcel: string[];
  sheetNamesValid: string[];
  sheets: XLSX.WorkSheet;
  rules: IValidate;
}
interface IErrorExcel {
  [key: string]: string[];
}

export interface IResultVaildExcel {
  error: IErrorExcel;
  success: boolean;
  cellError: IErrorExcel;
}

interface IHookValidExcel {
  file: File;
  sheetNamesValid: string[];
  rules: IValidate;
}
//==========================find column===============================
function findColumnWithName(
  columnsSheet: Record<string, ICell[]>,
  name: string
): string | null {
  const columnName = [];

  for (let key in columnsSheet) {
    const value = Object.values(columnsSheet[key][0])[0] as string;
    columnName.push({ [key]: value });
  }
  const foundColumn = columnName.find(
    (item) =>
      (Object.values(item)[0] as string).trim().toLocaleLowerCase() ===
      name.trim().toLocaleLowerCase()
  );
  return foundColumn ? Object.keys(foundColumn)[0] : null;
}

const catchErrorColumn = (
  column: ICell[],
  rules: TRule[],
  validationRules: IValidationRules
) => {
  const message: string[] = [];
  let cellError: string[] = [];
  const { dateFormat, rowEnd, schoolYear, rowStart, typeRow } = validationRules;
  rules.forEach((rule) => {
    // không được trống
    if (rule === ERuleValidation.require) {
      if (!rowStart || !rowEnd) {
        throw new Error(
          "Vui lòng cung cấp số thứ tự của row bắt đầu và số thứ tự của row kết thúc"
        );
      }
      const { success, columnName, rows } = checkEmptyRow(
        column,
        rowStart + 1,
        rowEnd
      );
      if (!success) {
        message.push(`Cột ${columnName} ô ${rows.join(", ")} không được trống`);
        cellError = [...cellError, ...rows];
      }
    }
    // giá trị tăng dần
    if (rule === ERuleValidation.valueIncreasing) {
      const { success, columnName, rows } =
        checkAscendingRowValueNumber(column);
      if (!success) {
        message.push(
          `Cột ${columnName} giá trị ô ${rows.join(", ")} không tăng dần`
        );
        cellError = [...cellError, ...rows];
      }
    }
    // giá trị không được trùng
    if (rule === ERuleValidation.valueUnique) {
      const { success, columnName, rows } = checkDuplicateRowValue(column);
      if (!success) {
        message.push(
          `Cột ${columnName} ô ${rows.join(", ")} có giá trị trùng nhau`
        );
        cellError = [...cellError, ...rows];
      }
    }
    // giá trị phải giống mẫu
    if (rule === ERuleValidation.valueMatchesPattern) {
      if (!schoolYear) {
        throw new Error("Vui lòng cung cấp giá trị so sánh");
      }
      const { success, columnName, rows } = checSampleValueRow(
        column,
        schoolYear
      );

      if (!success) {
        message.push(`Cột ${columnName} ô ${rows.join(", ")} có giá trị khác`);
        cellError = [...cellError, ...rows];
      }
    }
    // giá trị là số điện thoại
    if (rule === ERuleValidation.valueIsPhoneNumber) {
      const { success, columnName, rows } = checkPhoneNumberRow(column);
      if (!success) {
        message.push(
          `Cột ${columnName} ô ${rows.join(
            ", "
          )} không phải số điện thoại hợp lệ`
        );
        cellError = [...cellError, ...rows];
      }
    }
    // date format
    if (rule === ERuleValidation.valueDateFormat) {
      if (!dateFormat) {
        throw new Error("Vui lòng cung cấp date format");
      }
      const { success, columnName, rows } = checkFormatDateRow(
        column,
        dateFormat
      );
      if (!success) {
        message.push(
          `Cột ${columnName} ô ${rows.join(", ")} không theo date format`
        );
        cellError = [...cellError, ...rows];
      }
    }
    // giá trị theo kiểu
    if (rule === ERuleValidation.valueOfType) {
      if (!typeRow) {
        throw new Error("Vui lòng cung cấp type cần kiểm tra");
      }
      const { success, columnName, rows } = checkTypeRow(column, typeRow);
      if (!success) {
        message.push(
          `Cột ${columnName} ô ${rows.join(", ")} khác kiểu giá trị`
        );
        cellError = [...cellError, ...rows];
      }
    }
  });
  if (message.length > 0) {
    return { success: false, message, cellError };
  } else {
    return { success: true, message, cellError };
  }
};

//======================convert array to object=======================
function convertArrayToObject(array: string[]) {
  const result = array.reduce<Record<string, ICell[]>>((acc, key) => {
    if (!acc.hasOwnProperty(key)) {
      acc[key] = [];
    }
    return acc;
  }, {});

  return result;
}
//==========================get column sheet===========================
function getDataColumn(workSheet: XLSX.WorkSheet) {
  const keySheet = Object.keys(workSheet)
    .filter((item) => startsWithAlphabeticCharacter(item))
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  const columnName = [...new Set(keySheet.map((item) => removeNumber(item)))];
  const result = convertArrayToObject(columnName);
  const valueSheets = keySheet.map((item) => {
    return { [item]: workSheet[item]["v"] };
  });
  valueSheets.forEach((item) => {
    const key = Object.keys(item)[0];
    columnName.forEach((col) => {
      if (key.startsWith(col)) {
        result[col].push(item);
      }
    });
  });
  return result;
}

//==========================================validate sheet============================================
const validateSheet = (
  valueSheet: Record<string, ICell[]>,
  ruleColumn: IRuleColumn,
  option: IValidationRules
) => {
  const arrayNameColumn = Object.keys(ruleColumn);
  let result: { message: string[]; success: boolean; cellError: string[] } = {
    message: [],
    success: true,
    cellError: [],
  };
  for (let col of arrayNameColumn) {
    const rules = ruleColumn[col];
    const column = findColumnWithName(valueSheet, col);
    if (!column) continue;
    const valueColumn = valueSheet[column];
    const [_, ...value] = valueColumn;
    const {
      message: mes,
      success,
      cellError,
    } = catchErrorColumn(value, rules, option);

    if (!success) {
      result = {
        success: false,
        message: [...result.message, ...mes],
        cellError,
      };
    }
  }
  return result;
};
//==========================================validate excel============================================
function validateExcel(valid: IValidateExcel) {
  const { rules, sheetNamesValid, sheetNamesExcel, sheets } = valid;
  let result: IResultVaildExcel = {
    error: {},
    success: true,
    cellError: {},
  };
  if (!isArraysEqual(sheetNamesValid, sheetNamesExcel)) {
    (result.success = false),
      (result.error["sheet"] = ["Sai tên hoặc thứ tự sheet"]);
  }
  for (let name of sheetNamesExcel) {
    let errorOutSize = "";
    const sheet = sheets[name];
    const validate = rules[name]?.validate || {};
    const option = rules[name]?.option || {};
    const sizeColSheet = rules[name]?.sizeColSheet;
    const { colEnd, colStart } = sizeColSheet || {};
    const columnsSheet = getDataColumn(sheet);
    const keyColumn = Object.keys(columnsSheet);

    //-----------------lấy size sheet---------------
    const outSizeColSheet = keyColumn.filter(
      (key) => key < colStart || key > colEnd
    );
    const outLeft = outSizeColSheet.some((col) => col < colStart);
    const outRight = outSizeColSheet.some((col) => col > colEnd);

    if (outLeft) {
      errorOutSize = "Tồn tại ký tự ngoài bảng phía bên trái";
    }
    if (outRight) {
      errorOutSize = "Tồn tại ký tự ngoài bảng phía bên phải";
    }

    const sizeRowSheet = (sheet["!ref"] as string)?.split(":");
    if (!sizeRowSheet) continue;
    const rowStart = getNumber(sizeRowSheet[0]);
    const rowEnd = getNumber(sizeRowSheet[1]);
    //----------------------vaidate-------------------
    const {
      message,
      success,
      cellError: cellErrorSheet,
    } = validateSheet(
      columnsSheet,
      {
        ...validate,
      },
      {
        ...option,
        rowStart,
        rowEnd,
      }
    );
    if (!success || errorOutSize) {
      if (result.error.hasOwnProperty(name)) {
        const owError = { ...result.error };
        owError[name] = errorOutSize
          ? [...owError[name], ...message, errorOutSize]
          : [...owError[name], ...message];
      } else {
        result = {
          ...result,
          success: false,
          error: {
            ...result.error,
            [name]: errorOutSize ? [...message, errorOutSize] : [...message],
          },
        };
      }
    }
    if (!success) {
      if (result.cellError.hasOwnProperty(name)) {
        const owCellError = { ...result.cellError };
        owCellError[name] = [...owCellError[name], ...cellErrorSheet];
      } else {
        result = {
          ...result,
          cellError: { ...result.cellError, [name]: [...cellErrorSheet] },
        };
      }
    }
  }
  return result;
}

const useValidateExcel = () => {
  const validateFileExcel = async (
    valid: IHookValidExcel
  ): Promise<IResultVaildExcel> => {
    const { file, rules, sheetNamesValid } = valid;
    if (!file)
      return {
        success: false,
        error: { file: ["File not found"] },
        cellError: {},
      };
    const { sheetNames, sheets } = await getDataSheet(file);
    const res = validateExcel({
      sheetNamesExcel: sheetNames,
      rules,
      sheetNamesValid,
      sheets,
    });
    return res;
  };
  return { validateFileExcel };
};
export default useValidateExcel;
