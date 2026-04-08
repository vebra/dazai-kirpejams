/**
 * Bendras „coming soon" placeholder'is admin sekcijoms — rodome kol realus
 * turinys dar neimplementuotas. Pagal HTML dizaino dashboard'ų stilių:
 * balta kortelė, subtilus padding'as, pilkšvas antrinis tekstas.
 */

type Props = {
  title: string
  description: string
  /** Ikonėlė iš admin-nav.ts — rodom kaip subtilų vizualinį akcentą */
  icon: string
  /** Sąrašas funkcijų kurios bus implementuotos — padeda susiorientuoti ką planuojam */
  plannedFeatures?: readonly string[]
}

export function AdminPlaceholder({
  title,
  description,
  icon,
  plannedFeatures,
}: Props) {
  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-2xl p-10 border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-5">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-xl bg-brand-magenta/10 flex items-center justify-center text-3xl"
            aria-hidden
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-brand-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-[15px] leading-relaxed text-brand-gray-500">
              {description}
            </p>
          </div>
        </div>

        {plannedFeatures && plannedFeatures.length > 0 && (
          <>
            <div className="h-px bg-[#eee] my-8" />
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-4">
                Planuojamos funkcijos
              </h3>
              <ul className="space-y-2.5">
                {plannedFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-brand-gray-900"
                  >
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-magenta flex-shrink-0"
                      aria-hidden
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F7] text-[12px] font-medium text-brand-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden />
          Kuriama — netrukus bus prieinama
        </div>
      </div>
    </div>
  )
}
