import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { SearchInput } from '../components/ui/SearchInput';
import { Pagination } from '../components/features/users/Pagination';
import { TopXpEarnersTable } from '../components/features/gamification/TopXpEarnersTable';
import { TableFooter } from '../components/ui/Table';
import { useTopEarnersQuery } from '../services/gamificationApi';
import type { DateRange } from '../utils/format';

const PAGE_SIZE = 14;

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end };
}

export function TopXpEarnersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRange>(defaultRange);
  const { data, isLoading, isFetching } = useTopEarnersQuery({
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Top XP Earners"
        subtitle="Track learner motivation and engagement through gamified activities."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} />
            <DateRangePicker value={range} onApply={setRange} />
          </>
        }
      />

      <TopXpEarnersTable items={data?.items ?? []} loading={isLoading} showEmail />

      {data ? (
        <TableFooter>
          <span>
            Showing {data.items.length === 0 ? 0 : (data.page - 1) * data.limit + 1} to{' '}
            {Math.min(data.page * data.limit, data.total)} of {data.total} users
          </span>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            disabled={isFetching}
          />
        </TableFooter>
      ) : null}
    </div>
  );
}
