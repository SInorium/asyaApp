import { InquiryStatus, inquiryStatusLabels } from '@asya/shared';
import { Select } from '@asya/ui/components/input';
import { getRouteApi } from '@tanstack/react-router';
import { InquiriesTable } from './inquiries-table';

const route = getRouteApi('/_authed/inquiries');

export function InquiriesPage() {
  const { status } = route.useSearch();
  const navigate = route.useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Заявки</h1>
        <Select
          aria-label="Фильтр по статусу"
          className="w-44"
          value={status ?? ''}
          onChange={(e) =>
            navigate({
              search: { status: (e.target.value || undefined) as InquiryStatus | undefined },
            })
          }
        >
          <option value="">Все</option>
          {InquiryStatus.options.map((s) => (
            <option key={s} value={s}>
              {inquiryStatusLabels[s]}
            </option>
          ))}
        </Select>
      </header>
      <InquiriesTable status={status} />
    </div>
  );
}
