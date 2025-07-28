-- Maak de clients tabel aan
create table if not exists clients (
  id serial primary key,
  naam text not null,
  geboortedatum date,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Voeg client_id toe aan documents en maak een foreign key relatie
alter table documents add column if not exists client_id integer references clients(id); 