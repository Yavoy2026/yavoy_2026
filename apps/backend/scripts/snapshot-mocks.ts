/**
 * Одноразовый снапшот моков Expo в src/db/seed-data.json.
 * После снапшота моки каталога в expo/ удалены — источник seed-данных теперь JSON.
 * (Скрипт оставлен в репо для истории происхождения данных.)
 */
import { writeFileSync } from "node:fs";
import { cities } from "../../../expo/mocks/cities";
import { tours } from "../../../expo/mocks/tours";
import { categoryTours } from "../../../expo/mocks/categoryTours";

const out = new URL("../src/db/seed-data.json", import.meta.url).pathname;
writeFileSync(out, JSON.stringify({ cities, tours: [...tours, ...categoryTours] }, null, 2));
console.log(`Snapshot: ${cities.length} городов, ${tours.length + categoryTours.length} туров → ${out}`);
