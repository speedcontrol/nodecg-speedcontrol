import { isEqual } from 'lodash';
import { bundleConfig, processAck } from './util/helpers'; // eslint-disable-line object-curly-newline, max-len
import { get } from './util/nodecg';
import { Checkbox, CheckList } from '../../types';

const nodecg = get();
const config = bundleConfig();

let checklistNum = 0;
const checklist = config.checklist.items ? config.checklist.items.map((item) => {
  checklistNum += 1;
  return {
    name: `${checklistNum}. ${item}`,
    complete: false,
  };
}) : [] as CheckList;

const checklistRep = nodecg.Replicant<CheckList>('checklist', {
  defaultValue: checklist,
});

if (checklistRep.value) {
  const currentNameList = checklistRep.value.map((item) => item.name);
  const nameList = checklist.map((item) => item.name);
  if (!isEqual(currentNameList, nameList)) {
    checklistRep.value = nameList.map((name) => ({
      name,
      complete: false,
    }));
  }
}

/**
 * Used to update the checklist replicant.
 * @param payload Checkbox object.
 */
async function changeChecklist(checkbox: Checkbox): Promise<void> {
  try {
    if (!checklistRep.value) {
      throw new Error('Cannot read replicant of checklist.');
    }
    const item = checklistRep.value.find(
      (replicant) => replicant.name === checkbox.name,
    );
    if (!item) {
      throw new Error(`${checkbox.name} was not found.`);
    }
    item.complete = checkbox.complete;
    nodecg.log.debug(`[Checklist] Successfully changed checklist (${checkbox.name})`);
  } catch (err) {
    nodecg.log.debug('[Checklist] Could not successfully update Checklist:', err);
    throw err;
  }
}

/**
 * Used to reset the checklist replicant.
 */
async function resetChecklist(): Promise<void> {
  try {
    if (!checklistRep.value) {
      throw new Error('Cannot read replicant of checklist.');
    }

    checklistRep.value.forEach((item, index) => { checklistRep.value[index].complete = false; });
  } catch (err) {
    nodecg.log.debug('[Checklist] Could not successfully reset Checklist:', err);
    throw err;
  }
}

if (config.checklist.enabled) {
  nodecg.log.info('[Checklist] enabled');

  nodecg.listenFor('toggleCheckbox', (data, ack) => {
    changeChecklist(data)
      .then((list) => processAck(ack, null, list))
      .catch((err) => processAck(ack, err));
  });

  nodecg.listenFor('resetChecklist', (data, ack) => {
    resetChecklist()
      .then(() => processAck(ack, null))
      .catch((err) => processAck(ack, err));
  });
}
