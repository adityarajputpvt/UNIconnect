/**
 * PGlite TCP Proxy
 * Exposes PGlite (WASM PostgreSQL) on a local TCP port using the
 * PostgreSQL wire protocol, so standard pg.Pool can connect to it.
 *
 * Protocol flow:
 *   Client → StartupMessage → Server sends AuthOk + ReadyForQuery
 *   Client → Query/Parse/Bind/Execute/Sync → forwarded to PGlite.execProtocolRaw
 *   PGlite response bytes → forwarded back to client
 */
import net from 'net';
import { PGlite } from '@electric-sql/pglite';

export const PROXY_PORT = 5433;
export const PROXY_HOST = '127.0.0.1';

let _server: net.Server | null = null;

// Pre-built startup response: AuthenticationOk + ParameterStatus(x4) + ReadyForQuery
function buildStartupResponse(): Buffer {
  const parts: Buffer[] = [];

  // AuthenticationOk: 'R' + len(8) + int32(0)
  parts.push(Buffer.from([0x52, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]));

  // ParameterStatus helper
  const ps = (name: string, value: string) => {
    const body = Buffer.concat([
      Buffer.from(name + '\x00', 'utf8'),
      Buffer.from(value + '\x00', 'utf8'),
    ]);
    const len = Buffer.alloc(4);
    len.writeInt32BE(body.length + 4, 0);
    return Buffer.concat([Buffer.from([0x53]), len, body]);
  };

  parts.push(ps('server_version', '17.0'));
  parts.push(ps('client_encoding', 'UTF8'));
  parts.push(ps('DateStyle', 'ISO, MDY'));
  parts.push(ps('TimeZone', 'UTC'));
  parts.push(ps('integer_datetimes', 'on'));

  // BackendKeyData: 'K' + len(12) + pid(4) + secret(4)
  parts.push(Buffer.from([0x4b, 0x00, 0x00, 0x00, 0x0c, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]));

  // ReadyForQuery: 'Z' + len(5) + 'I' (idle)
  parts.push(Buffer.from([0x5a, 0x00, 0x00, 0x00, 0x05, 0x49]));

  return Buffer.concat(parts);
}

export async function startPGliteProxy(db: PGlite): Promise<void> {
  return new Promise((resolve, reject) => {
    _server = net.createServer((socket) => {
      let buf = Buffer.alloc(0);
      let startupDone = false;
      let pendingMessages = Buffer.alloc(0);
      let processing = false;

      const flush = async () => {
        if (processing || pendingMessages.length === 0) return;
        processing = true;

        const batch = pendingMessages;
        pendingMessages = Buffer.alloc(0);

        try {
          const response = await db.execProtocolRaw(batch);
          if (!socket.destroyed) socket.write(response);
        } catch (err) {
          console.error('[PGlite proxy] execProtocolRaw error:', err);
          // Send ErrorResponse + ReadyForQuery
          const msg = String(err);
          const errBody = Buffer.from(`SERROR\x00VERROR\x00M${msg}\x00\x00`, 'utf8');
          const errLen = Buffer.alloc(4);
          errLen.writeInt32BE(errBody.length + 4, 0);
          const errPkt = Buffer.concat([Buffer.from([0x45]), errLen, errBody]);
          const rfq = Buffer.from([0x5a, 0x00, 0x00, 0x00, 0x05, 0x49]);
          if (!socket.destroyed) socket.write(Buffer.concat([errPkt, rfq]));
        }

        processing = false;
        if (pendingMessages.length > 0) flush();
      };

      socket.on('data', (chunk: Buffer) => {
        buf = Buffer.concat([buf, chunk]);

        if (!startupDone) {
          // Startup message: first 4 bytes = total length
          if (buf.length < 4) return;
          const msgLen = buf.readInt32BE(0);
          if (buf.length < msgLen) return;

          // Consume startup message, send auth response
          buf = buf.slice(msgLen);
          startupDone = true;
          socket.write(buildStartupResponse());

          // Process any remaining bytes
          if (buf.length > 0) socket.emit('data', Buffer.alloc(0));
          return;
        }

        // Accumulate frontend messages and forward to PGlite
        // We batch everything up to and including a Sync ('S') or simple Query ('Q')
        while (buf.length >= 5) {
          const msgType = buf[0];
          const msgLen = buf.readInt32BE(1); // length includes itself but not the type byte
          const totalLen = 1 + msgLen;

          if (buf.length < totalLen) break;

          const msg = buf.slice(0, totalLen);
          buf = buf.slice(totalLen);

          if (msgType === 0x58) {
            // Terminate
            socket.destroy();
            return;
          }

          pendingMessages = Buffer.concat([pendingMessages, msg]);

          // Flush on Query ('Q'), Sync ('S'), or Execute ('E') without following Sync
          if (msgType === 0x51 || msgType === 0x53) {
            flush();
          }
        }

        // If we have pending messages and nothing more is coming, flush
        if (pendingMessages.length > 0) flush();
      });

      socket.on('error', () => {});
      socket.on('close', () => {});
    });

    _server!.listen(PROXY_PORT, PROXY_HOST, () => {
      console.log(`🔌 PGlite TCP proxy → ${PROXY_HOST}:${PROXY_PORT}`);
      resolve();
    });

    _server!.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`ℹ️  PGlite proxy already on :${PROXY_PORT}`);
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function stopProxy(): void {
  _server?.close();
  _server = null;
}
