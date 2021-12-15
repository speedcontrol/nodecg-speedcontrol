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
      >
        <img src="./twitch-login.png">
      </a>
      <br><em>{{ $t('twitchLogin') }}</em>
    </div>
    <!-- Enabled, authenticating server-side. -->
    <div v-else-if="apiData.state === 'authenticating'">
      {{ $t('authenticating') }}
    </div>
    <!-- Ready server-side. -->
    <div v-else>
      <div
        :style="{
          width: '100%',
          display: 'flex',
          padding: 0,
          'justify-content': 'flex-end',
        }"
      >
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
      <div
        id="AutoSyncContainer"
        :style="{
          'display': 'flex',
          'align-items': 'center',
          padding: '10px',
        }"
      >
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
      <template v-if="['affiliate', 'partner'].includes(apiData.broadcasterType)">
        <div
          v-if="timer.secondsRemaining <= 0"
          class="d-flex justify-center align-center"
        >
          <div
            class="mt-2 mr-1"
            :style="{
              'min-width': '78px',
              'font-size': '0.9em',
              'line-height': '100%',
              'text-align': 'center',
            }"
          >
            {{ $t('startCommercial') }}
          </div>
          <div
            :class="{
              'd-flex': true,
              'flex-wrap': config.commercialsExtraButtons,
            }"
          >
            <v-btn
              v-for="(len, i) in commercialLengths"
              :key="i"
              class="mt-2 ml-1"
              :style="{ padding: '0 6px' }"
              :min-width="0"
              @click="startCommercial(len)"
            >
              {{ formatSeconds(len) }}
            </v-btn>
          </div>
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
import { Vue, Component, Watch } from 'vue-property-decorator';
import { debounce } from 'lodash';
import { TwitchAPIData, TwitchChannelInfo, TwitchCommercialTimer, Configschema } from '@nodecg-speedcontrol/types/schemas';
import { Alert } from '@nodecg-speedcontrol/types';
import { padTimeNumber, getDialog } from '../_misc/helpers';
import { replicantNS } from '../_misc/replicant_store';
import { storeModule } from './store';

@Component
export default class extends Vue {
  @replicantNS.State((s) => s.reps.twitchAPIData) readonly apiData!: TwitchAPIData;
  @replicantNS.State((s) => s.reps.twitchChannelInfo) readonly channelInfo!: TwitchChannelInfo;
  @replicantNS.State((s) => s.reps.twitchCommercialTimer) readonly timer!: TwitchCommercialTimer;
  focus = false;
  title = '';
  game = '';
  users = '';

  @Watch('apiData', { immediate: true })
  onAPIDataChange(): void {
    this.updateInputs();
  }

  @Watch('channelInfo', { immediate: true })
  onChannelInfoChange(): void {
    this.updateInputs();
  }

  get sync(): boolean {
    return this.apiData.sync;
  }
  set sync(val: boolean) {
    storeModule.updateSyncToggle(val);
  }

  get config(): Configschema['twitch'] {
    return (nodecg.bundleConfig as Configschema).twitch;
  }

  get url(): string {
    const scopes = [
      'channel:edit:commercial',
      'channel:manage:broadcast',
      'chat:read',
      'chat:edit',

      // Older, deprecated.
      'channel_editor',
      'user_read',
      'channel_commercial',
    ];
    if (this.config.additionalScopes) {
      const addScopes = this.config.additionalScopes.filter((s) => !scopes.includes(s));
      scopes.push(...addScopes);
    }
    return 'https://id.twitch.tv/oauth2/authorize'
    + `?client_id=${this.config.clientID}`
    + `&redirect_uri=${this.config.redirectURI}`
    + '&response_type=code'
    + `&scope=${scopes.join('+')}`
    + '&force_verify=true';
  }

  get commercialLengths(): number[] {
    const lengths = [30, 60, 90, 120, 150, 180];
    if (this.config.commercialsExtraButtons) {
      lengths.push(...[210, 240, 270, 300, 330, 360]);
    }
    return lengths;
  }

  get commercialTimeRemaining(): string {
    return this.formatSeconds(this.timer.secondsRemaining);
  }

  formatSeconds(sec: number): string {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec - minutes * 60);
    return `${minutes}:${padTimeNumber(seconds)}`;
  }

  inputActivity(evt: Event): void {
    if (['input', 'focus'].includes(evt.type)) {
      this.focus = true;
      this.blurInput(evt);
    } else if (evt.type === 'blur') {
      this.focus = false;
    }
  }

  blurInput(evt: Event): void {
    (evt.target as HTMLTextAreaElement).blur();
  }

  updateInputs(): void {
    if (!this.focus) {
      this.title = this.channelInfo.title as string;
      this.game = this.channelInfo.game_name as string;
      this.users = this.apiData.featuredChannels.join(', ');
    }
  }

  async updateChannelInfo(): Promise<void> {
    // temporary as this.users get refreshed inbetween updating twitch and ffz
    const usersTmp = this.users;

    try {
      const noTwitchGame = await nodecg.sendMessage('twitchUpdateChannelInfo', {
        status: this.title,
        game: this.game,
      });
      if (noTwitchGame) {
        const dialog = getDialog('alert-dialog') as Alert.Dialog;
        if (dialog) {
          dialog.openDialog({ name: 'NoTwitchGame' });
        }
      }
    } catch (err) {
      // catch
    }
    if (this.config.ffzIntegration) {
      try {
        await nodecg.sendMessage(
          'updateFeaturedChannels',
          usersTmp.replace(/\s/g, '').split(',').filter(Boolean),
        );
      } catch (err) {
        // catch
      }
    }
  }

  async startCommercial(duration: number): Promise<void> {
    try {
      await nodecg.sendMessage('twitchStartCommercial', { duration, fromDashboard: true });
    } catch (err) {
      // catch
    }
  }

  logoutConfirm(): void {
    const dialog = getDialog('alert-dialog') as Alert.Dialog;
    if (dialog) {
      dialog.openDialog({
        name: 'TwitchLogoutConfirm',
        func: this.logout,
      });
    }
  }

  async logout(confirm: boolean): Promise<void> {
    if (confirm) {
      try {
        await nodecg.sendMessage('twitchLogout');
      } catch (err) {
        // catch
      }
    }
  }

  created(): void {
    this.blurInput = debounce(this.blurInput, 20 * 1000);
  }

  mounted(): void {
    if (window.frameElement?.parentElement) {
      window.frameElement.parentElement.setAttribute(
        'display-title',
        this.$t('panelTitle') as string,
      );
    }
  }
}
</script>

<style scoped>
  #AutoSyncContainer > .v-input {
    margin: 0;
    padding: 0;
  }
</style>
