// Mock data voor cliënten en documenten
export const mockClients = [
  {
    id: 1,
    name: 'Maria Jansen',
    bsn: '123456789',
    photo: '/api/placeholder/48/48',
    birthDate: '1952-03-12',
    address: 'Dorpsstraat 12, 1234 AB Amsterdam',
    phone: '0612345678',
    email: 'maria.jansen@email.com',
    documents: [1, 4],
    timeline: [
      { date: '2025-07-17', event: 'Afspraak: medicatiecontrole' },
      { date: '2025-07-15', event: 'Document geüpload: Verpleegplan.pdf' },
    ],
  },
  {
    id: 2,
    name: 'Piet Bakker',
    bsn: '987654321',
    photo: '/api/placeholder/48/48',
    birthDate: '1948-11-02',
    address: 'Lindelaan 7, 2345 CD Utrecht',
    phone: '0687654321',
    email: 'piet.bakker@email.com',
    documents: [2, 3],
    timeline: [
      { date: '2025-07-14', event: 'Afspraak: fysiotherapie' },
      { date: '2025-07-13', event: 'Document geüpload: Indicatieverslag.docx' },
    ],
  },
  {
    id: 3,
    name: 'Anna de Wit',
    bsn: '456789123',
    photo: '/api/placeholder/48/48',
    birthDate: '1960-06-25',
    address: 'Kerkstraat 22, 3456 EF Den Haag',
    phone: '0611122233',
    email: 'anna.dewit@email.com',
    documents: [4],
    timeline: [
      { date: '2025-07-13', event: 'Afspraak: intake' },
      { date: '2025-07-12', event: 'Document geüpload: Zorgovereenkomst.pdf' },
    ],
  },
];

export const mockAllDocuments = [
  {
    id: 1,
    title: 'Verpleegplan Maria Jansen.pdf',
    type: 'Verpleegplan',
    date: '2025-07-17',
    category: 'Zorgplan',
    clientId: 1,
  },
  {
    id: 2,
    title: 'AW319 Declaratie 2025-07-15.pdf',
    type: 'Declaratie',
    date: '2025-07-15',
    category: 'Declaratie',
    clientId: 2,
  },
  {
    id: 3,
    title: 'Indicatieverslag Piet Bakker.docx',
    type: 'Indicatieverslag',
    date: '2025-07-14',
    category: 'Verslag',
    clientId: 2,
  },
  {
    id: 4,
    title: 'Zorgovereenkomst Anna de Wit.pdf',
    type: 'Overeenkomst',
    date: '2025-07-13',
    category: 'Overeenkomst',
    clientId: 3,
  },
];
