import { atom } from 'jotai';
import { mapAtom } from 'utils';

type managerId = string;

export const managerIdsAtom = atom(new Set<managerId>());

export const managersAtom = mapAtom<managerId, unknown>();

export const managerMetricsAtom = mapAtom<managerId, unknown>();

export const managerParamsAtom = mapAtom<managerId, unknown>();
