import React, { FC, useEffect, useRef, useState } from "react";
import useValidateExcel, { IResultVaildExcel } from "./useValidateExcel";
import { FaCheckCircle } from "react-icons/fa";
import { modifyExcelAndDownload } from "./highlightAndSaveExcel";
//=============================================function component=====================================

const ImportExcel: FC = () => {
  const [restultVaild, setResultValid] = useState<IResultVaildExcel>();
  const [files, setFiles] = useState<FileList | null>(null);
  const { validateFileExcel } = useValidateExcel();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const clearFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      setFiles(null);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = event.target.files;
    setFiles(selectedFiles);
  };
  const handleDownloadFile = () => {
    if (!files?.[0] || !restultVaild?.cellError) return;
    modifyExcelAndDownload(files?.[0], restultVaild?.cellError);
  };

  useEffect(() => {
    if (!files?.[0]) return;
    (async () => {
      const result = await validateFileExcel({
        file: files?.[0],
        sheetNamesValid: ["Lớp", "Học sinh", "Dịch vụ"],
        rules: {
          Lớp: {
            validate: {
              stt: ["require", "valueIncreasing"],
              "Mã lớp": ["require", "valueUnique"],
              "Niên khóa": ["valueMatchesPattern"],
            },
            sizeColSheet: { colStart: "A", colEnd: "E" },
            option: { schoolYear: "2023-2024" },
          },
          "Học sinh": {
            validate: {
              stt: ["require", "valueIncreasing"],
              "Mã học sinh": ["require", "valueUnique"],
              "Họ và tên": ["require"],
              Lớp: ["require"],
              "Ngày/Tháng/Năm sinh": ["require", "valueDateFormat"],
              "Số điện thoại": ["require", "valueIsPhoneNumber"],
            },
            sizeColSheet: { colStart: "A", colEnd: "G" },
            option: { dateFormat: "DD/MM/YYYY" },
          },
          "Dịch vụ": {
            validate: {
              stt: ["require", "valueIncreasing"],
              "Mã dịch vụ": ["require", "valueUnique"],
            },
            sizeColSheet: { colStart: "A", colEnd: "E" },
          },
        },
      });
      setResultValid({ ...result });
    })();
  }, [files]);

  return (
    <div className="bg-white h-full p-4 rounded-2xl shadow-2xl text-gray-800 overflow-y-auto ">
      <div className="mb-6">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          ref={inputRef}
          className="w-full mb-4"
        />
        {files && (
          <button
            className="bg-white text-red-500 shadow-sm active:scale-95 py-1 px-4 rounded-lg border border-red-600 "
            onClick={clearFileInput}
          >
            Xóa file
          </button>
        )}
      </div>
      {!restultVaild?.success && restultVaild?.error && files && (
        <div className="flex flex-col gap-4 ">
          {Object.entries(restultVaild.error).map((err, index) => (
            <div key={index} className="p-2 px-4 border-2 rounded-lg shadow-sm">
              <p className="text-xl font-medium text-red-500 mb-2">{err[0]}</p>
              <ul className="px-2 text-base">
                {err[1].map((err, index) => (
                  <li key={index} className="mb-2">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {Object.keys(restultVaild?.cellError).length > 0 && (
            <div className="flex items-center justify-center mt-4">
              <button
                onClick={handleDownloadFile}
                className="bg-red-500 text-white py-1 px-4 rounded-md"
              >
                Download
              </button>
            </div>
          )}
        </div>
      )}
      {restultVaild?.success && files && (
        <div className="flex flex-col gap-2 items-center justify-center mt-36">
          <FaCheckCircle className="text-8xl text-green-500" />
          <p className="text-2xl text-gray-800 font-normal">Validate success</p>
        </div>
      )}
    </div>
  );
};

export default ImportExcel;
