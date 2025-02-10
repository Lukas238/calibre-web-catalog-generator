
const path = require('path');
const xml2js = require('xml2js');
const nunjucks = require('nunjucks');
const fs = require('fs-extra');
const { get } = require('http');


// Funtion to search and retrive cli arg value finding it by name
function getArgValue(argName) {
    const index = process.argv.findIndex(arg => arg === argName);
    if (index === -1) {
        return false; // Missing argument
    } else {
        if (!process.argv[index + 1]) {
            return null; // Argument value is missing
        } else {
            return process.argv[index + 1]; // Argument value
        }
    }
}

async function main() {
    try {

        const catalogPath = (getArgValue('--catalog-path') || '.').replace(/^\/|\/$/g, ''); // Default value is current directory

        const webPath = (getArgValue('--web-path') || 'web').replace(/^\/|\/$/g, ''); // Default value is 'web'

        // 2. Parse the catalog XML file
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
            if (!coverPath) return null;
            const fileExtension = path.extname(coverPath);
            const parentDir = path.dirname(coverPath);
            const grandparentDir = path.dirname(parentDir);
            const greatGrandparentDir = path.dirname(grandparentDir);
            const filename = makeSafeFilename(path.basename(greatGrandparentDir) + path.basename(parentDir)) + fileExtension;
            const newImagePath = path.join('covers', filename);
            try {
                await fs.copy(coverPath, path.join(webPath, newImagePath));
            } catch (error) {
                // Do nothing
            }
            return newImagePath;
        }

        async function getGoogleDriveId(book, catalogRemoteIds) {
            // Loop al formats and get the first epub format
            // if(!book.formats || !book.formats[0].format) return false;

            try {
                for (const format of book.formats[0].format) {
                    if (format.endsWith('.epub')) {
                        const bookName = format.split('/').slice(-2).join('/'); // Get the first format and extract the last two directories and the file name
                        return catalogRemoteIds.find(item => item.Path.includes(bookName))?.ID || false;
                    }
                }
                return false;
            } catch (e) {
                console.error(book.title[0]['_']);
            }
        }

        async function cleanBookSummary(summary) {
            if (!summary) return '';
            return summary.replace(/(?:SUMMARY:|EDITORIAL REVIEW:)\s?(?:<br>|)/s, ''); // Remove HTML tags
        }


        // 5. Extract book data and transform
        const books = await Promise.all(record.map(async (book) => {

            const cover = await copyCoverImage(book.cover && book.cover[0]); // Copy cover images to the web directory

            const googleDriveId = catalogRemoteIds ? await getGoogleDriveId(book, catalogRemoteIds) : '';

            const summary = await cleanBookSummary(book.comments && book.comments[0]);

            return {
                id: book.id[0],
                title: book.title[0]['_'],
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
                googleDriveId: googleDriveId
            };
        }));

        // 6. Render the HTML with Nunjucks
        nunjucks.configure({ autoescape: true });
        const template = nunjucks.compile(fs.readFileSync('template.njk', 'utf8')); // Put the HTML template in template.njk
        const htmlCode = template.render({ catalogTitle, books });

        // 7. Write the HTML to a file
        await fs.writeFile(webPath + '/index.html', htmlCode);
        console.log('Successfully generated index.html');

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
