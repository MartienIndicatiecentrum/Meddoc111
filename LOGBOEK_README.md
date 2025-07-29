# Logboek Functie

## Overzicht
De Logboek functie is een communicatie logboek voor het bijhouden van alle berichten en updates gerelateerd aan een cliënt. Het toont een chronologisch overzicht van alle communicatie tussen verschillende partijen.

## Functies

### 1. Header Sectie
- **Titel**: "Logboek -" met cliënt informatie
- **Cliënt Info**: "Client: Mw. P. Kroesen"
- **Sluit Knop**: X icoon om het logboek te sluiten

### 2. Filter en Zoek Sectie
Vier filter opties voor het zoeken in logboek entries:
- **Gewijzigd door**: Dropdown om te filteren op wie de entry heeft gemaakt
- **Type**: Dropdown om te filteren op type entry (Vraag, Antwoord, Update, Notitie)
- **Datum**: Input veld met kalender icoon voor datum filtering
- **Omschrijving**: Zoekveld om te zoeken in berichten

### 3. Logboek Entries Tabel
Een tabel met de volgende kolommen:
- **Datum**: Tijdstip van de entry
- **Van**: Afzender met gekleurde dot (blauw=clients, grijs=medewerkers, groen=verzekeraars, paars=familie)
- **Type**: Badge met type (geel=Vraag, groen=Antwoord, blauw=Update, grijs=Notitie)
- **Actie**: Beschrijving van de actie
- **Omschrijving**: Volledige tekst van het bericht
- **Status**: Status badges (rood=Urgent, oranje=Reactie nodig, grijs=Afgehandeld)

### 4. Nieuw Bericht Formulier
Formulier om nieuwe logboek entries toe te voegen:
- **Van**: Dropdown om afzender te selecteren
- **Type**: Dropdown om type te selecteren
- **Checkboxes**: "Urgent" en "Reactie nodig" opties
- **Bericht**: Grote tekstarea voor het bericht
- **Toevoegen Knop**: Met paper plane icoon

## Navigatie
De pagina is toegankelijk via:
- Sidebar menu: "Logboek" (met BookOpen icoon)
- URL: `/logboek`

## Technische Details

### Bestanden
- **Hoofdbestand**: `src/pages/Logboek.tsx`
- **Routing**: Toegevoegd aan `src/App.tsx`
- **Navigatie**: Toegevoegd aan `src/components/layout/Sidebar.tsx`

### Componenten Gebruikt
- Card, CardContent, CardHeader, CardTitle
- Button
- Input
- Badge
- Textarea
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Checkbox

### Icons
- Lucide React icons voor alle UI elementen

### Mock Data
De pagina gebruikt momenteel mock data voor demonstratie met voorbeelden van:
- Cliënt vragen
- Medewerker antwoorden
- Verzekeraar communicatie
- Familie berichten

## Kleurcodering

### Afzender Dots
- **Blauw**: Cliënten
- **Grijs**: Medewerkers
- **Groen**: Verzekeraars
- **Paars**: Familie

### Type Badges
- **Geel**: Vraag
- **Groen**: Antwoord
- **Blauw**: Update
- **Grijs**: Notitie

### Status Badges
- **Rood**: Urgent
- **Oranje**: Reactie nodig
- **Grijs**: Afgehandeld
- **Blauw**: In behandeling

## Gebruik
1. Navigeer naar "Logboek" via de sidebar
2. Gebruik de filters om specifieke entries te vinden
3. Bekijk de communicatie chronologie
4. Voeg nieuwe berichten toe via het formulier onderaan
5. Markeer berichten als urgent of reactie nodig indien nodig

## Toekomstige Verbeteringen
1. **Database integratie**: Echte data uit Supabase
2. **Real-time updates**: Live updates van nieuwe berichten
3. **Bestandsbijlagen**: Mogelijkheid om bestanden toe te voegen
4. **Notificaties**: Meldingen voor nieuwe berichten
5. **Export**: Export functionaliteit voor rapportages
6. **Email integratie**: Automatische email notificaties
7. **Zoek functionaliteit**: Geavanceerde zoekopties
8. **Bulk acties**: Meerdere entries tegelijk bewerken