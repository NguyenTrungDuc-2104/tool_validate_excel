import * as XLSX from "xlsx-js-style";
import { getDataSheet } from "../util/validateExcel";

export const modifyExcelAndDownload = async (
  file: File,
  cellError: { [key: string]: string[] }
) => {
  try {
    const { sheetNames, sheets } = await getDataSheet(file);
    const newWorkbook = XLSX.utils.book_new();

    // Lặp qua tất cả các sheet
    for (let sheetName of sheetNames) {
      const worksheet = sheets[sheetName];

      const cellErr = cellError[sheetName];
      if (cellErr?.length > 0) {
        cellErr.forEach((cell) => {
          if (!worksheet[cell]) {
            worksheet[cell] = {
              v: "error",
              s: {
                font: {
                  color: { rgb: "FF0000" },
                  bold: true,
                },
                fill: {
                  fgColor: { rgb: "FFFF00" },
                },
                alignment: { horizontal: "right" },
              },
            };
          } else {
            worksheet[cell].s = {
              font: {
                color: { rgb: "FF0000" },
                bold: true,
              },
              fill: {
                fgColor: { rgb: "FFFF00" },
              },
            };
          }
        });
      }
      XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
    }
    // Xuất file Excel đã chỉnh sửa
    const newFileBuffer = XLSX.write(newWorkbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Tải file về máy
    const blob = new Blob([newFileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modified_file.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error processing the Excel file:", error);
  }
};
