/* eslint-disable @typescript-eslint/ban-ts-comment */
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Client } from 'basic-ftp';
import { Savim } from 'savim';
import { Readable } from 'stream';

import { SavimFTPProvider, SavimFTPProviderConfig, StringWriter } from '../src';

jest.mock('basic-ftp', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        //@ts-ignore
        access: () => {
          if (process.env.ERROR === 'true') {
            throw new Error('connect error');
          }

          return true;
        },
        //@ts-ignore
        downloadTo: (buf) => {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          buf._write(Buffer.from('test'), 't', () => {});
        },
        uploadFrom: jest.fn(),
        remove: jest.fn(),
        close: jest.fn(),
        ensureDir: jest.fn(),
        removeDir: jest.fn(),
        list: jest.fn().mockImplementation(() => {
          if (process.env.CREATE_FOLDER === 'true') {
            return [
              { name: 'foldertocreate', isDirectory: true, isFile: false },
            ];
          }

          if (process.env.LIST_FILE === 'true') {
            return [
              { name: 'foldertonotlist', isDirectory: true, isFile: false },
              { name: 'filetolist.txt', isDirectory: false, isFile: true },
            ];
          }

          return [
            { name: 'foldertolist', isDirectory: true, isFile: false },
            { name: 'filetonotlist.txt', isDirectory: false, isFile: true },
          ];
        }),
      };
    }),
  };
});

describe('Savim Local', () => {
  let client: Client;

  beforeAll(async () => {
    jest.clearAllMocks();
    client = new Client();

    await client.access({
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });
  });

  afterAll(async () => {
    client.close();
  });

  it('should be Defined', () => {
    expect(Savim).toBeDefined();
  });

  it('should be able to define log', () => {
    expect(new Savim('debug')).toBeDefined();
  });

  it('should be able to add provider', async () => {
    const savim = new Savim();

    try {
      process.env.ERROR = 'true';
      await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {});
    } catch (error) {
      process.env.ERROR = 'false';

      expect(savim).toBeDefined();
      expect(savim.providers).toBeDefined();
      expect(Object.keys(savim.providers)).toHaveLength(0);
    }

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    expect(savim).toBeDefined();
    expect(savim.providers).toBeDefined();
    expect(Object.keys(savim.providers)).toHaveLength(1);
  });

  it('should be able to upload file (string)', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const fileName = 'testupload.txt';
    const fileContent = 'test';

    await savim.uploadFile(fileName, fileContent);

    const buf = new StringWriter();

    await client.downloadTo(buf, fileName);

    expect(buf.getText()).toEqual(Buffer.from(fileContent).toString('base64'));

    await client.remove(fileName);
  });

  it('should be able to upload file (buffer)', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const fileName = 'testuploadbuffer.txt';
    const fileContent = 'test';

    await savim.uploadFile(fileName, Buffer.from(fileContent, 'utf8'));

    const buf = new StringWriter();

    await client.downloadTo(buf, fileName);

    expect(buf.getText()).toEqual(Buffer.from(fileContent).toString('base64'));

    await client.remove(fileName);
  });

  it('should be able to upload file (stream)', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const fileName = 'testuploadstream.txt';
    const fileContent = 'test';

    const s = new Readable();
    s.push(fileContent);
    s.push(null);

    await savim.uploadFile(fileName, s);

    const buf = new StringWriter();

    await client.downloadTo(buf, fileName);

    expect(buf.getText()).toEqual(Buffer.from(fileContent).toString('base64'));

    await client.remove(fileName);
  });

  it('should be able to get file', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const fileName = 'testget.txt';
    const fileContent = 'test';

    await client.uploadFrom(
      Readable.from(Buffer.from(fileContent, 'utf8')),
      fileName,
    );

    expect(
      Buffer.from(
        (await savim.getFile(fileName)) as string,
        'base64',
      ).toString(),
    ).toEqual(fileContent);

    await client.remove(fileName);
  });

  it('should be able to delete file', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const fileName = 'testdelete.txt';
    const fileContent = 'test';

    await client.uploadFrom(
      Readable.from(Buffer.from(fileContent, 'utf8')),
      fileName,
    );

    await savim.deleteFile(fileName);

    try {
      const buf = new StringWriter();

      await client.downloadTo(buf, fileName);
      expect('test').toThrow();
      // eslint-disable-next-line no-empty
    } catch (error) {}
  });

  it('should be able to create folder', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const folderName = 'foldertocreate';

    process.env.CREATE_FOLDER = 'true';
    await savim.createFolder(folderName);

    expect(
      (await client.list()).find((i) => i.name === folderName && i.isDirectory),
    ).toBeDefined();
    process.env.CREATE_FOLDER = 'false';

    await client.removeDir(folderName);
  });

  it('should be able to delete folder', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const folderName = 'foldertodelete';

    await client.ensureDir(folderName);

    await savim.deleteFolder(folderName);

    expect(
      (await client.list()).find((i) => i.name === folderName && i.isDirectory),
    ).not.toBeDefined();
  });

  it('should be able to list folder', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const folderName = 'foldertolist';
    const fileName = 'filetonotlist.txt';

    await client.ensureDir(folderName);
    await client.ensureDir('~');

    await client.uploadFrom(
      Readable.from(Buffer.from('test', 'utf8')),
      fileName,
    );

    expect(await savim.getFolders(`~`)).toEqual(['~/foldertolist']);

    await client.removeDir(folderName);
    await client.remove(fileName);
  });

  it('should be able to list files', async () => {
    const savim = new Savim();

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
      host: 'localhost',
      user: 'test',
      password: 'thisisapassword',
    });

    const folderName = 'foldertonotlist';
    const fileName = 'filetolist.txt';

    await client.ensureDir(folderName);
    await client.ensureDir('~');

    await client.uploadFrom(
      Readable.from(Buffer.from('test', 'utf8')),
      fileName,
    );
    process.env.LIST_FILE = 'true';
    expect(await savim.getFiles(`~`)).toEqual(['~/filetolist.txt']);
    process.env.LIST_FILE = 'false';

    await client.removeDir(folderName);
    await client.remove(fileName);
  });
});
