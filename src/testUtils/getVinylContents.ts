import concatStream from 'concat-stream';
import Vinyl from 'vinyl';

export default function getVinylContents(file: Vinyl): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (file.isBuffer()) {
            resolve(file.contents.toString());
        } else if (file.isStream()) {
            file.contents.pipe(
                concatStream({ encoding: 'string' }, str => {
                    // Typing for concatStream is broken, thinks it always returns buffers
                    // tslint:disable-next-line:no-any
                    resolve(str as any);
                })
            );
        } else {
            reject(new Error(`Unknown Vinyl file type for path: ${file.path}`));
        }
    });
}
