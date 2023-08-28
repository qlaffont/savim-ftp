[![Test Coverage](https://api.codeclimate.com/v1/badges/1ceadff5f5ef77b2e8b6/test_coverage)](https://codeclimate.com/github/qlaffont/savim-ftp/test_coverage) [![Maintainability](https://api.codeclimate.com/v1/badges/1ceadff5f5ef77b2e8b6/maintainability)](https://codeclimate.com/github/qlaffont/savim-ftp/maintainability) ![npm](https://img.shields.io/npm/v/savim-ftp) ![npm](https://img.shields.io/npm/dm/savim-ftp) ![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/savim-ftp) ![NPM](https://img.shields.io/npm/l/savim-ftp)

# savim-ftp

A simple library to save file with Savim to a FTP Server. Old Owner: [@flexper](https://github.com/flexper)

## Usage

```typescript
import { Savim } from 'savim';
import { SavimFTPProviderConfig, SavimFTPProvider } from 'savim-ftp';

const savim = new Savim();

await savim.addProvider<SavimFTPProviderConfig>(SavimFTPProvider, {
  host: 'localhost',
  user: 'test',
  password: 'thisisapassword',
});

await savim.uploadFile('test.txt', 'thisisatest');
```

## Tests

To execute jest tests (all errors, type integrity test)

```
pnpm test
```

## Maintain

This package use [TSdx](https://github.com/jaredpalmer/tsdx). Please check documentation to update this package.
