import { DataNormalizationScreen } from './ui/DataNormalizationScreen';

export const moduleMeta = {
  id: 'data-normalization',
  title: 'Chuẩn hóa Dữ liệu (Dexie DB)',
  description: 'Nạp file JSON datarow thô, lọc trùng 2 cấp, bóc tách dữ liệu và hiển thị Dual View Debug.',
};

export const Component = DataNormalizationScreen;
export { DataNormalizationScreen };
