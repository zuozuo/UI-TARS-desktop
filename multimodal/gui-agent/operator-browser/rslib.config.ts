/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { defineConfig } from '@rslib/core';

const BANNER = `/**
* Copyright (c) 2025 Bytedance, Inc. and its affiliates.
* SPDX-License-Identifier: Apache-2.0
*/`;

export default defineConfig({
  source: {
    entry: {
      index: ['src/**'],
    },
  },
  lib: [
    {
      format: 'cjs',
      syntax: 'es2021',
      bundle: false,
      dts: true,
      banner: { js: BANNER },
    },
  ],
  output: {
    target: 'node',
    cleanDistPath: false,
    sourceMap: true,
  },
});
