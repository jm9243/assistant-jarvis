import { systemAPI } from '@/services/api';
import type { SystemMetric, SoftwareItem } from '@/types';

export const systemService = {
  metrics: () => systemAPI.getStatus<SystemMetric>(),
  info: () => systemAPI.getInfo(),
  scan: () => systemAPI.scan<SoftwareItem[]>(),
};
