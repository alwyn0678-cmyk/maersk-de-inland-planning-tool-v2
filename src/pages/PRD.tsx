import Markdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FileText } from 'lucide-react';
import { motion } from 'motion/react';

const PRD_CONTENT = `
# Maersk DE Inland Planning Tool - PRD

## Goal and Problem Statement
Create a modern internal operations web app for Maersk DE Inland Operations. The tool replaces static spreadsheets and manual calculations, providing a fast, reliable, and deterministic way to calculate inland delivery and departure schedules.

## User Stories
- **As an Import Planner**, I want to enter a delivery postcode and vessel ETD so that I can see the next feasible inland departures, depot arrival dates, and customer delivery deadlines.
- **As an Export Planner**, I want to enter a loading postcode and time so that I can see ranked depot options and the earliest vessel CCO I can meet.
- **As an Operations Manager**, I want to see clear warnings for special cargo (e.g., IMO/Reefer via Duisburg) to prevent operational failures.

## Input Definitions
- **Postcode**: 5-digit German postal code. Only the first 2 digits are used for routing.
- **Container Type**: Standard (20DC, 40DC, 40HC), Reefer (20RF, 40RF), or Dangerous Goods (IMO).
- **Discharge Port / Port Terminal**: Rotterdam or Antwerp.
- **Vessel ETD**: Estimated Time of Departure of the deep-sea vessel.
- **Loading Date/Time**: When the container is loaded at the customer facility.

## Calculation Logic
### Import
1. **Routing**: Map 2-digit postcode prefix to 1 or more inland terminals.
2. **Availability**: If discharged, available today. If not, available ETD + 2 days.
3. **Feasible Departures**: Find the next scheduled departures from the port to the inland terminal after the availability date.
4. **Depot Arrival**: Departure Date + Transit Days.
5. **Customer Delivery**: Depot Arrival + 1 Business Day.
6. **Order Deadline**: Departure Date - 2 Business Days.
7. **Customs Deadline (Rotterdam)**: Departure Date - 1 Business Day.

### Export
1. **Routing**: Map 2-digit postcode prefix to inland terminals and ranked depots.
2. **Feasible Departures**: Find the next scheduled departures from the inland terminal to the port after the loading date/time. (Exclude next-day departures if loading is after 14:00).
3. **Arrival at Port**: Departure Date + Transit Days.
4. **Earliest Vessel CCO**: Arrival at Port - 1 Business Day.
5. **Latest Vessel ETA**: Arrival at Port + (Terminal YOT Hours / 24).

## Location Coordinates
For mapping and routing purposes, the following specific latitude and longitude coordinates are defined for the primary ports and inland terminals:

### Deep-Sea Ports
- **Rotterdam**: 51.9225° N, 4.47917° E
- **Antwerp**: 51.2194° N, 4.4025° E

### Inland Terminals (Germany)
- **Duisburg**: 51.4344° N, 6.7623° E
- **Kornwestheim**: 48.8667° N, 9.1833° E
- **Nuremberg (Nürnberg)**: 49.4521° N, 11.0767° E
- **Munich (München)**: 48.1351° N, 11.5820° E
- **Leipzig**: 51.3397° N, 12.3731° E

## Edge Cases & Assumptions
- **Holidays**: A static list of German public holidays is used. Regional holidays are currently excluded for simplicity.
- **Business Days**: Monday through Friday, excluding holidays.
- **YOT (Yard Opening Time)**: Assumed to be 96-120 hours depending on the terminal.
- **Empty Depots**: The first depot in the postcode mapping is used as the default empty return/release depot.
`;

export function PRD() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Product Requirements</h2>
          <p className="text-slate-500 mt-2 text-lg">Technical specification and business logic for the Inland Planner.</p>
        </div>
        <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-1.5 text-sm font-bold w-fit">
          v2.4.0 Stable
        </Badge>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Inland Planner Specification</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
          <div className="markdown-body">
            <Markdown>{PRD_CONTENT}</Markdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
