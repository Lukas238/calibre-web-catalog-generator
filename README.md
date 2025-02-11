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
-  View as grid or list.
-  QR code generator to quick link and share the catalog.

## Installation

1. Install all prerequisites.
   - [Calibre].
   - Optional. Install [rclone]. **Note**: Skip it if you don't needed the EPUB download button for books stored in Google Drive.
   - Install [Node.js].
2. Install the `catalog2web` cli tool as a global package.
    ``` bash
    npm i -g
    ```
3. Optional. Configure [rclone] to access your Google Drive account. **Note**:  Skip it if you don't needed the EPUB download button for books stored in Google Drive.


## Configure rclone to access your Google Drive account

**Note**: Skip it if you don't needed the EPUB download button for books stored in Google Drive.

   1. Start the interactive configuration.`rclone config`
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


## How to use

1. Export calibre catalog to XML file.
    ``` bash
    calibredb catalog --library-path ~/my_calibre_library_path my_library.xml  --catalog-title "My eBooks Library"
    ```
    - `--library-path`: Argument to specify the path to the calibre library.
    - `my_library.xml`: Output file name for the catalog.
    - `--catalog-title`: Argument to specify the title of the catalog. It will be displayed in the web page.
    
    > Find more info about the `calibredb catalog` command [here](https://manual.calibre-ebook.com/generated/en/calibredb.html#catalog).
2. Optional. Sync your library with Google Drive and download Google Drive files info as `.json` file.
   > **Note**: Skip it if you don't needed the EPUB download button for books stored in Google Drive.
   1. Sync up local calibre book library files to  Google Drive using [rclone].
      ``` bash
      rclone sync ~/my_calibre_library_path gDrive:my_calibre_library_path -v --progress
      ```
      - `~/my_calibre_library_path`: Path to the local calibre library.
      - `gDrive`: Remote name configured in [rclone] for your Google Drive account.
      - `my_calibre_library_path`: Path to the calibre library in Google Drive.
   2. Download Google Drive files info as `.json` file using [rclone].
      ``` bash
      rclone lsjson gDrive:my_calibre_library_path -R --files-only --no-mimetype --no-modtime > my_library.json
       ```
      - `gDrive`: Remote name configured in [rclone] for your Google Drive account.
      - `my_calibre_library_path`: Path to the calibre library in Google Drive.
      - `my_library.json`: Output filename for the calibre library files metadata in Google Drive.
3. Generate web pages from calibre catalog XML file.
    ``` bash
    catalog2web --catalog-path my_library.xml --web-path my_web_library_path --gdriveids-path my_library.json
    ```
    - `--catalog-path`: Path to the calibre catalog XML file.
    - `--web-path`: Path to the output directory for the web page.
    - `--gdriveids-path`: Path to the Google Drive files metadata JSON file.
4. Done! Open the `index.html` file in the output directory with your web browser to view the catalog.


## Help and Tips

### Test rclone remote connection

Use this command to get a list of all files on the remote path.

``` bash
rclone lsd gDrive:my_calibre_library_path/
```

### Sync Up: From local directory to remote directory

``` bash
rclone sync ~/my_calibre_library_path/ gDrive:my_calibre_library_path/ -v --progress
```

### Sync Down: From Remote directory to local directory

``` bash    
rclone sync gDrive:my_calibre_library_path/ ~/my_calibre_library_path/ -v --progress
```

## Dependencies 

- [Calibre]
- [Node.js]
- [rclone]
- [Google Drive account]


[Calibre]: https://calibre-ebook.com/
[Node.js]: https://nodejs.org/
[rclone]: https://rclone.org/
[Google Drive account]: https://www.google.com/drive/
