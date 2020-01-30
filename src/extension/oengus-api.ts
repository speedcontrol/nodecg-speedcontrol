import needle, { NeedleResponse } from 'needle';
import { OengusSchedule, OengusUser, OengusLine, OengusRunType } from '../../types/Oengus';
import { get as ncgGet } from './util/nodecg';

const nodecg = ncgGet();

/**
 * 
 * @param endpoint 
 */
async function get(endpoint: string): Promise<NeedleResponse> {

  const requestLimit = 5;
  let requestTime = 0;
  try {
    nodecg.log.debug(`[Oengus] API request processing on ${endpoint}`);
    while (true) {
      requestTime++;
      const resp = await needle(
        'get',
        `https://oengus.io/api${endpoint}`,
        null,
        {
          headers: {
            'User-Agent': 'nodecg-speedcontrol',
            Accept: 'application/json',
          },
        },
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore: parser exists but isn't in the typings
      if (resp.parser !== 'json') {
        nodecg.log.error('[Oengus] Response was not JSON');
      } else if (resp.statusCode !== 200) {
        nodecg.log.error(`[Oengus] ${JSON.stringify(resp.body)}`);
      } else {
        nodecg.log.debug(`[Oengus] API request successful on ${endpoint}`);
        return resp;
      }
      // Throw error when request times reach the limit
      if (requestTime >= requestLimit) {
        throw new Error(`Requests were failed in ${requestLimit} times`)
      }
    }
  } catch (err) {
    nodecg.log.debug(`Oengus] API request error on ${endpoint}:`, err);
    throw err;
  }
}
