import { handler } from '../dist/index.js';

const main = async () => {
  const result = await handler();
  console.log('handler returned:', result);
};

main();
