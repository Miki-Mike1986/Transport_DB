import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

/* ---------- Konstanty ---------- */
const WAREHOUSES = [
  "Praha - Liboc",
  "Praha - HP",
  "Chrášťany",
  "Brno",
  "Zetor",
  "Berlín - DE",
  "Mnichov - DE",
  "Frankfurt - DE",
  "Vídeň - AT",
  "Budapešť - HU",
  "Bukurešť - RO",
];

const CARRIERS = [
  "ADOCAR s.r.o.",
  "ESA s.r.o.",
  "Cargoservis s.r.o.",
  "HOPI s.r.o.",
  "Filip Töpfer",
];

const TEMP_LABELS = {
  A: { text: "18–25 °C", emoji: "🌤️" },
  F: { text: "0–4 °C", emoji: "🥶" },
  M: { text: "−20 °C", emoji: "🧊" },
};

const DAYS = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
const MINUTES = ["00", "15", "30", "45"];

/* ---------- Helpery ---------- */
const blankStop = () => ({
  day: new Date().getDay(),
  destination: WAREHOUSES[0],
  carrier: CARRIERS[0],
  arrival: "08:00",
  departure: "08:30",
  temps: { A: true, F: false, M: false },
});

const toDate = (t) => {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(+h, +m, 0, 0);
  return d;
};

const mins = (ms) => Math.round(ms / 60000);

/* ---------- Časový picker (15 min) ---------- */
const TimePicker = ({ value, onChange }) => {
  const [h, m] = value.split(":");
  const update = (hh, mm) => onChange(`${hh.padStart(2, "0")}:${mm}`);
  return (
    <div className="flex space-x-1">
      <input
        type="number"
        min="0"
        max="23"
        className="w-12 border rounded p-1"
        value={h}
        onChange={(e) => update(e.target.value, m)}
      />
      <select
        className="border rounded p-1"
        value={m}
        onChange={(e) => update(h, e.target.value)}
      >
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  );
};

/* ---------- Sub‑komponenty ---------- */
const StopFields = ({ stop, onChange }) => (
  <>
    <select className="col-span-1 border rounded p-1" value={stop.day} onChange={(e) => onChange({ ...stop, day: +e.target.value })}>
      {DAYS.map((d, i) => (<option key={d} value={i}>{d}</option>))}
    </select>
    <select className="col-span-2 border rounded p-1" value={stop.destination} onChange={(e) => onChange({ ...stop, destination: e.target.value })}>
      {WAREHOUSES.map((w) => (<option key={w} value={w}>{w}</option>))}
    </select>
    <select className="col-span-2 border rounded p-1" value={stop.carrier} onChange={(e) => onChange({ ...stop, carrier: e.target.value })}>
      {CARRIERS.map((c) => (<option key={c} value={c}>{c}</option>))}
    </select>
    <div className="col-span-1"><TimePicker value={stop.arrival} onChange={(v) => onChange({ ...stop, arrival: v })} /></div>
    <div className="col-span-1"><TimePicker value={stop.departure} onChange={(v) => onChange({ ...stop, departure: v })} /></div>
    <div className="flex space-x-1 col-span-1 text-xs">
      {Object.keys(TEMP_LABELS).map((k) => (
        <label key={k} className="flex items-center space-x-1">
          <input type="checkbox" checked={stop.temps[k]} onChange={(e) => onChange({ ...stop, temps: { ...stop.temps, [k]: e.target.checked } })}/>
          <span>{k}</span>
        </label>
      ))}
    </div>
  </>
);

