import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import { prisma } from '@/lib/prisma'
import ContractForm from '@/features/contracten/ContractForm'
import { updateStallingContract } from '@/features/contracten/actions'
import { leesHuisvesting } from '@/features/contracten/huisvesting'
import { leesDienstpakket } from '@/features/contracten/dienstpakket'
import { leesPrijsLooptijd } from '@/features/contracten/prijsLooptijd'
import { getFeedingPlan } from '@/features/paarden/queries'

interface Props {
  params: Promise<{ id: string; contractId: string }>
}

export default async function BewerkContractPage({ params }: Props) {
  const { id, contractId } = await params

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const horse = await getHorse(id)
  if (!horse) notFound()

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) notFound()

  const contract = await prisma.contract.findUnique({ where: { id: contractId } })
  if (!contract || contract.horseId !== id) notFound()

  // Bewerken mag uitsluitend bij een concept-contract; bij elke andere status
  // tonen we een blokkering en geen formulier.
  if (contract.status !== 'CONCEPT') {
    return (
      <main className="page-container">
        <div className="page-header">
          <Link href={`/paarden/${id}?tab=contracten`} className="btn-ghost">← {horse.name}</Link>
        </div>
        <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
          <div className="label">Stallingscontract bewerken</div>
          <h1 className="page-title">{horse.name}</h1>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="gezondheid-leeg">
              Dit contract kan niet meer worden bewerkt. Alleen een concept-contract is
              bewerkbaar.
            </div>
          </div>
        </div>
      </main>
    )
  }

  const owners = horse.people
    .filter((p) => p.isOwner)
    .map((p) => ({
      userId: p.user.id,
      label: p.user.name ?? p.user.email,
    }))

  const defaultStartDate = contract.startDate
    ? new Date(contract.startDate).toISOString().slice(0, 10)
    : undefined

  // Huisvesting-opties (STAL-03). Bij een leeg boxnummer voorvullen uit het
  // paardprofiel — overschrijfbaar in het formulier.
  const huisvesting = leesHuisvesting(contract.config)
  if (!huisvesting.boxNumber && horse.boxNumber) {
    huisvesting.boxNumber = horse.boxNumber
  }

  // Dienstpakket (voer/weidegang/faciliteiten, STAL-04) uit de contract-config.
  const dienstpakket = leesDienstpakket(contract.config)

  // Prijs, borg & looptijd (STAL-05) uit de contract-config.
  const prijsLooptijd = leesPrijsLooptijd(contract.config)

  // Voorvulwaarden uit het voederschema van het paard; null wanneer er geen
  // FeedingPlan is, zodat de overnemen-knop in het formulier wordt uitgeschakeld.
  const feedingPlan = await getFeedingPlan(id)
  const voederschema =
    feedingPlan && (feedingPlan.roughage || feedingPlan.concentrate)
      ? { ruwvoer: feedingPlan.roughage, krachtvoer: feedingPlan.concentrate }
      : null

  const action = updateStallingContract.bind(null, id, contractId)

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/paarden/${id}?tab=contracten`} className="btn-ghost">← {horse.name}</Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Stallingscontract bewerken</div>
        <h1 className="page-title">{horse.name}</h1>
      </div>

      <ContractForm
        horseId={id}
        action={action}
        owners={owners}
        defaultCounterpartyUserId={contract.counterpartyUserId ?? undefined}
        defaultStartDate={defaultStartDate}
        huisvesting={huisvesting}
        dienstpakket={dienstpakket}
        voederschema={voederschema}
        prijsLooptijd={prijsLooptijd}
        submitLabel="Wijzigingen opslaan"
      />
    </main>
  )
}
