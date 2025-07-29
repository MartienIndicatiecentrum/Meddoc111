# Lopende Zaken Pagina

## Overzicht
De "Lopende zaken" pagina is een Kanban board interface voor het beheren van zorgprocessen. De pagina toont een overzicht van alle actieve zorgprocessen in verschillende stadia.

## Functies

### 1. Header Sectie
- **Titel**: "Lopende Processen" met een grafiek icoon
- **Subtitel**: "Overzicht van alle actieve zorgprocessen"
- **View Toggles**: Schakel tussen Kanban en Lijst weergave

### 2. Samenvatting Kaarten
Drie kaarten die belangrijke statistieken tonen:
- **Urgente Processen**: Aantal urgente processen (rood icoon)
- **Verlopen Deadlines**: Aantal processen met verlopen deadlines (oranje klok icoon)
- **Afgeronde Processen**: Aantal voltooide processen (groen vinkje icoon)

### 3. Filter en Zoekbalk
- **Zoekveld**: Filter op cliënt naam
- **Filter knoppen**:
  - Urgent
  - Verlopen
  - Afgerond
  - Alles

### 4. Kanban Board
Vijf kolommen die verschillende stadia van het proces vertegenwoordigen:

1. **Niet gestart** (grijs)
2. **In behandeling** (blauw)
3. **Wachten op info** (geel)
4. **Opvolging** (paars)
5. **Afgerond** (groen)

### 5. Proces Kaarten
Elke kaart bevat:
- **Titel**: Korte beschrijving van het proces
- **Actie iconen**: Bewerken, link, bijlagen, verwijderen
- **Cliënt tag**: Paarse tag met cliënt naam
- **Voortgangsbalk**: Visuele weergave van voortgang (0-100%)
- **Details**:
  - Type proces
  - Deadline
  - Prioriteit (Urgent/Hoog/Medium/Laag)
  - Verzekeraar
- **Status tags**: Verlopen, Urgent (indien van toepassing)

## Navigatie
De pagina is toegankelijk via:
- Sidebar menu: "Lopende zaken" (met BarChart3 icoon)
- URL: `/lopende-zaken`

## Technische Details

### Bestanden
- **Hoofdbestand**: `src/pages/LopendeZaken.tsx`
- **Routing**: Toegevoegd aan `src/App.tsx`
- **Navigatie**: Toegevoegd aan `src/components/layout/Sidebar.tsx`

### Componenten Gebruikt
- Card, CardContent, CardHeader, CardTitle
- Button
- Input
- Badge
- Progress (custom implementatie)

### Icons
- Lucide React icons voor alle UI elementen

### Mock Data
De pagina gebruikt momenteel mock data voor demonstratie. In productie zou dit vervangen worden door echte data uit de database.

## Toekomstige Verbeteringen
1. **Database integratie**: Echte data uit Supabase
2. **Drag & Drop**: Processen tussen kolommen slepen
3. **Real-time updates**: Live updates van proces status
4. **Filters**: Geavanceerde filtering opties
5. **Export**: Export functionaliteit voor rapportages
6. **Notificaties**: Meldingen voor deadlines en updates

## Gebruik
1. Navigeer naar "Lopende zaken" via de sidebar
2. Bekijk het overzicht van alle processen
3. Gebruik de filters om specifieke processen te vinden
4. Schakel tussen Kanban en Lijst weergave
5. Klik op actie iconen om processen te beheren