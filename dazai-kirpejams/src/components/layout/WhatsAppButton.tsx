import { CONTACT } from '@/lib/site'

type WhatsAppButtonProps = {
  ariaLabel: string
  tooltip: string
  prefill: string
}

export function WhatsAppButton({
  ariaLabel,
  tooltip,
  prefill,
}: WhatsAppButtonProps) {
  const number = CONTACT.phone.replace(/\D+/g, '')
  const href = `https://wa.me/${number}?text=${encodeURIComponent(prefill)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={tooltip}
      className="group fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="h-7 w-7 fill-current"
      >
        <path d="M16.001 3C9.373 3 4 8.373 4 15.001c0 2.295.602 4.532 1.744 6.5L4 29l7.687-1.71a11.94 11.94 0 0 0 4.314.795h.005C22.633 28.085 28 22.713 28 16.085 28 12.84 26.74 9.797 24.45 7.51A11.926 11.926 0 0 0 16.001 3Zm0 22.16h-.004a9.9 9.9 0 0 1-3.78-.733l-.27-.108-4.564 1.014.997-4.443-.18-.286a9.9 9.9 0 0 1-1.535-5.31C6.665 9.59 10.86 5.395 16.005 5.395c2.49 0 4.83.97 6.59 2.732a9.27 9.27 0 0 1 2.726 6.59c0 5.144-4.196 9.34-9.32 9.443ZM21.42 17.62c-.297-.149-1.755-.866-2.027-.965-.272-.099-.47-.149-.668.149-.198.297-.766.965-.94 1.163-.173.198-.347.223-.643.074-.297-.149-1.252-.461-2.385-1.471-.882-.787-1.477-1.76-1.65-2.057-.173-.297-.018-.458.13-.606.133-.133.297-.347.446-.52.149-.173.198-.297.297-.495.099-.198.05-.371-.025-.52-.074-.149-.668-1.611-.916-2.207-.241-.58-.486-.501-.668-.51l-.569-.01c-.198 0-.52.074-.792.371-.272.297-1.04 1.016-1.04 2.478 0 1.461 1.064 2.873 1.213 3.07.149.198 2.094 3.196 5.073 4.481.708.306 1.262.488 1.694.625.712.226 1.36.194 1.872.118.571-.085 1.755-.717 2.003-1.41.247-.694.247-1.288.173-1.41-.074-.124-.272-.198-.569-.347Z" />
      </svg>
    </a>
  )
}
