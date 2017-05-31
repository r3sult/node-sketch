const fs = require('fs');
const lib = require('../');

/**
 * This class represents the sketch file and all this content.
 * 
 * @property {JSZip} repo - The instance of JSZip containing the raw data
 * @property {Node} document - The document data
 * @property {Node} meta - The meta data
 * @property {Node} user - The user data
 * @property {Page[]} pages - Array with all pages of the document
 * @property {SharedStyle[]} sharedStyles - Array with all shared styles of the document
 * @property {SharedStyle[]} textStyles - Array with all text styles of the document
 * @property {Page|undefined} symbolsPage - The "Symbols" page if exists
 */
class Sketch {
  constructor(repo, document, meta, user, pages) {
    this._class = 'sketch';
    this.repo = repo;
    this.document = lib.create(this, document);
    this.meta = lib.create(this, meta);
    this.user = lib.create(this, user);
    this.pages = pages.map(page => lib.create(this, page));
  }

  get symbolsPage() {
    return this.pages.find(page => page.name === 'Symbols');
  }

  get sharedStyles() {
    return this.document.layerStyles.objects;
  }

  get textStyles() {
    return this.document.layerTextStyles.objects;
  }

  /**
   * Save the document as a sketch file
   * @example
   * ns.read('input.sketch').then((sketch) => {
   * 
   *  //modify the sketch data
   *  
   *  return sketch.save('output.sketch')
   * })
   * @param  {string} file - The file path
   * @return {Promise} A promise that is resolved when the file is saved
   */
  save(file) {
    const pagesFolder = this.repo.folder('pages');

    this.document.pages = this.pages.map(page => {
      this.repo.file(`pages/${page.do_objectID}.json`, JSON.stringify(page));

      return {
        _class: 'MSJSONFileReference',
        _ref_class: 'MSImmutablePage',
        _ref: `pages/${page.do_objectID}`
      };
    });

    this.repo.file('document.json', JSON.stringify(this.document));
    this.repo.file('meta.json', JSON.stringify(this.meta));
    this.repo.file('user.json', JSON.stringify(this.user));

    return new Promise((resolve, reject) => {
      this.repo
        .generateNodeStream({
          type: 'nodebuffer',
          streamFiles: true,
          compression: 'DEFLATE'
        })
        .pipe(fs.createWriteStream(file))
        .on('finish', () => {
          resolve(file);
        })
        .on('error', err => {
          reject(err);
        });
    });
  }
}

module.exports = Sketch;
