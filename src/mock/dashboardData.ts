// Mock data voor Dashboard widgets MedDoc Pro
export const mockUser = {
  name: 'Sarah van Dijk',
  avatar: '/api/placeholder/32/32',
};

export const mockDocuments = [
  {
    id: 1,
    title: 'Verpleegplan Maria Jansen.pdf',
    date: '2025-07-17',
    type: 'Verpleegplan',
  },
  {
    id: 2,
    title: 'AW319 Declaratie 2025-07-15.pdf',
    date: '2025-07-15',
    type: 'Declaratie',
  },
  {
    id: 3,
    title: 'Indicatieverslag Piet Bakker.docx',
    date: '2025-07-14',
    type: 'Indicatieverslag',
  },
  {
    id: 4,
    title: 'Zorgovereenkomst Anna de Wit.pdf',
    date: '2025-07-13',
    type: 'Overeenkomst',
  },
];

export const mockAppointments = [
  { id: 1, date: '2025-07-19T10:00', client: 'Maria Jansen' },
  { id: 2, date: '2025-07-19T14:30', client: 'Piet Bakker' },
  { id: 3, date: '2025-07-20T09:15', client: 'Anna de Wit' },
];

export const mockTasks = [
  {
    id: 1,
    task: 'Medicatiecontrole',
    client: 'Maria Jansen',
    deadline: '2025-07-20',
  },
  {
    id: 2,
    task: 'Fysiotherapie begeleiding',
    client: 'Piet Bakker',
    deadline: '2025-07-21',
  },
  {
    id: 3,
    task: 'Rapportage afronden',
    client: 'Anna de Wit',
    deadline: '2025-07-22',
  },
];

export const mockActivityFeed = [
  {
    id: 1,
    activity: 'Document geüpload: Indicatieverslag.pdf',
    date: '2025-07-17',
  },
  { id: 2, activity: 'Afspraak toegevoegd: Anna de Wit', date: '2025-07-16' },
  { id: 3, activity: 'Taak afgerond: AW319 Declaratie', date: '2025-07-15' },
];
