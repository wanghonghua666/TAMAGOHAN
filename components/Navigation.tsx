'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Camera, History, Home, BookOpen, Settings } from 'lucide-react'

const NAV_LINKS = [
  { href: '/', icon: Home, label: 'ホーム' },
  { href: '/meal', icon: Camera, label: '食事記録' },
  { href: '/history', icon: History, label: '履歴' },
] as const

const NAV_ACTIONS = [
  { id: 'dex', icon: BookOpen, label: '図鑑' },
  { id: 'settings', icon: Settings, label: '設定' },
] as const

function openPanel(pathname: string, router: ReturnType<typeof useRouter>, panel: string) {
  if (pathname === '/') {
    window.dispatchEvent(new CustomEvent(`kukupin:open-${panel}`))
  } else {
    router.push(`/?panel=${panel}`)
  }
}

function NavIconButton({
  active,
  label,
  onClick,
  href,
  children,
}: {
  active?: boolean
  label: string
  onClick?: () => void
  href?: string
  children: React.ReactNode
}) {
  const cls = `relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 transition-all ${
    active
      ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.95)] scale-110'
      : 'text-white/55 hover:text-white/85'
  }`

  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} className={cls}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="sticky top-0 z-50 shadow-md border-b-2 border-[#8B4513]/40 relative">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url('/nav-bar-bg.png')`,
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center',
          filter: 'contrast(1.1)',
        }}
        aria-hidden
      />
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-28 md:h-32">
          <Link href="/" className="flex items-center shrink-0 transition-transform hover:scale-105">
            <Image
              src="/kukupinTitle.png"
              alt="くっくぴん"
              width={280}
              height={78}
              priority
              className="h-[78px] w-auto md:h-[101px] md:w-auto"
            />
          </Link>

          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, icon: Icon, label }) => (
              <NavIconButton key={href} href={href} label={label} active={pathname === href}>
                <Icon size={26} strokeWidth={pathname === href ? 3 : 2.2} className="md:w-7 md:h-7" />
              </NavIconButton>
            ))}

            <div className="w-px h-8 bg-white/40 mx-1" />

            {NAV_ACTIONS.map(({ id, icon: Icon, label }) => (
              <NavIconButton
                key={id}
                label={label}
                onClick={() => openPanel(pathname, router, id)}
              >
                <Icon size={26} strokeWidth={2.2} className="md:w-7 md:h-7" />
              </NavIconButton>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
