import { useInquiriesUpdateStatus } from '@asya/api-client/query';
import { InquiryStatus, inquiryStatusLabels } from '@asya/shared';
import { Select } from '@asya/ui/components/input';
import { useQueryClient } from '@tanstack/react-query';
import { inquiryKeys } from '../model/keys';

export function InquiryStatusSelect({ id, status }: { id: string; status: InquiryStatus }) {
  const queryClient = useQueryClient();
  const mutation = useInquiriesUpdateStatus({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: inquiryKeys.all() }) },
  });

  return (
    <Select
      aria-label="Статус заявки"
      className="h-8 w-36"
      value={mutation.variables?.data.status ?? status}
      disabled={mutation.isPending}
      onChange={(e) => mutation.mutate({ id, data: { status: e.target.value as InquiryStatus } })}
    >
      {InquiryStatus.options.map((s) => (
        <option key={s} value={s}>
          {inquiryStatusLabels[s]}
        </option>
      ))}
    </Select>
  );
}
