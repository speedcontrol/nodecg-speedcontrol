<i18n>
{
  "en": {
    "externalIDHelp": "If you have a column in your schedule with a unique ID for each run, select it here. This will make re-imports much smoother. If you don't understand this, don't select one."
  },
  "jp": {
    "externalIDHelp": "スケジュールの各データにユニークIDを含む列がある場合、こちらを選択してください。これにより再インポートがスムーズになります。よくわからない場合は選択しないでください。"
  }
}
</i18n>

<template>
  <div class="d-flex">
    <v-select
      v-model="selected"
      :items="dropdownOpts"
      :label="option.name"
      filled
      single-line
      hide-details
      dense
      :height="27"
    >
      <template v-slot:prepend-item>
        <v-list-item disabled>
          <v-list-item-content>
            <v-list-item-title>
              {{ option.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider class="mb-2" />
      </template>
    </v-select>
    <!-- Help Tooltip for External ID -->
    <template v-if="option.key === 'externalID'">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-icon
            small
            :style="{ 'padding-left': '2px' }"
            v-on="on"
          >
            mdi-help-circle-outline
          </v-icon>
        </template>
        <span>{{ $t('externalIDHelp') }}</span>
      </v-tooltip>
    </template>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { storeModule } from '../store';

@Component
export default class extends Vue {
  @Prop({
    type: Object,
    default: {
      name: 'Game',
      key: 'game',
      custom: false,
    },
  }) readonly option!: { name: string, key: string, custom: boolean };
  @Prop({ type: Array, required: true }) readonly columns!: string[];

  get dropdownOpts(): { value: number, text: string }[] {
    return [
      {
        value: -1,
        text: this.$t('notApplicable') as string,
      },
    ].concat(
      this.columns.map((value, index) => ({
        value: index,
        text: value,
      })),
    );
  }

  get selected(): number | null {
    if (this.option.custom) {
      return storeModule.opts.columns.custom[this.option.key];
    }
    return (storeModule.opts.columns as unknown as { [k: string]: number | null })[this.option.key];
  }
  set selected(value: number | null) {
    storeModule.updateColumn({
      name: this.option.key,
      value,
      custom: this.option.custom,
    });
  }
}
</script>
