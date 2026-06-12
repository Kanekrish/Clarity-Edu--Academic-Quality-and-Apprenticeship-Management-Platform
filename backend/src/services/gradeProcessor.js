const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const fs = require('fs');

async function parseGradeFile(filePath, originalName) {
  const rows = [];
  const ext = (originalName || '').toLowerCase().split('.').pop();

  if (ext === 'csv') {
    const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const result = Papa.parse(content, { 
      header: true, 
      skipEmptyLines: true 
    });

    for (const row of result.data) {
      rows.push({
        student_id: String(row['Student ID'] ?? row['student_id'] ?? '').trim(),
        module_code: String(row['Module Code'] ?? row['module_code'] ?? '').trim(),
        grade: String(row['Grade'] ?? row['grade'] ?? '').trim(),
      });
    }

  } else {
    // Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    const headers = [];

    sheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) {
        // row.values is 1-indexed sparse array — preserve indices with [i] = v, not push
        row.values.forEach((v, i) => { headers[i] = v; });
      } else {
        const obj = {};
        row.values.forEach((v, i) => { obj[headers[i]] = v; });
        rows.push({
          student_id: String(obj['Student ID'] ?? obj['student_id'] ?? '').trim(),
          module_code: String(obj['Module Code'] ?? obj['module_code'] ?? '').trim(),
          grade: String(obj['Grade'] ?? obj['grade'] ?? '').trim(),
        });
      }
    });
  }

  return rows;
}

module.exports = { parseGradeFile };