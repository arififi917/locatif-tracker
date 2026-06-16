# 🏠 Locatif Tracker

SPA locale (React + TypeScript + Vite) pour le **suivi d'un portefeuille d'investissement locatif**.

## Fonctionnalités

- **Vue portefeuille** : tableau récapitulatif de tous vos biens avec KPI agrégés
- **Fiche bien** (4 onglets) : Synthèse, Prêts, Loyers, Dépenses
- **Calculs métier** : cash-flow avant/après dette, rendement brut/net, rendement sur fonds propres
- **Période flexible** : analyse par année ou 12 derniers mois glissants
- **Persistance 100% locale** via `localStorage`
- **Export / Import JSON** de l'ensemble des données
- **Import tableau d'amortissement CSV** par prêt

## Stack

- React 18 + TypeScript + Vite
- Recharts (graphiques)
- PapaParse (parsing CSV)
- date-fns (manipulation de dates)
- Vitest (tests unitaires)

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173)

## Tests

```bash
npm test
```

## Structure

```
src/
├── domain/
│   ├── types.ts         # Modèle de données TypeScript
│   ├── calc.ts          # Calculs métier (KPI, rendements, CRD)
│   ├── period.ts        # Gestion des périodes d'analyse
│   └── csvParser.ts     # Import tableau d'amortissement CSV
├── hooks/
│   ├── useAppData.tsx   # Context + persistance localStorage
│   ├── usePeriodFilter.tsx
│   └── usePropertyKPI.ts
├── components/
│   ├── layout/          # AppShell, Header
│   ├── ui/              # KpiCard, Modal, AmountCell
│   └── forms/           # PropertyForm, LoanForm, RentEventForm...
├── pages/
│   ├── PortfolioPage.tsx
│   ├── PropertyPage.tsx
│   └── tabs/            # SynthesisTab, LoansTab, RentsTab, ExpensesTab
├── styles/
│   ├── global.css
│   └── components.css
└── utils/
    ├── format.ts        # Formatage monétaire / pourcentage
    └── nanoid.ts        # Générateur d'ID léger
```

## Format CSV tableau d'amortissement

```csv
date,paymentNumber,paymentAmount,principalPaid,interestPaid,insurancePaid,remainingPrincipal
2024-01-01,1,850.00,600.00,200.00,50.00,149400.00
2024-02-01,2,850.00,602.00,198.00,50.00,148798.00
```

## Données stockées

Clé localStorage : `locatifAppData`  
Format JSON exportable/importable via les boutons de l'en-tête.
