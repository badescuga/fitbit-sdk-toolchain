import Vinyl from 'vinyl';

import compileTranslations from './compileTranslations';
import { PassThrough, Writable } from 'stream';

const translationContents = 'msgid "foo"\nmsgstr "foo"';

function expectTranslationsForLanguages(done: jest.DoneCallback, ...languages: string[]) {
  const expected = new Set(languages);
  const actual = new Set<string>();

  return new Writable({
    objectMode: true,
    write(file: Vinyl, _, next) {
      if (actual.has(file.translationLanguage)) {
        done.fail(`Seen translations for ${file.translationLanguage} twice`);
      }
      actual.add(file.translationLanguage);
      next();
    },

    final(callback) {
      expect(actual).toEqual(expected);
      callback();
      done();
    },
  });
}

function translationFileSource(...paths: string[]) {
  const stream = new PassThrough({ objectMode: true });

  paths.forEach(path => stream.write(new Vinyl({
    path,
    contents: Buffer.from(translationContents),
  })));

  stream.end();

  return stream;
}

describe('when no files are piped', () => {
  it('succeeds with empty output', (done) => {
    compileTranslations()
      .on('error', done.fail)
      .resume()
      .on('end', done)
      .end();
  });
});

describe('when no .po files are piped in', () => {
  it('passes the files through', (done) => {
    const file = new Vinyl({
      path: 'en.po.txt',
      contents: Buffer.from('foo'),
    });

    const files = new Map<string, Vinyl>();

    compileTranslations()
      .on('error', done.fail)
      .on('data', (file: Vinyl) => files.set(file.relative, file))
      .on('end', () => {
        expect(files).toEqual(new Map<string, Vinyl>([['en.po.txt', file]]));
        done();
      })
      .end(file);
  });
});

it('grabs .po files from any directory', (done) => {
  translationFileSource('en.po', 'foo/es.po', 'foo/bar/fr.po')
    .pipe(compileTranslations())
    .on('error', done.fail)
    .pipe(expectTranslationsForLanguages(done, 'en', 'es', 'fr'));
});

it('normalizes the language tag of the file name', (done) => {
  translationFileSource('eN-us.po', 'DE.po')
    .pipe(compileTranslations())
    .on('error', done.fail)
    .pipe(expectTranslationsForLanguages(done, 'en-US', 'de'));
});

function compileExpectError(done: jest.DoneCallback) {
  return compileTranslations()
    .on('data', () => done.fail('got unexpected data'))
    .on('error', (error) => {
      expect(error).toMatchSnapshot();
      done();
    });
}

describe('rejects .po files whose names are not acceptable language tags', () => {
  it.each(['e.po', 'en-USA.po', 'sl-IT-nedis.po'])(
    '%s',
    (path: string, done: jest.DoneCallback) => {
      compileExpectError(done)
        .end(new Vinyl({
          path,
          contents: Buffer.from('foo'),
        }));
    },
  );
});

it('bails when multiple .po files of the same name are present', (done) => {
  translationFileSource('en.po', 'a/en.po')
    .pipe(compileExpectError(done));
});

it('bails when a .po file is malformed', (done) => {
  compileExpectError(done)
    .end(new Vinyl({
      path: 'en.po',
      contents: Buffer.from('definitely not gettext format'),
    }));
});

it('gracefully fails when a streaming-mode file is passed in', (done) => {
  compileExpectError(done)
    .end(new Vinyl({
      path: 'en.po',
      contents: new PassThrough(),
    }));
});

it('renames the transformed file, replacing the whole relative path', (done) => {
  translationFileSource('a/b/c/en-US.po')
    .pipe(compileTranslations())
    .on('data', (file: Vinyl) => {
      expect(file.relative).toBe('l/en-US');
      done();
    })
    .on('error', done.fail);
});
