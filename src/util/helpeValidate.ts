type AllowedTypes =
  | "number"
  | "string"
  | "boolean"
  | "object"
  | "function"
  | "undefined";
//------------------check chuỗi có bắt đầu bằng ký tự alphabet không---------------
export function startsWithAlphabeticCharacter(str: string): boolean {
  // Biểu thức chính quy để kiểm tra ký tự bắt đầu là chữ cái (A-Z, a-z)
  const regex = /^[A-Za-z]/;
  return regex.test(str);
}
//--------------------loại bỏ number khỏi chuỗi----------------------
export function removeNumber(str: string) {
  return str.replace(/[0-9]/g, "");
}
//--------------------loại bỏ các ký tự không phải number khỏi chuỗi-----------------
export function getNumber(str: string) {
  return Number(str.replace(/\D/g, ""));
}

//----------------------kiểm tra 2 mảng có giống nhau không----------------------
export function isArraysEqual(arr1: string[], arr2: string[]) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}
//----------------------tìm các số còn thiếu trong mảng------------------------
export function findMissingNumbers(
  start: number,
  end: number,
  numberArray: number[]
) {
  // Tạo một mảng chứa tất cả các số từ start đến end
  const fullArray = [];
  for (let i = start; i <= end; i++) {
    fullArray.push(i);
  }
  // Lọc ra các số còn thiếu
  const missingNumbers = fullArray.filter(
    (number) => !numberArray.includes(number)
  );

  return missingNumbers;
}
//-------------------------check type---------------------------------
export function checkType(value: any, type: AllowedTypes): boolean {
  return typeof value === type;
}