/* ---------- Hlavní komponenta ---------- */
export default function LogisticsDashboard() {
  const [tab, setTab] = useState("kalendar");
  const [now, setNow] = useState(new Date());
  const [routes, setRoutes] = useState([]);
  const [newStop, setNewStop] = useState(blankStop());
  const [multiTruck, setMultiTruck] = useState(null);
  const [multiStop, setMultiStop] = useState(blankStop());

  /* --- hodiny --- */
  useEffect(() => {
    const id = tab === "kalendar" ? null : setInterval(() => setNow(new Date()), 1000);
    return () => id && clearInterval(id);
  }, [tab]);

  /* --- persistence --- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("routes");
      if (saved) setRoutes(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("routes", JSON.stringify(routes));
  }, [routes]);

  /* --- CRUD --- */
  const addTruck = () => {
    setRoutes((prev) => [...prev, { id: `Kamion ${prev.length + 1}`, stops: [{ ...newStop }], statuses: {} }]);
    setNewStop(blankStop());
  };

  const saveMulti = (id) => {
    setRoutes((prev) => prev.map((t) => (t.id === id ? { ...t, stops: [...t.stops, { ...multiStop }] } : t)));
    setMultiTruck(null);
  };

  const deleteTruck = (id) => setRoutes((prev) => prev.filter((t) => t.id !== id));

  const setStatus = (id, step) => setRoutes((prev) => prev.map((t) => (t.id === id ? { ...t, statuses: { ...t.statuses, [step]: Date.now() } } : t)));

  /* ---------- UI menší komponenty ---------- */
  const MultiForm = ({ id }) => (
    <div className="grid md:grid-cols-9 gap-2 bg-gray-50 p-2 mt-2 rounded">
      <StopFields stop={multiStop} onChange={setMultiStop} />
      <div className="col-span-1 flex space-x-2">
        <Button size="sm" onClick={() => saveMulti(id)}>Uložit</Button>
        <Button size="sm" variant="outline" onClick={() => setMultiTruck(null)}>Zrušit</Button>
      </div>
    </div>
  );

  const StageBtn = ({ id, step, label }) => (
    <Button size="sm" variant={routes.find((t) => t.id === id).statuses[step] ? "default" : "outline"} onClick={() => setStatus(id, step)}>{label}</Button>
  );

  const Row = ({ t }) => {
    const today = new Date().getDay();
    const todays = t.stops.filter((s) => s.day === today);
    if (!todays.length) return null;

    const done = Boolean(t.statuses.naceste);
    const overdue = !done && ((!t.statuses.start && toDate(todays[0].arrival) < now) || (t.statuses.konec && toDate(todays[todays.length - 1].departure) < now));
    const bg = done ? "bg-green-100" : overdue ? "bg-red-100" : "";

    return (
      <Card className={`mb-2 ${bg}`}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center space-x-2 font-semibold text-lg">
            <span>🚚 {t.id}</span>
            {todays.length > 1 && <span className="bg-indigo-600 text-white text-xs px-2 rounded">MULTISTOP</span>}
          </div>
          {todays.map((s, i) => (
            <div key={i} className="pl-3 border-l border-gray-300 space-y-0.5 mb-1">
              <div className="font-medium">{s.destination} <span className="text-xs text-gray-500">({s.carrier})</span></div>
              <div className="text-sm">{format(toDate(s.arrival), "HH:mm")}–{s.departure}</div>
              <div className="flex space-x-1 text-xs flex-wrap">
                {Object.entries(s.temps).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="bg-gray-200 px-1 rounded flex items-center space-x-0.5">{TEMP_LABELS[k].emoji}<span>{TEMP_LABELS[k].text}</span></span>
                ))}
              </div>
            </div>
          ))}
          <div className="flex space-x-1 flex-wrap">
            <StageBtn id={t.id} step="pristaven" label="Přistaven" />
            <StageBtn id={t.id} step="start" label="Start" />
            <StageBtn id={t.id} step="konec" label="Konec" />
            <StageBtn id={t.id} step="naceste" label="Na cestě" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const Stats = () => (
    <div className="space-y-4">
      {DAYS.map((dayName, dayIdx) => {
        const dayRoutes = routes.filter((r) => r.stops[0].day === dayIdx);
        if (!dayRoutes.length) return null;

        return (
          <Card key={dayName} className="p-2">
            <CardContent className="space-y-2">
              <h3 className="text-lg font-semibold mb-2">{dayName}</h3>
              {dayRoutes.map((r) => {
                const { start, konec, naceste } = r.statuses;
                const loadMs = start && konec ? konec - start : 0;
                const dwellMs = konec && naceste ? naceste - konec : 0;
                return (
                  <div key={r.id} className="border-t pt-2 first:border-t-0 first:pt-0">
                    <div className="font-medium mb-1">🚚 {r.id}</div>
                    <div className="text-sm flex justify-between"><span>Nakládka:</span><span>{loadMs ? mins(loadMs) + " min" : "‑"}</span></div>
                    <div className="text-sm flex justify-between"><span>Zdržení po nakládce:</span><span>{dwellMs ? mins(dwellMs) + " min" : "‑"}</span></div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  /* ---------- render ---------- */
  return (
    <div className="container mx-auto p-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kalendar">Kalendář</TabsTrigger>
          <TabsTrigger value="prehled">Přehled</TabsTrigger>
          <TabsTrigger value="statistika">Statistika</TabsTrigger>
        </TabsList>

        {/* Kalendář */}
        <TabsContent value="kalendar">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold">Nová trasa / kamion</h2>
              <div className="grid md:grid-cols-9 gap-2 items-end mb-4">
                <StopFields stop={newStop} onChange={setNewStop} />
                <Button className="col-span-1" onClick={addTruck}>Přidat kamion</Button>
              </div>
              {routes.map((t) => (
                <Card key={t.id} className="p-2 mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{t.id}</span>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => { setMultiTruck(t.id); setMultiStop(blankStop()); }}>+ Multistop</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteTruck(t.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </div>
                  {t.stops.map((s, idx) => (
                    <div key={idx} className="ml-4 text-sm">
                      {DAYS[s.day]} – {s.destination} ({s.arrival} → {s.departure})
                    </div>
                  ))}
                  {multiTruck === t.id && <MultiForm id={t.id} />}
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Přehled */}
        <TabsContent value="prehled">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">{format(now, "dd.MM.yyyy HH:mm:ss")}</h1>
          </div>
          {routes.map((r) => (<Row key={r.id} t={r} />))}
        </TabsContent>

        {/* Statistika */}
        <TabsContent value="statistika">
          <Stats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
