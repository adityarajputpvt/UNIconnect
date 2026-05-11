import Pusher from 'pusher';

declare global {
  // eslint-disable-next-line no-var
  var pusherServer: Pusher | undefined;
}

const pusherServer = global.pusherServer ?? new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

if (process.env.NODE_ENV !== 'production') {
  global.pusherServer = pusherServer;
}

export default pusherServer;
