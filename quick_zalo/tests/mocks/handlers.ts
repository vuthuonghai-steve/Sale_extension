/**
 * MSW Network Handlers Specification for Extension API Integration & Testing
 */
export interface MockResponse<T = unknown> {
  status: number;
  data: T;
}

export const defaultMockHandlers = {
  getContactInfo: (contactId: string): MockResponse => ({
    status: 200,
    data: {
      id: contactId,
      name: 'Mock Customer',
      phone: '0901234567',
      status: 'ACTIVE',
    },
  }),
  syncLogs: (logCount: number): MockResponse => ({
    status: 200,
    data: {
      synced: true,
      processedEntries: logCount,
      serverTimestamp: new Date().toISOString(),
    },
  }),
};
