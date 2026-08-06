import type { ComponentType } from 'react';
import { moduleMeta as msgExtMeta, Component as MsgExtComponent } from './message-extraction';
import { moduleMeta as dataNormMeta, Component as DataNormComponent } from './data-normalization';

/**
 * ModuleDef — Định nghĩa contract cho một feature module UI trong Home Dashboard.
 */
export interface ModuleDef {
  /** ID định danh duy nhất — VD: 'message-extraction', 'crm', 'settings' */
  id: string;
  /** Tên hiển thị module */
  title: string;
  /** Mô tả ngắn về tính năng */
  description: string;
  /** Component React chính để render */
  component: ComponentType;
  /** Tên icon hoặc nhãn nhận diện (tùy chọn) */
  icon?: string;
  /** Badge trạng thái (tùy chọn: VD 'HOT', 'MỚI', 'PRO') */
  badge?: string;
}

/**
 * Registry chứa danh sách tất cả các UI Module khả dụng trong Extension.
 */
export const MODULES: ModuleDef[] = [
  {
    ...msgExtMeta,
    component: MsgExtComponent,
    icon: 'message-square',
    badge: 'Mới',
  },
  {
    ...dataNormMeta,
    component: DataNormComponent,
    icon: 'database',
    badge: 'Dexie DB',
  },
];
