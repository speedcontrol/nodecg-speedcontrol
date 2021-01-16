<i18n>
{
  "en": {
    "panelTitle": "Checklist",
    "notEnabled": "Checklist is not enabled.",
    "emptyItems": "Checklist is empty."
  },
  "ja": {
    "panelTitle": "チェックリスト",
    "notEnabled": "チェックリストが有効になっていません。",
    "emptyItems": "チェックリストが空です。"
  }
}
</i18n>

<template>
  <v-app>
    <div v-if="!config.enabled">
      {{ $t('notEnabled') }}
    </div>
    <div v-else>
      <div v-if="checklist.length === 0">
        {{ $t('emptyItems') }}
      </div>
      <v-switch
        v-for="checkbox in checklist"
        :key="checkbox.name"
        :label="checkbox.name"
        :value="true"
        :input-value="checkbox.complete"
        @change="toggleCheckbox(checkbox.name, $event !== null)"
      />
    </div>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { CheckList } from 'types';
import { Configschema } from 'configschema';

@Component({
  components: {
  },
})
export default class extends Vue {
  @State checklist!: CheckList;

  get config(): Configschema['checklist'] {
    return (nodecg.bundleConfig as Configschema).checklist;
  }

  async toggleCheckbox(name: string, complete: boolean): Promise<void> {
    try {
      await nodecg.sendMessage('toggleCheckbox', { name, complete });
      // checklist change successful
    } catch (err) {
      // catch
    }
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
</style>
