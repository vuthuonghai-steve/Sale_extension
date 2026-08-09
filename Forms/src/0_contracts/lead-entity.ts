export interface LeadEntity {
  readonly teamName?: string;
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly address?: string;
  readonly viewTime?: string;
  readonly price?: string;
  readonly roomCode?: string;
  readonly salesName?: string;
  readonly rawNotes?: string;
}

export type LeadEntityKey = keyof LeadEntity;
