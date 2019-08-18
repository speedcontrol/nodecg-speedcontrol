<template>
  <div id="App">
    <!-- Not enabled -->
    <div v-if="!config.enabled">
      Twitch integration is not enabled.
    </div>
    <!-- Enabled but not logged in server-side -->
    <div v-else-if="apiData.state === 'off'">
      <a
        :href="url"
        target="_blank"
      ><img src="./twitch-login.png"></a>
      <br><br>Click the image above to connect to Twitch to auto-sync data.
    </div>
    <!-- Enabled, logging in server-side -->
    <div v-else-if="apiData.state === 'authenticating'">
      Authenticating...
    </div>
    <!-- Ready server-side -->
    <div v-else>
      <button
        id="Logout"
        @click="logout"
      >
        Logout ({{ apiData.channelName }})
      </button>
      <br><br><input
        v-model="title"
        @focus="focus = true"
        @blur="focus = false"
      >
      <input
        v-model="game"
        @focus="focus = true"
        @blur="focus = false"
      >
      <button @click="updateChannelInfo">
        Update
      </button>
      <br><br><button @click="startCommercial">
        Start 3m Commercial
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../_misc/nodecg';
import { Configschema } from '../../../configschema';
import { store } from '../_misc/replicant-store';

export default Vue.extend({
  data() {
    return {
      focus: false,
      title: '',
      game: '',
    };
  },
  computed: {
    config() {
      return nodecg.bundleConfig.twitch;
    },
    apiData() {
      return store.state.twitchAPIData;
    },
    channelInfo() {
      return store.state.twitchChannelInfo;
    },
    url() {
      const config = this.config as Configschema['twitch'];
      return `https://id.twitch.tv/oauth2/authorize
?client_id=${config.clientID}
&redirect_uri=${config.redirectURI}
&response_type=code
&scope=channel_editor+user_read+chat:read+chat:edit+channel_commercial
&force_verify=true`;
    },
  },
  watch: {
    channelInfo: {
      handler(val) {
        if (!this.focus) {
          this.title = val.status;
          this.game = val.game;
        }
      },
      immediate: true,
    },
  },
  methods: {
    updateChannelInfo() {
      nodecg.sendMessage('updateChannelInfo', {
        status: this.title,
        game: this.game,
      }).then(() => {
        // successful
      }).catch(() => {
        // unsuccessful
      });
    },
    startCommercial() {
      nodecg.sendMessage('startTwitchCommercial').then(() => {
        // successful
      }).catch(() => {
        // unsuccessful
      });
    },
    logout() {
      nodecg.sendMessage('twitchLogout').then(() => {
        // successful
      }).catch(() => {
        // unsuccessful
      });
    },
  },
});
</script>

<style scoped>
  input {
    box-sizing: border-box;
    width: 100%;
  }

  button {
    width: 100%;
  }

  #Logout {
    width: unset;
    float: right;
  }
</style>
