import { getInquiriesListQueryKey } from '@asya/api-client/query';

export const inquiryKeys = {
  all: () => [getInquiriesListQueryKey()[0]] as const,
};
