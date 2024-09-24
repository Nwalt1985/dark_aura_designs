import { pingEtsy } from '../../service/etsy';

(async () => {
  try {
    const ping = await pingEtsy();

    console.log(ping);

    return;
  } catch (error) {
    console.error(error);
  }
})();
