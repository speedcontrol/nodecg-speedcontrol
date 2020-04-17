<i18n>
{
  "en": {
    "panelTitle": "Twitch Control",
    "notEnabled": "Twitch integration is not enabled.",
    "twitchLogin": "Click the image above to login to Twitch to auto-sync data.",
    "authenticating": "Authenticating...",
    "logout": "Logout",
    "autosync": "Auto-sync title/game?",
    "autosyncFFZ": "Auto-sync title/game/featured channels?",
    "title": "Title",
    "gameDirectory": "Game Directory",
    "featuredChannels": "Featured Channels",
    "update": "Update",
    "startCommercial": "Start Commercial",
    "commercialRunning": "Commercial Running ({time} Remaining)"
  },
  "ja": {
    "panelTitle": "Twitch連携",
    "notEnabled": "Twitch連携が有効になっていません。",
    "twitchLogin": "上記の画像をクリックしTwitchにログインすることで、データの自動同期が行えます。",
    "authenticating": "認証中...",
    "logout": "ログアウト",
    "autosync": "タイトル/ゲームカテゴリーの同期を有効化しますか？",
    "autosyncFFZ": "タイトル/ゲームカテゴリーの同期を有効化しますか/注目のチャンネル？",
    "title": "タイトル",
    "gameDirectory": "ゲームカテゴリー",
    "featuredChannels": "注目のチャンネル",
    "update": "更新",
    "startCommercial": "広告を開始",
    "commercialRunning": "広告再生中 (残り{time}秒)"
  }
}
</i18n>

<template>
  <v-app>
    <!-- Not enabled. -->
    <div v-if="!config.enabled">
      {{ $t('notEnabled') }}
    </div>
    <!-- Enabled but not logged in server-side. -->
    <div v-else-if="apiData.state === 'off'">
      <a
        :href="url"
        target="_blank"
      ><img src="./twitch-login.png"></a>
      <br><em>{{ $t('twitchLogin') }}</em>
    </div>
    <!-- Enabled, authenticating server-side. -->
    <div v-else-if="apiData.state === 'authenticating'">
      {{ $t('authenticating') }}
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
          <span>{{ $t('logout') }}</span>
        </v-tooltip>
      </div>
      <div id="AutoSyncContainer">
        <v-switch
          v-model="sync"
          inset
          hide-details
        />
        <template v-if="!config.ffzIntegration">
          {{ $t('autosync') }}
        </template>
        <template v-else>
          {{ $t('autosyncFFZ') }}
        </template>
      </div>
      <v-text-field
        v-model="title"
        class="TextBox"
        :label="$t('title')"
        hide-details
        filled
        @input="inputActivity"
        @focus="inputActivity"
        @blur="inputActivity"
      />
      <v-text-field
        v-model="game"
        class="TextBox"
        :label="$t('gameDirectory')"
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
        :label="$t('featuredChannels')"
        hide-details
        filled
        @input="inputActivity"
        @focus="inputActivity"
        @blur="inputActivity"
      />
      <v-btn
        class="mt-2"
        block
        @click="updateChannelInfo"
      >
        {{ $t('update') }}
      </v-btn>
      <template v-if="['affiliate', 'partner'].includes(channelInfo.broadcaster_type)">
        <div
          v-if="timer.secondsRemaining <= 0"
          class="d-flex justify-center align-center mt-2"
        >
          <div
            class="flex-grow-1"
            :style="{
              'font-size': '0.9em',
              'line-height': '100%',
              'text-align': 'center',
            }"
          >
            {{ $t('startCommercial') }}
          </div>
          <v-btn
            v-for="(len, i) in [30, 60, 90, 120, 150, 180]"
            :key="i"
            class="ml-1"
            :style="{ padding: '0 6px' }"
            :min-width="0"
            @click="startCommercial(len)"
          >
            {{ formatSeconds(len) }}
          </v-btn>
        </div>
        <v-btn
          v-else
          class="mt-2"
          block
          disabled
        >
          {{ $t('commercialRunning', { time: commercialTimeRemaining }) }}
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
import { padTimeNumber } from '../_misc/helpers';

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
      const config = (nodecg.bundleConfig as Configschema).twitch;
      const scopes = [
        'channel_editor',
        'user_read',
        'chat:read',
        'chat:edit',
        'channel_commercial',
      ];
      if (config.additionalScopes) {
        const addScopes = config.additionalScopes.filter((s) => !scopes.includes(s));
        scopes.push(...addScopes);
      }
      return 'https://id.twitch.tv/oauth2/authorize'
      + `?client_id=${this.config.clientID}`
      + `&redirect_uri=${this.config.redirectURI}`
      + '&response_type=code'
      + `&scope=${scopes.join('+')}`
      + '&force_verify=true';
    },
    commercialTimeRemaining(): string {
      return this.formatSeconds(this.timer.secondsRemaining);
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
  mounted() {
    if (window.frameElement) {
      window.frameElement.parentElement.setAttribute('display-title', this.$t('panelTitle'));
    }
  },
  methods: {
    formatSeconds(sec: number): string {
      const minutes = Math.floor(sec / 60);
      const seconds = Math.floor(sec - minutes * 60);
      return `${minutes}:${padTimeNumber(seconds)}`;
    },
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
          this.users.replace(/\s/g, '').split(',').filter(Boolean),
        ).then(() => {
          // successful
        }).catch(() => {
          // unsuccessful
        });
      }
    },
    startCommercial(duration: number): void {
      nodecg.sendMessage('twitchStartCommercial', { duration }).then(() => {
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
