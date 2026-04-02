export const statusOptions = ['Working on it', 'Stuck', 'Done']

export const statusColors = {
  'Working on it': 'bg-amber-100 text-amber-700',
  Stuck: 'bg-rose-100 text-rose-700',
  Done: 'bg-emerald-100 text-emerald-700',
}

export const defaultColumns = [
  { key: 'name', label: 'Name', type: 'text', minWidth: 240 },
  { key: 'status', label: 'Status', type: 'status', minWidth: 170 },
  { key: 'date', label: 'Date', type: 'date', minWidth: 150 },
  { key: 'effort', label: 'Effort', type: 'number', minWidth: 130 },
  { key: 'blocked', label: 'Blocked', type: 'boolean', minWidth: 130 },
  { key: 'owner', label: 'Owner', type: 'owner', minWidth: 180 },
]

export const initialRows = [
  {
    id: 'item-1',
    name: 'Route optimization rollout',
    status: 'Working on it',
    date: '2026-04-06',
    effort: 6,
    blocked: false,
    owner: 'Alex Kim',
  },
  {
    id: 'item-2',
    name: 'Driver safety training',
    status: 'Stuck',
    date: '2026-04-10',
    effort: 4,
    blocked: true,
    owner: 'Priya Shah',
  },
  {
    id: 'item-3',
    name: 'Vehicle health dashboard',
    status: 'Done',
    date: '2026-04-13',
    effort: 8,
    blocked: false,
    owner: 'Marcus Lee',
  },
]
