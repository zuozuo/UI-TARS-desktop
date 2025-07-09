import {
  afterEach,
  beforeEach,
  beforeAll,
  afterAll,
  describe,
  expect,
  test,
} from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer, type GlobalConfig } from '../../src/server.js';
import express from 'express';
import { AddressInfo } from 'net';

describe('Browser Content Tests', () => {
  let client: Client;
  let app: express.Express;
  let httpServer: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();

    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Content Test Home</title></head>
          <body>
            <h1>Content Test Home</h1>
            <input type="text" placeholder="Test input" />
            <a href="/page1">Go to Page 1</a>
            <a href="/page2">Go to Page 2</a>
          </body>
        </html>
      `);
    });

    app.get('/page1', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Page 1</title></head>
          <body>
            <h1>This is Page 1</h1>
            <p>Content for page 1</p>
            <a href="/">Back to Home</a>
          </body>
        </html>
      `);
    });

    app.get('/page2', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Page 2</title></head>
          <body>
            <h1>This is Page 2</h1>
            <p>Content for page 2</p>
            <a href="/">Back to Home</a>
          </body>
        </html>
      `);
    });

    httpServer = app.listen(0);
    const address = httpServer.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
  });

  afterAll(async () => {
    await httpServer.close();
  });

  beforeEach(async () => {
    client = new Client(
      {
        name: 'test client',
        version: '1.0',
      },
      {
        capabilities: {
          roots: {
            listChanged: true,
          },
        },
      },
    );

    const server = createServer({
      launchOptions: {
        headless: true,
      },
    } as GlobalConfig);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    try {
      await client.callTool({
        name: 'browser_close',
      });
    } catch (error) {
      console.warn('Error closing browser in afterEach:', error);
    }
    await client.close();
  }, 30000);

  describe('browser_get_markdown', () => {
    test('should return markdown of the current page', async () => {
      await client.callTool({
        name: 'browser_navigate',
        arguments: { url: baseUrl },
      });

      const result = await client.callTool({
        name: 'browser_get_markdown',
        arguments: {},
      });
      expect(result.isError).toBe(false);
      expect(result.content?.[0].text).toMatchInlineSnapshot(`
        "Content Test Home

        # Content Test Home

         [Go to Page 1](/page1) [Go to Page 2](/page2)"
      `);
    });

    test('should return markdown of the current page with empty arguments', async () => {
      await client.callTool({
        name: 'browser_navigate',
        arguments: { url: baseUrl },
      });

      const result = await client.callTool({
        name: 'browser_get_markdown',
      });
      expect(result.isError).toBe(false);
      expect(result.content?.[0].text).toMatchInlineSnapshot(`
        "Content Test Home

        # Content Test Home

         [Go to Page 1](/page1) [Go to Page 2](/page2)"
      `);
    });
  });

  describe('browser_get_text', () => {
    test('should return text of the current page', async () => {
      await client.callTool({
        name: 'browser_navigate',
        arguments: { url: baseUrl },
      });

      const result = await client.callTool({
        name: 'browser_get_text',
        arguments: {},
      });
      expect(result.isError).toBe(false);
      expect(result.content?.[0].text).toMatchInlineSnapshot(`
        "Content Test Home
         Go to Page 1 Go to Page 2"
      `);
    });

    test('should return markdown of the current page with empty arguments', async () => {
      await client.callTool({
        name: 'browser_navigate',
        arguments: { url: baseUrl },
      });

      const result = await client.callTool({
        name: 'browser_get_text',
      });
      expect(result.isError).toBe(false);
      expect(result.content?.[0].text).toMatchInlineSnapshot(`
        "Content Test Home
         Go to Page 1 Go to Page 2"
      `);
    });
  });
});
