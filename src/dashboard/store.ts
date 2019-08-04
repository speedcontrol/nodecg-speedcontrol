import clone from 'clone';
import { ReplicantBrowser } from 'nodecg/types/browser'; // eslint-disable-line
import Vue from 'vue';
import Vuex from 'vuex';
import { RunData } from '../../types';

Vue.use(Vuex);

const replicantNames = ['runDataArray', 'runDataActiveRun'];
const replicants: ReplicantBrowser<unknown>[] = [];

export const store = new Vuex.Store({
  state: {
    runDataArray: [],
    runDataActiveRun: null,
    runData: {
      game: 'Inspector Gadget',
      gameTwitch: 'Inspector Gadget!',
      category: 'All Bosses Reverse Order',
      estimate: '04:20:00',
      system: 'Amiga',
      region: 'NTSC-J',
      release: '2002',
      setupTime: '00:15:00',
      teams: [
        {
          name: 'Dank Memers',
          id: '42069:)',
          players: [{
            id: '42069:)',
            name: 'zoton2',
            country: 'gb/eng',
            social: {
              twitch: 'zoton2',
            },
          }],
        },
      ],
    } as RunData,
  },
  mutations: {
    updateReplicant(state, { name, value }) {
      Vue.set(state, name, value);
    },
  },
});

replicantNames.forEach((name) => {
  const replicant = nodecg.Replicant(name);

  replicant.on('change', (newVal) => {
    store.commit('updateReplicant', {
      name: replicant.name,
      value: clone(newVal),
    });
  });

  replicants.push(replicant);
});

export async function createStore() {
  return NodeCG.waitForReplicants(...replicants).then(() => store);
}
