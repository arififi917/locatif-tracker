import { useAppData } from '../../hooks/useAppData'
import { usePropertyKPI } from '../../hooks/usePropertyKPI'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { getAcquisitionCost } from '../../domain/calc'
import { KpiCard } from '../../components/ui/KpiCard'
import { formatCurrency, formatPercent } from '../../utils/format'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type Props = { propertyId: string }

export function SynthesisTab({ propertyId }: Props) {
  const { data } = useAppData()
  const { period } = usePeriodFilter()
  const kpi = usePropertyKPI(propertyId)
  const property = data.properties.find((p) => p.id === propertyId)!
  const acqCost = getAcquisitionCost(property)

  const periodLabel = period.mode === 'year'
    ? period.year?.toString()
    : period.mode === 'rolling_12m'
    ? '12 derniers mois'
    : 'Tout'

  const annLabel = kpi.anneesCouvertes !== 1
    ? ` (annualisé sur ${kpi.anneesCouvertes.toFixed(1)} ans)`
    : ''

  const chartData = [
    { name: 'Loyers', value: kpi.realRents, color: 'var(--kpi-accent-emerald)' },
    { name: 'Charges', value: kpi.totalCharges, color: 'var(--kpi-accent-rose)' },
    { name: 'CF opérat.', value: kpi.cashflowOperationnel, color: kpi.cashflowOperationnel >= 0 ? 'var(--kpi-accent-sky)' : '#dc2626' },
    { name: 'CF économ.', value: kpi.cashflowEconomique, color: kpi.cashflowEconomique >= 0 ? 'var(--kpi-accent-violet)' : '#dc2626' },
    { name: 'CF tréso.', value: kpi.cashflowTresorerie, color: kpi.cashflowTresorerie >= 0 ? '#059669' : '#dc2626' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      {/* Patrimoine */}
      <section>
        <div className="section-header">
          <span className="section-title">Patrimoine</span>
        </div>
        <div className="kpi-grid">
          <KpiCard
            label="Coût acquisition"
            value={formatCurrency(acqCost)}
            accent="var(--kpi-accent-blue)"
            tooltip="Prix d'achat + frais de notaire + frais d'agence + travaux initiaux. C'est la base de calcul des rendements."
          />
          <KpiCard
            label="Valeur actuelle"
            value={formatCurrency(kpi.currentValue)}
            accent="var(--kpi-accent-sky)"
            tooltip="Valeur de marché estimée du bien aujourd'hui. À mettre à jour régulièrement pour refléter la réalité."
          />
          <KpiCard
            label="Plus-value latente"
            value={formatCurrency(kpi.plusValue)}
            positive={kpi.plusValue > 0}
            negative={kpi.plusValue < 0}
            tooltip="Valeur actuelle − coût d'acquisition. Gain potentiel non encore réalisé si le bien était vendu aujourd'hui."
          />
          <KpiCard
            label="CRD total"
            value={formatCurrency(kpi.totalCRD)}
            accent="var(--kpi-accent-amber)"
            tooltip="Capital Restant Dû : somme des montants encore à rembourser sur tous les prêts liés à ce bien à la date de référence."
          />
          <KpiCard
            label="Equity nette"
            value={formatCurrency(kpi.equityDynamique)}
            positive={kpi.equityDynamique > 0}
            negative={kpi.equityDynamique < 0}
            sub="Valeur actuelle − CRD"
            tooltip="Votre part réelle du bien : valeur actuelle moins le capital restant dû. Évolue au fil des remboursements et de la revalorisation."
          />
        </div>
      </section>

      {/* Flux période */}
      <section>
        <div className="section-header">
          <span className="section-title">Flux — {periodLabel}{annLabel}</span>
        </div>
        <div className="kpi-grid">
          <KpiCard
            label="Loyers encaissés"
            value={formatCurrency(kpi.realRents)}
            positive={kpi.realRents > 0}
            tooltip="Total des loyers réellement encaissés sur la période sélectionnée (charges locataires incluses si saisies en montant global)."
          />
          <KpiCard
            label="Charges totales"
            value={formatCurrency(kpi.totalCharges)}
            accent="var(--kpi-accent-rose)"
            tooltip="Toutes les dépenses liées au bien sur la période : taxe foncière, assurance PNO, travaux, frais de gestion, etc. L'assurance emprunteur est exclue (comptée dans le coût du crédit)."
          />
          <KpiCard
            label="Coût crédit (int.+ass.)"
            value={formatCurrency(kpi.creditCostOnly)}
            accent="var(--kpi-accent-amber)"
            sub="Intérêts + assurance"
            tooltip="Partie du crédit qui est une vraie charge économique : intérêts bancaires + assurance emprunteur. N'inclut pas le remboursement du capital (qui est de l'épargne)."
          />
          <KpiCard
            label="Mensualités complètes"
            value={formatCurrency(kpi.creditMensualiteComplete)}
            accent="var(--kpi-accent-amber)"
            sub="Capital + int. + ass."
            tooltip="Total des sommes débitées sur votre compte bancaire pour le(s) crédit(s) sur la période : capital remboursé + intérêts + assurance emprunteur."
          />
          <KpiCard
            label="CF opérationnel"
            value={formatCurrency(kpi.cashflowOperationnel)}
            positive={kpi.cashflowOperationnel > 0}
            negative={kpi.cashflowOperationnel < 0}
            sub="Loyers − charges"
            tooltip="Loyers encaissés moins toutes les charges (hors crédit). Mesure la rentabilité brute de l'exploitation avant prise en compte du financement."
          />
          <KpiCard
            label="CF économique"
            value={formatCurrency(kpi.cashflowEconomique)}
            positive={kpi.cashflowEconomique > 0}
            negative={kpi.cashflowEconomique < 0}
            sub="− intérêts/assurance"
            tooltip="CF opérationnel moins le coût économique du crédit (intérêts + assurance). Reflète la vraie rentabilité économique sans tenir compte du remboursement du capital."
          />
          <KpiCard
            label="CF trésorerie"
            value={formatCurrency(kpi.cashflowTresorerie)}
            positive={kpi.cashflowTresorerie > 0}
            negative={kpi.cashflowTresorerie < 0}
            sub="− mensualité complète"
            tooltip="Argent réellement disponible après toutes les sorties : loyers − charges − mensualité complète (capital + intérêts + assurance). C'est ce qui impacte directement votre compte courant."
          />
          <KpiCard
            label="Taux d'effort"
            value={formatPercent(kpi.tauxEffort)}
            positive={kpi.tauxEffort < 0.8}
            negative={kpi.tauxEffort >= 1}
            sub="Mensualités / loyers"
            tooltip="Part des loyers absorbée par les mensualités de crédit. En dessous de 80% : sain. Au-dessus de 100% : les loyers ne couvrent pas les mensualités."
          />
        </div>
      </section>

      {/* Rendements */}
      <section>
        <div className="section-header">
          <span className="section-title">Rendements annualisés</span>
        </div>
        <div className="kpi-grid">
          <KpiCard
            label="Rendement brut"
            value={formatPercent(kpi.grossYield)}
            accent="var(--kpi-accent-violet)"
            sub="Loyers / coût acq."
            tooltip="Loyers annuels bruts divisés par le coût total d'acquisition. Indicateur de premier niveau, avant déduction des charges et du crédit."
          />
          <KpiCard
            label="Rdt opérationnel"
            value={formatPercent(kpi.netYieldOperationnel)}
            accent="var(--kpi-accent-sky)"
            sub="CF opérat. / coût acq."
            tooltip="Cashflow opérationnel annuel (loyers − charges) rapporté au coût d'acquisition. Mesure la rentabilité nette de charges, indépendamment du financement."
          />
          <KpiCard
            label="Rdt économique"
            value={formatPercent(kpi.netYieldEconomique)}
            accent="var(--kpi-accent-sky)"
            sub="CF économ. / coût acq."
            tooltip="Cashflow économique annuel (loyers − charges − intérêts/assurance) rapporté au coût d'acquisition. Tient compte du coût réel du financement."
          />
          <KpiCard
            label="Rdt equity nette"
            value={formatPercent(kpi.equityDynamiqueYield)}
            accent="var(--kpi-accent-emerald)"
            sub="CF économ. / equity nette"
            tooltip="Cashflow économique annuel rapporté à votre equity nette actuelle (valeur − CRD). Mesure le rendement sur votre capital réellement engagé aujourd'hui."
          />
        </div>
      </section>

      {/* Graphique */}
      <section>
        <div className="section-header">
          <span className="section-title">Aperçu cashflows</span>
        </div>
        <div className="card" style={{ padding: '24px 12px 20px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 24, left: 24, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), '']}
                contentStyle={{
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  )
}
