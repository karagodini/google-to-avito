const http = require('http');
const fs = require('fs');
const formidable = require('formidable');
const xml2js = require('xml2js');
const xlsx = require('xlsx');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    fs.readFile('index.html', 'utf8', (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('Ошибка чтения файла');
        return;
      }

      res.setHeader('Content-Type', 'text/html');
      res.statusCode = 200;
      res.end(data);
    });
  } else if (req.method === 'POST' && req.url === '/upload') {
    const form = new formidable.IncomingForm();
    form.uploadDir = __dirname;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.statusCode = 500;
        res.end('Ошибка при загрузке файла');
        return;
      }

      const uploadedFile = files.file;

      // Производим анализ файла Excel
      const workbook = xlsx.readFile(uploadedFile.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Проходимся по строкам в файле Excel и извлекаем данные
      const rows = xlsx.utils.sheet_to_json(sheet);

      // Создаем XML
      const xmlBuilder = new xml2js.Builder();
      const xmlData = xmlBuilder.buildObject({
        Ads: {
          Ad: rows.map(row => ({
            Id: row.Id,
            DateBegin: row.DateBegin,
            DateEnd: row.DateEnd,
            // Добавьте другие столбцы, если необходимо
          })),
        },
      });

      // Сохраняем полученное XML в файл
      fs.writeFileSync('output.xml', xmlData, 'utf-8');

      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 200;
      res.end('Файл успешно загружен и конвертирован в XML');
    });
  } else {
    res.statusCode = 404;
    res.end('Страница не найдена');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});