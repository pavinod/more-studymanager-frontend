import { computed, ComputedRef, ref, Ref } from 'vue';
import { defineStore } from 'pinia';
import { Study, StudyRole, StudyStatus } from '../generated-sources/openapi';
import { useImportExportApi, useStudiesApi } from '../composable/useApi';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useErrorHandling } from '../composable/useErrorHandling';
import { useStudyGroupStore } from './studyGroupStore';

export const useStudyStore = defineStore('study', () => {
  const { studiesApi } = useStudiesApi();
  const { importExportApi } = useImportExportApi();
  const { handleIndividualError } = useErrorHandling();
  const studyGroupStore = useStudyGroupStore();

  // State
  const study: Ref<Study> = ref({});
  const studies: Ref<Study[]> = ref([]);

  // Actions
  async function getStudy(studyId: number): Promise<void> {
    study.value = await studiesApi
      .getStudy(studyId)
      .then((response) => response.data)
      .catch((e: AxiosError) => {
        handleIndividualError(e, 'cannot fetch study');
        return study.value;
      });
  }
  async function updateStudy(studyResponse: Study) {
    if (study.value.studyId) {
      study.value = await studiesApi
        .updateStudy(study.value.studyId, studyResponse)
        .then((response) => response.data)
        .catch((e: AxiosError) => {
          handleIndividualError(e, 'cannot update study' + study.value.studyId);
          return study.value;
        });
    }
  }

  async function updateStudyStatus(status: StudyStatus) {
    if (study.value.studyId) {
      await studiesApi
        .setStatus(study.value.studyId, { status })
        .then(() => {
          study.value.status = status;
        })
        .catch((e: AxiosError) => {
          alert('Could not update study status');
          handleIndividualError(
            e,
            'Could not update study status' + study.value.studyId
          );
        });
    }
  }

  async function createStudy(study: Study): Promise<void> {
    await studiesApi
      .createStudy(study)
      .then((response) => {
        studies.value.push(response.data);
        studyGroupStore.studyGroups = [];
      })
      .catch((e: AxiosError) =>
        handleIndividualError(e, 'cannot create study')
      );
  }

  async function deleteStudy(studyId: number | undefined) {
    if (studyId) {
      await studiesApi
        .deleteStudy(studyId)
        .then(() => {
          const position = studies.value.findIndex(
            (studyItem) => studyItem.studyId === studyId
          );
          studies.value.splice(position, 1);
        })
        .catch((e: AxiosError) =>
          handleIndividualError(e, 'cannot delete study')
        );
    }
  }
  async function listStudies(): Promise<void> {
    studies.value = await studiesApi
      .listStudies()
      .then((response: AxiosResponse<Study[]>) => response.data)
      .catch((e: AxiosError) => {
        handleIndividualError(e, 'cannot list studies');
        return studies.value;
      });
  }
  async function updateStudyInStudies(changedStudy: Study) {
    const i = studies.value.findIndex(
      (studyItem) => studyItem.studyId === changedStudy.studyId
    );
    if (i > -1) {
      await studiesApi
        .updateStudy(changedStudy.studyId as number, changedStudy)
        .then(() => studies.value.splice(i, 1, changedStudy))
        .catch((e: AxiosError) =>
          handleIndividualError(e, 'cannot update study in studies')
        );
    }
  }

  async function importStudy(importedStudy: File) {
    await importExportApi
      .importStudy(importedStudy, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(() => {
        setTimeout(function () {
          listStudies();
        }, 100);
      })
      .catch((e: AxiosError) =>
        handleIndividualError(e, 'cannot import study')
      );
  }

  async function exportStudyConfig(studyId: number): Promise<void> {
    await importExportApi
      .exportStudy(studyId)
      .then((response: AxiosResponse) => {
        const filename: string = 'study_config_' + studyId + '.json';
        downloadJSON(filename, response.data);
      })
      .catch((e: AxiosError) => {
        handleIndividualError(e, 'cannot export study config');
      });
  }

  async function exportStudyData(studyId: number): Promise<void> {
    axios
      .get(`api/v1/studies/${studyId}/export/studydata`)
      .then((response) => {
        const filename: string = 'study_data_' + studyId + '.json';
        downloadJSON(filename, response.data);
      })
      .catch((e: AxiosError) => {
        handleIndividualError(e, 'cannot export study data');
      });
  }

  function downloadJSON(filename: string, file: File): void {
    const fileJSON = JSON.stringify(file);
    const link = document.createElement('a');
    if (link) {
      link.setAttribute(
        'href',
        'data:application/json; charset=utf-8,' + encodeURIComponent(fileJSON)
      );
      link.setAttribute('download', filename);
      link.style.display = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Getters
  const studyUserRoles: ComputedRef<Array<StudyRole>> = computed(() => [
    ...(study.value.userRoles || []),
  ]);
  const studyStatus: ComputedRef<StudyStatus> = computed(
    () => study.value.status || StudyStatus.Draft
  );
  const studyId: ComputedRef<number> = computed(() => study.value.studyId || 0);

  return {
    study,
    studies,
    getStudy,
    updateStudy,
    updateStudyStatus,
    listStudies,
    createStudy,
    deleteStudy,
    updateStudyInStudies,
    importStudy,
    exportStudyConfig,
    exportStudyData,
    studyUserRoles,
    studyStatus,
    studyId,
  };
});
