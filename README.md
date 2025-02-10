# calibre-web-catalog-generator

A Node.js cli tool for generation a web catalog for your Calibre library.

Optionaly, it can include a download button for the EPUB files stored in a Google Drive folder.

## Features
- Generate a single-page web page from a Calibre library catalog.
- Includes:
  - Cover images.
  - Meta data: Title, Author, ISBN, and Summary.
  - EPUB download button.
- Search bar to filter books by title.
- Sort books by title, author, or date added.

## How to use

1. Sync up the Calibre library with Google Drive using `rclone`.
    ``` bash
    rclone sync ~/eBooksLibraries/eBooks238 gDrive:eBooksLibraries/eBooks238 -v --progress
    ```
    - `~/eBooksLibraries/eBooks238`: Path to your local calibre library folder. Use the path to your own library.
    - `gDrive:eBooksLibraries/eBooks238`: Remote and path to the Google Drive folder. Use the remote name you configured with `rclone`, and the path to your own Google Drive folder.
2. Retrive the Google Drive files IDs from all the files on the library.
    ``` bash
    rclone lsjson gDrive:eBooksLibraries/eBooks238 -R --files-only --no-mimetype --no-modtime > eBooks238_gdrive_ids.json
    ```
    - `eBooks238_gdrive_ids.json`: Output filename path for the Google Drive files IDs. You can use any name you want.
3. Use `calibredb` command to export the Calibre library catalog as an `.xml` file.
    ``` bash
    calibredb catalog --library-path ~/eBooksLibraries/eBooks238 eBooks238_catalog.xml  --catalog-title "Lukas238's eBooks Library"
    ```
   - `--library-path`: Path to the Calibre library.
   - `--catalog-title`: Title of the catalog.
        > This title will be used in the HTML web page.
4. Run the `catalog2web.js` script to generate the HTML web page.
    ``` bash
    node catalog2web.js --catalog-path eBooks238_catalog.xml --web-path eBooks238 --gdriveids-path eBooks238_gdrive_ids.json 
    ```
   - `--catalog-path`: Path to the exported catalog `.xml` file.
   - `--web-path`: Path to the output folder for the generated web site.
   - `--gdriveids-path`: Optional. Path to the exported Google Drive files IDs `.json` file.
        > If this path is not provided, the book download button will not be included in the web page.
5. The generated web page will be in the path you specified on the `--web-path` argument.
6. Open the `index.html` file in your browser to see the generated web page.
7. To publish the web page, you need to upload the index.html file and the `covers/` folder content to a web server.


## Configuration

### rclone
Configure rclone with your Google Drive account. 

1. Start the interactive configuration.
    ``` bash
    rclone config
    ```
2. Choose `n` for new remote.
3. Enter the remote name, for example `gDrive`.
4. Choose `18` for Google Drive remote type.
5. Press Enter key to leave empty the Google Client Id.
6. Press Enter key to leave empty the Google Client Secret.
7. Press Enter key to leave empty the service_account_file.
8.  Choose `1` for full access to all files.
9.  Choose `n` to not edit advanced config.
10. Choose `y` to authenticate using your web browser. Wait for your default web browser to open a new tab and complete the login to your Google drive account. When the login get completed, you will see a success message in the terminal. Go back to the terminal.
11. Choosee `n` to not configure this as Shared Drive.
12. Choose `y` to keep this remote config.
13. Choose `q` to quit the configuration.

### catalog2web

1. Install node.js dependenciesm.
    ``` bash
    npm i
    ```


## Help and Tips

### Test rclone remote connection

Use this command to get a list of all files on the remote path.

``` bash
rclone lsd gDrive:eBooksLibraries/
```

### Sync Up: From local directory to remote directory

``` bash
rclone sync ~/eBooksLibraries/ gDrive:eBooksLibraries/ -v --progress
```

### Sync Down: From Remote directory to local directory

``` bash    
rclone sync gDrive:eBooksLibraries/ ~/eBooksLibraries/ -v --progress
```



---

## Example commands

1. Export the library catalog as a `.xml` file.
``` bash
calibredb catalog --library-path ~/eBooksLibraries/eBooksIgnacio ~/eBooksLibraries/catalogs/ignacioCatalog.xml  --catalog-title "Ignacio's eBooks Library"

calibredb catalog --library-path ~/eBooksLibraries/eBooks238 ~/eBooksLibraries/catalogs/238Catalog.xml  --catalog-title "Lukas238's eBooks Library"
```
> **Note**: The catalogs folder must be created before running the command.
2. Retrive the Google Drive files ID.
```bash
rclone lsjson gDrive:eBooksLibraries/eBooksIgnacio -R --files-only --no-mimetype --no-modtime > catalogs/eBooksIgnacio_googleDrive_ids.json

rclone lsjson gDrive:eBooksLibraries/eBooks238 -R --files-only --no-mimetype --no-modtime > catalogs/238Catalog_googleDrive_ids.json
```
3. Run the `catlago2web.js` node script to generate the HTML web page from the catalog.
``` bash
node catalog2web.js --catalog-path ~/eBooksLibraries/catalogs/eBooks238_catalog.xml --web-folder webs/238Catalog --catalog-path ./catalogs

node catalog2web.js ~/eBooksLibraries/catalogs/238Catalog.xml --web-folder webs/238Catalog --catalog-folder ./catalogs
```


## Dependencies 

- [Calibre](https://calibre-ebook.com/)
- [rclone](https://rclone.org/)
- [Node.js](https://nodejs.org/)
  - [xml2js](https://www.npmjs.com/package/xml2js)
  - [nunjucks](https://www.npmjs.com/package/nunjucks)
  - [fs-extra](https://www.npmjs.com/package/fs-extra)
- [Google Drive account](https://www.google.com/drive/). For download EPUB button.
