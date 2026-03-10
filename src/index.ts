import { AccessOptions, Client, FTPResponse, UploadOptions } from 'basic-ftp';
import { join } from 'path';
import { SavimProviderInterface } from 'savim';
import { Readable, Stream, Writable } from 'stream';

export type SavimFTPUploadFileParam = UploadOptions;

export type SavimFTPProviderConfig = AccessOptions;

export class SavimFTPProvider implements SavimProviderInterface {
  constructor(
    public config: SavimFTPProviderConfig,
    public name = 'ftp',
    public client = new Client(),
  ) {}

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.access(this.config);
      await this.client.list();
      return true;
    } catch {
      return false;
    }
  }

  async getFile(filenameWithPath: string): Promise<string> {
    const buf = new StringWriter();

    await this.client.downloadTo(buf, filenameWithPath);

    return buf.getText();
  }

  async uploadFile(
    filenameWithPath: string,
    content: string | Buffer | Stream,
    params?: SavimFTPUploadFileParam,
  ): Promise<FTPResponse> {
    let fileStream: Readable;

    if (Buffer.isBuffer(content)) {
      fileStream = Readable.from(content);
    } else if (content instanceof Readable) {
      fileStream = content;
    } else {
      fileStream = Readable.from(Buffer.from(content as string, 'utf8'));
    }

    return this.client.uploadFrom(fileStream, filenameWithPath, params);
  }

  async deleteFile(filenameWithPath: string): Promise<void> {
    await this.client.remove(filenameWithPath);
  }

  async createFolder(filenameWithPath: string): Promise<void> {
    await this.client.ensureDir(filenameWithPath);
    await this.client.ensureDir('~');
  }

  async deleteFolder(filenameWithPath: string): Promise<void> {
    await this.client.removeDir(filenameWithPath);
  }

  async getFolders(path: string): Promise<string[]> {
    return (await this.client.list(path))
      .filter((v) => v.isDirectory === true)
      .map((v) => join(path, v.name));
  }

  async getFiles(path: string): Promise<string[]> {
    return (await this.client.list(path))
      .filter((v) => v.isFile === true)
      .map((v) => join(path, v.name));
  }
}

// https://github.com/patrickjuchli/basic-ftp/blob/master/src/StringWriter.ts
export class StringWriter extends Writable {
  protected buf: Buffer = Buffer.alloc(0);

  _write(
    chunk: Buffer | string | unknown,
    _encoding: string,
    callback: (error: Error | null) => void,
  ): void {
    if (chunk instanceof Buffer) {
      this.buf = Buffer.concat([this.buf, chunk]);
      callback(null);
    } else {
      callback(new Error("StringWriter expects chunks of type 'Buffer'."));
    }
  }

  getText(): string {
    return this.buf.toString('base64');
  }
}
