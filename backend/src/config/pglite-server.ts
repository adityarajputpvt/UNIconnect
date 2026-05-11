/**
 * PGlite TCP Proxy
 * Bridges the PostgreSQL wire protocol over a TCP socket to PGlite (WASM).
 * This lets standard pg/Prisma drivers connect to localhost:5433 with no
 * system PostgreSQL installation required.
 */
import { PGlite } from '@electric-sql/pglite';
import net from 'net';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data', 'pglite');
export const PGLITE_PORT = 5433;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _db: PGlite | null = null;

async function getDB(): Promise<PGlite> {
  if (!_db) {
    _db = new PGlite(DATA_DIR);
    await _db.waitReady;
  }
  return _db;
}

export async function startPGliteProxy(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🐘 Starting embedded PostgreSQL (PGlite)...');
      const db = await getDB();
      console.log('✅ PGlite engine ready');

      const server = net.createServer((socket) => {
        let buffer = Buffer.alloc(0);
        let startupDone = false;

        const sendToClient = (data: Uint8Array) => {
          if (!socket.destroyed) socket.write(data);
        };

        socket.on('data', async (chunk: Buffer) => {
          buffer = Buffer.concat([buffer, chunk]);

          try {
            if (!startupDone) {
              // Handle startup message (first 4 bytes = length, next 4 = protocol version)
              if (buffer.length < 8) return;
              const msgLen = buffer.readInt32BE(0);
              if (buffer.length < msgLen) return;

              const startupMsg = buffer.slice(0, msgLen);
              buffer = buffer.slice(msgLen);
              startupDone = true;

              // Send AuthenticationOk (R\x00\x00\x00\x08\x00\x00\x00\x00)
              // + ParameterStatus messages + BackendKeyData + ReadyForQuery
              const authOk = Buffer.from([
                0x52, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, // AuthenticationOk
              ]);
              const paramStatus = (name: string, value: string) => {
                const msg = Buffer.from(`S${name}\x00${value}\x00`);
                const len = Buffer.alloc(4);
                len.writeInt32BE(msg.length - 1 + 4, 0);
                return Buffer.concat([msg.slice(0, 1), len, msg.slice(1)]);
              };
              const readyForQuery = Buffer.from([
                0x5a, 0x00, 0x00, 0x00, 0x05, 0x49, // ReadyForQuery (idle)
              ]);

              sendToClient(Buffer.concat([
                authOk,
                paramStatus('server_version', '16.0'),
                paramStatus('client_encoding', 'UTF8'),
                paramStatus('DateStyle', 'ISO, MDY'),
                paramStatus('TimeZone', 'UTC'),
                readyForQuery,
              ]));

              // Process any remaining buffered data
              if (buffer.length > 0) socket.emit('data', Buffer.alloc(0));
              return;
            }

            // Process frontend messages
            while (buffer.length >= 5) {
              const msgType = buffer[0];
              const msgLen = buffer.readInt32BE(1);
              if (buffer.length < 1 + msgLen) break;

              const msgBody = buffer.slice(5, 1 + msgLen);
              buffer = buffer.slice(1 + msgLen);

              if (msgType === 0x51) {
                // Simple Query ('Q')
                const query = msgBody.toString('utf8').replace(/\x00$/, '');

                try {
                  const result = await db.execProtocolRaw(
                    Buffer.from(buildQueryMessage(query))
                  );
                  sendToClient(result);
                } catch (err: unknown) {
                  const errMsg = err instanceof Error ? err.message : String(err);
                  sendToClient(buildErrorResponse(errMsg));
                  sendToClient(Buffer.from([0x5a, 0x00, 0x00, 0x00, 0x05, 0x49]));
                }

              } else if (msgType === 0x58) {
                // Terminate ('X')
                socket.destroy();
                return;

              } else if (msgType === 0x50 || msgType === 0x42 || msgType === 0x44 || msgType === 0x45 || msgType === 0x53) {
                // Extended query protocol: Parse/Bind/Describe/Execute/Sync
                // Forward raw bytes to PGlite's protocol handler
                const rawMsg = buffer.slice(-(1 + msgLen + (buffer.length - (1 + msgLen))));
                const fullMsg = Buffer.concat([
                  Buffer.from([msgType]),
                  buffer.slice(-msgLen - 1, -msgLen - 1 + msgLen + 1).slice(0, 0), // placeholder
                ]);

                // Reconstruct the original message
                const original = Buffer.alloc(1 + msgLen);
                original[0] = msgType;
                original.writeInt32BE(msgLen, 1);
                msgBody.copy(original, 5);

                try {
                  const result = await db.execProtocolRaw(original);
                  sendToClient(result);
                } catch (err: unknown) {
                  const errMsg = err instanceof Error ? err.message : String(err);
                  sendToClient(buildErrorResponse(errMsg));
                  sendToClient(Buffer.from([0x5a, 0x00, 0x00, 0x00, 0x05, 0x49]));
                }
              }
            }
          } catch (err) {
            console.error('PGlite proxy error:', err);
          }
        });

        socket.on('error', () => {});
        socket.on('close', () => {});
      });

      server.listen(PGLITE_PORT, '127.0.0.1', () => {
        console.log(`🔌 PGlite proxy on 127.0.0.1:${PGLITE_PORT}`);
        resolve();
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`ℹ️  PGlite proxy already running on :${PGLITE_PORT}`);
          resolve();
        } else {
          reject(err);
        }
      });

    } catch (err) {
      reject(err);
    }
  });
}

function buildQueryMessage(query: string): Buffer {
  const queryBuf = Buffer.from(query + '\x00', 'utf8');
  const len = queryBuf.length + 4;
  const msg = Buffer.alloc(1 + len);
  msg[0] = 0x51; // 'Q'
  msg.writeInt32BE(len, 1);
  queryBuf.copy(msg, 5);
  return msg;
}

function buildErrorResponse(message: string): Buffer {
  const body = Buffer.from(`S\x00ERROR\x00M\x00${message}\x00\x00`, 'utf8');
  const len = body.length + 4;
  const msg = Buffer.alloc(1 + len);
  msg[0] = 0x45; // 'E'
  msg.writeInt32BE(len, 1);
  body.copy(msg, 5);
  return msg;
}
