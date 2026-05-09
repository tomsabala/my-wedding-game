import Link from 'next/link'

interface Props {
  title: string
  message: string
  backHref: string
  backLabel: string
}

export default function SuccessCard({ title, message, backHref, backLabel }: Props) {
  return (
    <div className="text-center">
      <div className="mb-3 text-2xl">✉️</div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm">{message}</p>
      <Link
        href={backHref}
        className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
      >
        {backLabel}
      </Link>
    </div>
  )
}
