#!/usr/bin/env node

const path = require('path');
const xml2js = require('xml2js');
const nunjucks = require('nunjucks');
const fs = require('fs-extra');
const sharp = require('sharp');


// Funtion to search and retrive cli arg value finding it by name
function getArgValue(argName) {
  const index = process.argv.findIndex(arg => arg === argName);
  if (index === -1) {
    return false; // Missing argument
  } else {
    if (!process.argv[index + 1]) {
      return null; // Argument value is missing
    } else {
      return process.argv[index + 1].replace(/^\/|\/$/g, ''); // Argument value
    }
  }
}

async function main() {
  try {

    // Get the catalog path argument
    const catalogPath = getArgValue('--catalog-path');

    // Check if the catalog path is valid
    if (catalogPath == false || !fs.existsSync(catalogPath)) {
      console.error('Catalog file not found');
      return;
    }

    // Get the web path argument
    const webPath = (getArgValue('--web-path') || 'web'); // Default value is 'web'

    // Check if the web path is valid
    if (catalogPath == false || !fs.existsSync(catalogPath)) {
      console.error('Web path not found');
      return;
    }

    // Parse the catalog XML file
    const xmlData = await fs.readFile(catalogPath, 'utf-8');
    const parser = new xml2js.Parser();
    const parsedXml = await parser.parseStringPromise(xmlData);

    // Read the googleDriveIds file
    const gdriveIdsPath = getArgValue('--gdriveids-path') || false;
    const catalogRemoteIds = gdriveIdsPath && fs.existsSync(gdriveIdsPath) ? JSON.parse(fs.readFileSync(gdriveIdsPath, 'utf8')) : false;


    /**
     * Parse the catalog data
     * **********************
     */
    const catalogTitle = parsedXml.calibredb['$'].title || 'My Catalog Library';

    // 3. Create dist directory and subdirectory
    const record = parsedXml.calibredb?.record || []; // Use optional chaining

    // 4. Helper functions
    function makeSafeFilename(filename) {
      return filename.replace(/[^a-z0-9]/gi, '').trim();
    }

    async function copyCoverImage(coverPath) {
      const coversFolderName = 'covers';

      if (!coverPath) return null;
      const fileExtension = path.extname(coverPath);
      const parentDir = path.dirname(coverPath);
      const grandparentDir = path.dirname(parentDir);
      const greatGrandparentDir = path.dirname(grandparentDir);
      const filename = makeSafeFilename(path.basename(greatGrandparentDir) + path.basename(parentDir)) + fileExtension;
      const newImagePath = path.join(coversFolderName, filename);

      // If the cover folder does not exist, create it
      if (!fs.existsSync(path.join(webPath, coversFolderName))) {
        fs.mkdirSync(path.join(webPath, coversFolderName));
      }

      try {

        await sharp(coverPath)
          .resize(500)
          .toFile(path.join(webPath, newImagePath));

      } catch (error) {
        // Do nothing
      }

      return newImagePath;
    }

    // Search the book formats and if find PDF or EPUB format, return the Google Drive ID for each as type,id pair.
    async function getFormatsGoogleDriveIds(book, catalogRemoteIds) {
      // Loop al formats and get the first epub format
      if (!book.formats || !book.formats[0].format) return false;

      var output = [];

      for (const format of book.formats[0].format) {
        try {

          // Get format extension name
          const formatType = (format.split('.').slice(-1)[0]).toLowerCase();

          // Check if the format is a valid format: PDF or EPUB
          if (!['pdf', 'epub'].includes(formatType)) continue;

          // Get the first format and extract the last two directories and the file name
          const formatName = format.split('/').slice(-2).join('/');

          const formatGoogleDriveId = catalogRemoteIds.find(item => item.Path.includes(formatName))?.ID || false;

          if (formatGoogleDriveId) {
            output.push({
              'type': formatType,
              'id': formatGoogleDriveId
            });
          }

        } catch (e) {
          console.error('Error looking for Google Drive ID for "' + book.title[0]['_'] + '" book.');
        }
      }

      return output;

    }

    async function cleanBookSummary(summary) {
      if (!summary) return '';
      return summary.replace(/(?:SUMMARY:|EDITORIAL REVIEW:)\s?(?:<br>|)/s, ''); // Remove HTML tags
    }


    // 5. Extract book data and transform
    const books = await Promise.all(record.map(async (book) => {

      const cover = await copyCoverImage(book.cover && book.cover[0]); // Copy cover images to the web directory

      const formats = catalogRemoteIds ? await getFormatsGoogleDriveIds(book, catalogRemoteIds) : '';

      const summary = await cleanBookSummary(book.comments && book.comments[0]);

      return {
        id: book.id[0],
        title: book.title[0]['_'], // The book title
        title_sort:book.title[0]['$']['sort'], // The book title for sorting
        authors: book.authors.map(item => item.author).join(', '),
        // language: book.languages && book.languages[0],
        cover: cover,
        // publisher: book.publisher && book.publisher[0],
        isbn: book.isbn && book.isbn[0],
        summary: summary,
        // pubdate: book.pubdate && book.pubdate[0],
        // links: buildLinks(book.identifiers && book.identifiers[0], book.title[0])
        added_date: (book.timestamp && book.timestamp[0]).slice(0, 10), // This is a date string
        added_timestamp: Date.parse(book.timestamp && book.timestamp[0]), // This is a propper timestamp
        formats: formats,
        series: book.series ? book.series[0]['_'].trim() || false : null,
        series_index: book.series ? parseInt(book.series[0]['$']['index']) || 0 : null,
        rating: book.rating ? parseFloat(book.rating[0]) || 0 : null,
        read: book._read ? book._read[0] === 'True' ? true : false : false
      };
    }));

    // Sort the books by added date descending. Default sort
    books.sort((a, b) => b.added_timestamp - a.added_timestamp);


    // 6. Render the HTML with Nunjucks
    nunjucks.configure({ autoescape: true });
    const template = nunjucks.compile(fs.readFileSync(__dirname + '/template.njk', 'utf8')); // Put the HTML template in template.njk
    const htmlCode = template.render({ catalogTitle, books });

    // 7. Write the HTML to a file
    await fs.writeFile(webPath + '/index.html', htmlCode);
    console.log('Successfully generated index.html');

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
