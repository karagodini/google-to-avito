const express = require('express');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { DOMParser, XMLSerializer } = require('xmldom'); // Используем библиотеку xmldom

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage(); // Сохранять файл в памяти
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Отправка HTML-формы для загрузки файла
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка загрузки файла и преобразование в XML
app.post('/convert', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file || !file.originalname.endsWith('.xlsx')) {
    return res.status(400).send('Пожалуйста, загрузите файл Excel с расширением .xlsx.');
  }

  const workbook = XLSX.read(file.buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const excelData = XLSX.utils.sheet_to_json(sheet);

  // Создаем XML-документ
  let xmlData = `<Ads formatVersion="3" target="Avito.ru">\n`;

  // Обработка каждой строки таблицы
  excelData.forEach((row) => {

    //Обработка ячеек с несколькими строками
    const imagesCell = row['Ссылка на фото'];
    let images = '';
    if (imagesCell) {
      const urls = imagesCell.split('\n').map(url => url.trim());
      images = urls.map(url => `      <Image url="${url}"/>\n`).join('');
    }

    // Описание в формате CDATA
    const descriptionCDATA = `<![CDATA[${row['Описание']}]]>`;

    xmlData += `  <Ad>\n`;
    xmlData += `    <Id>${row['ID']}</Id>\n`;
    xmlData += `    <ManagerName>${row['Менеджер']}</ManagerName>\n`;
    xmlData += `    <ContactPhone>${row['Телефон']}</ContactPhone>\n`;
    xmlData += `    <Address>${row['Адрес']}</Address>\n`;
    xmlData += `    <Category>${row['Категория']}</Category>\n`;
    xmlData += `    <Condition>${row['Состояние']}</Condition>\n`;
    xmlData += `    <GoodsType>${row['Вид товара']}</GoodsType>\n`;
    xmlData += `    <Availability>${row['Доступность']}</Availability>\n`;
    xmlData += `    <GoodsSubType>${row['Тип товара']}</GoodsSubType>\n`;
    xmlData += `    <AdType>${row['Вид объявления']}</AdType>\n`;
    xmlData += `    <Title>${row['Заголовок']}</Title>\n`;
    xmlData += `    <Description>${descriptionCDATA}</Description>\n`;
    xmlData += `    <Price>${row['Цена']}</Price>\n`;
    xmlData += `    <Images>\n`;
    xmlData += images;
    xmlData += `    </Images>\n`;
    xmlData += `  </Ad>\n`;
  });
  xmlData += `</Ads>`;

  // Преобразуем XML-документ в строку
  const xmlString = xmlData.trim();

  // Генерируем уникальное имя для XML-файла
  const xmlFileName = `avito_${Date.now()}.xml`;
  const xmlFilePath = path.join(__dirname, 'public', xmlFileName);
  fs.writeFileSync(xmlFilePath, xmlString);
  res.send(xmlFileName);

  app.get('/download/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, 'public', fileName);
  
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Произошла ошибка при скачивании файла.');
      } else {
        fs.unlinkSync(filePath);
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});