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
      <br><em>Click the image above to login to Twitch to auto-sync data.</em>
    </div>
    <!-- Enabled, authenticating server-side. -->
    <div v-else-if="apiData.state === 'authenticating'">
      Authenticating...
    </div>
    <!-- Ready server-side. -->
    <div v-else>
      <div id="LogoutContainer">
        <v-tooltip left>
          <template v-slot:activator="{ on }">
            <v-btn
              id="Logout"
              small
              @click="logoutConfirm"
              v-on="on"
            >
              <v-icon small>
                mdi-logout
              </v-icon>
              <span>({{ apiData.channelName }})</span>
            </v-btn>
          </template>
          <span>Logout</span>
        </v-tooltip>
      </div>
      <div id="AutoSyncContainer">
        <v-switch
          v-model="sync"
          inset
          hide-details
        />
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
      />
      <v-text-field
        v-model="game"
        class="TextBox"
        label="Game Directory"
        hide-details
        filled
        @input="inputActivity"
        @focus="inputActivity"
        @blur="inputActivity"
      />
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
      />
      <v-btn
        block
        @click="updateChannelInfo"
      >
        Update
      </v-btn>
      <template v-if="['affiliate', 'partner'].includes(channelInfo.broadcaster_type)">
        <v-btn
          v-if="timer.secondsRemaining <= 0"
          block
          @click="startCommercial"
        >
          Start 3m Commercial
        </v-btn>
        <v-btn
          v-else
          block
          disabled
        >
          Commercial Running ({{ timer.secondsRemaining }}s Remaining)
        </v-btn>
      </template>
    </div>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { debounce } from 'lodash';
import { nodecg } from '../_misc/nodecg';
import { Configschema } from '../../../configschema';
import { store } from '../_misc/replicant-store';
import { TwitchAPIData, TwitchChannelInfo, TwitchCommercialTimer } from '../../../schemas';

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
    config(): Configschema['twitch'] {
      return nodecg.bundleConfig.twitch;
    },
    apiData(): TwitchAPIData {
      return store.state.twitchAPIData;
    },
    channelInfo(): TwitchChannelInfo {
      return store.state.twitchChannelInfo;
    },
    timer(): TwitchCommercialTimer {
      return store.state.twitchCommercialTimer;
    },
    sync: {
      get(): boolean {
        return store.state.twitchAPIData.sync;
      },
      set(value: boolean): void {
        store.commit('updateTwitchSyncToggle', { value });
      },
    },
    url(): string {
      return 'https://id.twitch.tv/oauth2/authorize'
      + `?client_id=${this.config.clientID}`
      + `&redirect_uri=${this.config.redirectURI}`
      + '&response_type=code'
      + '&scope=channel_editor+user_read+chat:read+chat:edit+channel_commercial'
      + '&force_verify=true';
    },
  },
  watch: {
    apiData: {
      handler(): void {
        this.updateInputs();
      },
      immediate: true,
    },
    channelInfo: {
      handler(): void {
        this.updateInputs();
      },
      immediate: true,
    },
  },
  created() {
    this.blurInput = debounce(this.blurInput, 20 * 1000);
  },
  methods: {
    inputActivity(evt: Event): void {
      if (['input', 'focus'].includes(evt.type)) {
        this.focus = true;
        this.blurInput(evt);
      } else if (evt.type === 'blur') {
        this.focus = false;
      }
    },
    blurInput(evt: Event): void {
      (evt.target as HTMLTextAreaElement).blur();
    },
    updateInputs(): void {
      if (!this.focus) {
        this.title = this.channelInfo.status;
        this.game = this.channelInfo.game;
        this.users = this.apiData.featuredChannels.join(', ');
      }
    },
    updateChannelInfo(): void {
      nodecg.sendMessage('twitchUpdateChannelInfo', {
        status: this.title,
        game: this.game,
      }).then((noTwitchGame) => {
        if (noTwitchGame) {
          const alertDialog = nodecg.getDialog('alert-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
          alertDialog.querySelector('iframe').contentWindow.open({
            name: 'NoTwitchGame',
          });
        }
      }).catch(() => {
        // unsuccessful
      });
      if (this.config.ffzIntegration) {
        nodecg.sendMessage(
          'updateFeaturedChannels',
          this.users.replace(/\s/g, '').split(','),
        ).then(() => {
          // successful
        }).catch(() => {
          // unsuccessful
        });
      }
    },
    startCommercial(): void {
      nodecg.sendMessage('twitchStartCommercial', { duration: 180 }).then(() => {
        // successful
      }).catch(() => {
        // unsuccessful
      });
    },
    logoutConfirm(): void {
      const alertDialog = nodecg.getDialog('alert-dialog') as any; // eslint-disable-line @typescript-eslint/no-explicit-any, max-len
      alertDialog.querySelector('iframe').contentWindow.open({
        name: 'TwitchLogoutConfirm',
        func: this.logout,
      });
    },
    logout(confirm: boolean): void {
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
