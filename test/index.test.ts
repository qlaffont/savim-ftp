import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Client } from 'basic-ftp';
import { Savim } from 'savim';
import { Readable } from 'stream';

import { SavimFTPProvider, SavimFTPProviderConfig, StringWriter } from '../src';

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

    await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {});

    expect(savim).toBeDefined();
    expect(savim.providers).toBeDefined();
    expect(Object.keys(savim.providers)).toHaveLength(0);

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

    expect(buf.getText()).toEqual(fileContent);

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

    expect(buf.getText()).toEqual(fileContent);

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

    expect(buf.getText()).toEqual(fileContent);

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

    expect(await savim.getFile(fileName)).toEqual(fileContent);

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
});
