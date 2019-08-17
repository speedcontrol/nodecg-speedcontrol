<template>
  <div id="App">
    <!-- Not enabled -->
    <div v-if="!config.enabled">
      Twitch integration is not enabled.
    </div>
    <!-- Enabled but not ready server-side -->
    <div v-else-if="!apiData.ready">
      <a
        :href="url"
        target="_blank"
      ><img src="./twitch-login.png"></a>
      <br><br>Click the image above to connect to Twitch to auto-sync data.
    </div>
    <!-- Ready server-side -->
    <div v-else>
      Title: {{ channelData.status }}
      <br>Game: {{ channelData.game }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { nodecg } from '../_misc/nodecg';
import { Configschema } from '../../../configschema';
import { store } from '../_misc/replicant-store';

export default Vue.extend({
  computed: {
    config() {
      return nodecg.bundleConfig.twitch;
    },
    apiData() {
      return store.state.twitchAPIData;
    },
    channelData() {
      return store.state.twitchChannelData;
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
});
</script>
