"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type CabinetItem = {
  id: string;
  name: string;
  category: string;
  expiry: string;
  packs: number;
  lowAt: number;
  location: string;
};

const STORAGE_KEY = "cabinet-compass-items";

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStatus(expiry: string) {
  const today = localDateString(new Date());
  if (expiry < today) return "Check date";
  const daysLeft = Math.ceil(
    (new Date(`${expiry}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
      86400000,
  );
  return daysLeft <= 60 ? "Check soon" : "On track";
}

function formatDate(value: string) {
  if (!value) return "No date entered";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [items, setItems] = useState<CabinetItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Everything");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved) as CabinetItem[]);
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const attentionCount = items.filter(
    (item) => getStatus(item.expiry) !== "On track",
  ).length;
  const lowStockCount = items.filter(
    (item) => item.packs <= item.lowAt,
  ).length;

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        const matchesQuery =
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.location.toLowerCase().includes(normalizedQuery);
        const matchesFilter =
          filter === "Everything" ||
          (filter === "Needs a check" && getStatus(item.expiry) !== "On track") ||
          (filter === "Low stock" && item.packs <= item.lowAt);
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => a.expiry.localeCompare(b.expiry));
  }, [items, query, filter]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const newItem: CabinetItem = {
      id: crypto.randomUUID(),
      name: String(data.get("name")).trim(),
      category: String(data.get("category")),
      expiry: String(data.get("expiry")),
      packs: Number(data.get("packs")),
      lowAt: Number(data.get("lowAt")),
      location: String(data.get("location")).trim() || "Not specified",
    };

    setItems((current) => [newItem, ...current]);
    form.reset();
  }

  function adjustPacks(id: string, amount: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, packs: Math.max(0, item.packs + amount) }
          : item,
      ),
    );
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function addSampleItems() {
    const today = new Date();
    const soon = new Date(today);
    soon.setDate(today.getDate() + 35);
    const later = new Date(today);
    later.setDate(today.getDate() + 180);

    setItems([
      {
        id: crypto.randomUUID(),
        name: "Example product A",
        category: "First aid",
        expiry: localDateString(soon),
        packs: 1,
        lowAt: 2,
        location: "Hall cabinet",
      },
      {
        id: crypto.randomUUID(),
        name: "Example product B",
        category: "OTC",
        expiry: localDateString(later),
        packs: 4,
        lowAt: 1,
        location: "Kitchen drawer",
      },
    ]);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Cabinet Compass home">
          <span className="brand-icon">+</span>
          <span>cabinet<span className="brand-light">compass</span></span>
        </a>
        <span className="privacy-pill"><span /> Saved on this device</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">A CLEARER CABINET, ONE SMALL STEP AT A TIME</p>
          <h1>Know what’s there.<br /><em>See what needs a check.</em></h1>
          <p className="intro">
            Keep a simple household inventory, note the dates on your packages,
            and spot low-stock items at a glance.
          </p>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <span>+</span>
          <i>●</i>
          <b>⌂</b>
        </div>
      </section>

      <section className="stats" aria-label="Inventory summary">
        <article className="stat-card">
          <span className="stat-label">ITEMS TRACKED</span>
          <strong>{items.length}</strong>
          <span className="stat-note">in your cabinet list</span>
        </article>
        <article className="stat-card accent">
          <span className="stat-label">DATES TO CHECK</span>
          <strong>{attentionCount}</strong>
          <span className="stat-note">based on dates you entered</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">LOW STOCK</span>
          <strong>{lowStockCount}</strong>
          <span className="stat-note">at or below your threshold</span>
        </article>
      </section>

      <section className="content-grid">
        <section className="inventory-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR HOUSEHOLD INVENTORY</p>
              <h2>Cabinet list</h2>
            </div>
            <label className="search">
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search item or location"
                aria-label="Search inventory"
              />
            </label>
          </div>

          <div className="filters" aria-label="Filter inventory">
            {["Everything", "Needs a check", "Low stock"].map((option) => (
              <button
                className={filter === option ? "filter active" : "filter"}
                key={option}
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="item-list">
            {visibleItems.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">＋</span>
                <h3>{items.length === 0 ? "Start your cabinet list" : "No items match"}</h3>
                <p>
                  {items.length === 0
                    ? "Add an item using the form. Your list stays in this browser on this device."
                    : "Try another search or filter."}
                </p>
                {items.length === 0 && (
                  <button className="sample-button" onClick={addSampleItems}>
                    Preview with fictional examples
                  </button>
                )}
              </div>
            ) : (
              visibleItems.map((item) => {
                const status = getStatus(item.expiry);
                const low = item.packs <= item.lowAt;
                return (
                  <article className="item-card" key={item.id}>
                    <div className="item-main">
                      <div className="item-symbol" aria-hidden="true">✳</div>
                      <div>
                        <div className="item-title-row">
                          <h3>{item.name}</h3>
                          <span className={`status ${status === "On track" ? "good" : "attention"}`}>
                            {status}
                          </span>
                        </div>
                        <p className="item-meta">
                          {item.category} · {item.location} · Date entered: {formatDate(item.expiry)}
                        </p>
                        <div className="stock-row">
                          <span className={low ? "stock low" : "stock"}>
                            {low ? "Low stock" : "Stock"}
                          </span>
                          <div className="quantity-control" aria-label={`Quantity: ${item.packs} packs`}>
                            <button onClick={() => adjustPacks(item.id, -1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                            <strong>{item.packs}</strong>
                            <button onClick={() => adjustPacks(item.id, 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                            <span>packs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="remove-button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                      Remove
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="add-panel">
          <p className="eyebrow">KEEP IT UP TO DATE</p>
          <h2>Add an item</h2>
          <p className="panel-intro">
            Copy the product name and date from its package. No dosage or
            treatment details are needed.
          </p>

          <form onSubmit={addItem}>
            <label>
              Product name
              <input name="name" placeholder="e.g. First-aid item" required maxLength={60} />
            </label>
            <div className="form-row">
              <label>
                Category
                <select name="category" defaultValue="OTC">
                  <option>OTC</option>
                  <option>Prescription</option>
                  <option>First aid</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Package date
                <input name="expiry" type="date" required />
              </label>
            </div>
            <div className="form-row">
              <label>
                Packs on hand
                <input name="packs" type="number" min="0" defaultValue="1" required />
              </label>
              <label>
                Low-stock at
                <input name="lowAt" type="number" min="0" defaultValue="1" required />
              </label>
            </div>
            <label>
              Storage location
              <input name="location" placeholder="e.g. Hall cabinet" maxLength={40} />
            </label>
            <button className="add-button" type="submit">Add to cabinet <span>→</span></button>
          </form>

          <div className="safety-note">
            <strong>Organizer only</strong>
            <p>
              This app does not assess whether a product is safe to use or
              recommend what to take. Ask a pharmacist about medication
              questions or dates that need review.
            </p>
          </div>
        </aside>
      </section>

      <footer className="footer">
        <span>Cabinet Compass</span>
        <span>Inventory data stays in this browser on this device.</span>
      </footer>
    </main>
  );
}