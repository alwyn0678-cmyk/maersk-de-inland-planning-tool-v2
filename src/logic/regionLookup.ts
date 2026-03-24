export function getRegion(zip: string): string {
  const z = parseInt(zip, 10);
  if (z >= 10000 && z <= 14999) return 'Berlin';
  if (z >= 15000 && z <= 19999) return 'Brandenburg / MV';
  if (z >= 20000 && z <= 29999) return 'Hamburg / Niedersachsen / Bremen';
  if (z >= 30000 && z <= 31999) return 'Hannover Region';
  if (z >= 32000 && z <= 34999) return 'Ostwestfalen-Lippe';
  if (z >= 35000 && z <= 36999) return 'Mittelhessen / Fulda';
  if (z >= 37000 && z <= 39999) return 'Suedniedersachsen / Sachsen-Anhalt';
  if (z >= 40000 && z <= 47999) return 'Düsseldorf / Duisburg / NRW-West';
  if (z >= 48000 && z <= 49999) return 'Münsterland';
  if (z >= 50000 && z <= 53999) return 'Köln / Bonn';
  if (z >= 54000 && z <= 56999) return 'Trier / Koblenz / Eifel';
  if (z >= 57000 && z <= 59999) return 'Siegen / Sauerland';
  if (z >= 60000 && z <= 65999) return 'Frankfurt / Rhein-Main';
  if (z >= 66000 && z <= 69999) return 'Saarland / Pfalz / Mannheim';
  if (z >= 70000 && z <= 76999) return 'Stuttgart / Karlsruhe';
  if (z >= 77000 && z <= 79999) return 'Freiburg / Schwarzwald';
  if (z >= 80000 && z <= 87999) return 'München / Oberbayern';
  if (z >= 88000 && z <= 89999) return 'Bodensee / Oberschwaben';
  if (z >= 90000 && z <= 96999) return 'Nürnberg / Franken';
  if (z >= 97000 && z <= 99999) return 'Würzburg / Thüringen';
  return '';
}
