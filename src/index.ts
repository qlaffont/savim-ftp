import { AccessOptions, Client, UploadOptions } from 'basic-ftp';
import { SavimProviderInterface } from 'savim';
import { Readable, Stream } from 'stream';

export type SavimFTPUploadFileParam = UploadOptions;

export type SavimFTPProviderConfig = AccessOptions;

export class SavimFTPProvider implements SavimProviderInterface {
  name = 'ftp';
  client = new Client();

  constructor(public config: SavimFTPProviderConfig) {
    this.client;
  }

  async isHealthy() {
    try {
      await this.client.access(this.config);
      await this.client.list();
      return true;
    } catch (err) {
      return false;
    }
  }

  async getFile(filenameWithPath: string) {
    const buf = new StringWriter();

    await this.client.downloadTo(buf, filenameWithPath);

    return buf.getText();
  }

  async uploadFile(
    filenameWithPath: string,
    content: string | Buffer | Stream,
    params?: SavimFTPUploadFileParam,
  ) {
    let fileStream: Readable;

    if (Buffer.isBuffer(content)) {
      fileStream = Readable.from(content);
    }

    if (content instanceof Readable) {
      fileStream = content;
    }

    if (typeof content === 'string') {
      fileStream = Readable.from(Buffer.from(content, 'utf8'));
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.client.uploadFrom(fileStream!, filenameWithPath, params);
  }

  async deleteFile(filenameWithPath: string) {
    await this.client.remove(filenameWithPath);
  }
}

// https://github.com/patrickjuchli/basic-ftp/blob/master/src/StringWriter.ts
import { Writable } from 'stream';

export class StringWriter extends Writable {
  protected buf = Buffer.alloc(0);

  _write(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunk: Buffer | string | any,
    _: string,
    callback: (error: Error | null) => void,
  ) {
    if (chunk instanceof Buffer) {
      this.buf = Buffer.concat([this.buf, chunk]);
      callback(null);
    } else {
      callback(new Error("StringWriter expects chunks of type 'Buffer'."));
    }
  }

  getText() {
    return this.buf.toString('utf8');
  }
}
