<template>
  <v-app>
    <!-- Not enabled. -->
    <div v-if="!config.enabled">
      Twitch integration is not enabled.
    </div>
    <!-- Enabled but not logged in server-side. -->
    <div v-else-if="apiData.state === 'off'">
      <a
        :href="url"
        target="_blank"
      ><img src="./twitch-login.png"></a>
      Click the image above to connect to Twitch to auto-sync data.
    </div>
    <!-- Enabled, authenticating server-side. -->
    <div v-else-if="apiData.state === 'authenticating'">
      Authenticating...
    </div>
    <!-- Ready server-side. -->
    <div v-else>
      <div id="LogoutContainer">
        <v-btn
          id="Logout"
          small
          @click="logoutConfirm"
        >
          <v-icon small>
            mdi-logout
          </v-icon>
          <span>({{ apiData.channelName }})</span>
        </v-btn>
      </div>
      <div
        id="AutoSyncContainer"
      >
        <v-switch
          v-model="sync"
          inset
          hide-details
        ></v-switch>
        Auto-sync title/game<span
          v-if="config.ffzIntegration"
        >/featured channels</span>?
      </div>
      <v-text-field
        v-model="title"
        class="TextBox"
        label="Title"
        hide-details
        filled
        @input="inputActivity"
        @focus="inputActivity"
        @blur="inputActivity"
      ></v-text-field>
      <v-text-field
        v-model="game"
        class="TextBox"
        label="Game Directory"
        hide-details
        filled
        @input="inputActivity"
        @focus="inputActivity"
        @blur="inputActivity"
      ></v-text-field>
      <v-text-field
        v-if="config.ffzIntegration"
        v-model="users"
        class="TextBox"
        label="Featured Channels"
        hide-details
        filled
        @input="inputActivity"
        @focus="inputActivity"
        @blur="inputActivity"
      ></v-text-field>
      <v-btn
        block
        @click="updateChannelInfo"
      >
        Update
      </v-btn>
      <v-btn
        block
        @click="startCommercial"
      >
        Start 3m Commercial
      </v-btn>
    </div>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import _ from 'lodash';
import { nodecg } from '../_misc/nodecg';
import { Configschema } from '../../../configschema';
import { store } from '../_misc/replicant-store';

export default Vue.extend({
  data() {
    return {
      focus: false,
      title: '',
      game: '',
      users: '',
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
    sync: {
      get() {
        return store.state.twitchAPIData.sync;
      },
      set(value: boolean) {
        store.commit('updateTwitchSyncToggle', { value });
      },
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
    apiData: {
      handler() {
        this.updateInputs();
      },
      immediate: true,
    },
    channelInfo: {
      handler() {
        this.updateInputs();
      },
      immediate: true,
    },
  },
  created() {
    this.blurInput = _.debounce(this.blurInput, 20 * 1000);
  },
  methods: {
    inputActivity(evt: Event) {
      if (['input', 'focus'].includes(evt.type)) {
        this.focus = true;
        this.blurInput(evt);
      } else if (evt.type === 'blur') {
        this.focus = false;
      }
    },
    blurInput(evt: Event) {
      (evt.target as HTMLTextAreaElement).blur();
    },
    updateInputs() {
      if (!this.focus) {
        this.title = this.channelInfo.status;
        this.game = this.channelInfo.game;
        this.users = this.apiData.featuredChannels.join(', ');
      }
    },
    updateChannelInfo() {
      nodecg.sendMessage('updateChannelInfo', {
        status: this.title,
        game: this.game,
      }).then(() => {
        // successful
      }).catch(() => {
        // unsuccessful
      });
      if (this.config.ffzIntegration) {
        nodecg.sendMessage(
          'ffzUpdateFeaturedChannels',
          this.users.replace(/\s/g, '').split(','),
        ).then(() => {
          // successful
        }).catch(() => {
          // unsuccessful
        });
      }
    },
    startCommercial() {
      nodecg.sendMessage('startTwitchCommercial').then(() => {
        // successful
      }).catch(() => {
        // unsuccessful
      });
    },
    logoutConfirm() {
      const alertDialog = nodecg.getDialog('alert-dialog') as any;
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'TwitchLogoutConfirm',
        func: this.logout,
      });
    },
    logout(confirm: boolean) {
      if (confirm) {
        nodecg.sendMessage('twitchLogout').then(() => {
          // successful
        }).catch(() => {
          // unsuccessful
        });
      }
    },
  },
});
</script>

<style>
  .v-application--wrap {
    min-height: 0;
  }

  .theme--light.v-application {
    background-color: rgba(0,0,0,0);
  }
</style>

<style scoped>
  .v-btn {
    margin-top: 5px;
  }

  #AutoSyncContainer > .v-input {
    margin: 0;
    padding: 0;
  }

  #LogoutContainer {
    width: 100%;
    display: flex;
    padding: 0;
    justify-content: flex-end;
  }

  #AutoSyncContainer {
    display: flex;
    align-items: center;
    padding: 10px;
  }
</style>
