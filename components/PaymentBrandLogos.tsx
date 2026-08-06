/** Visa / Mastercard marks for checkout & footer (Flitt card-scheme requirement). */
export function PaymentBrandLogos({ className = '' }: { className?: string }) {
  return (
    <div className={`payment-brands ${className}`.trim()} aria-label="Accepted cards: Visa, Mastercard">
      <span className="payment-brands__item payment-brands__item--visa" title="Visa">
        <svg viewBox="0 0 48 16" width="48" height="16" aria-hidden="true" focusable="false">
          <rect width="48" height="16" rx="2" fill="#1A1F71" />
          <text
            x="24"
            y="11.5"
            textAnchor="middle"
            fill="#fff"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.5"
          >
            VISA
          </text>
        </svg>
      </span>
      <span className="payment-brands__item payment-brands__item--mc" title="Mastercard">
        <svg viewBox="0 0 48 16" width="48" height="16" aria-hidden="true" focusable="false">
          <rect width="48" height="16" rx="2" fill="#000" />
          <circle cx="19" cy="8" r="5.2" fill="#EB001B" />
          <circle cx="29" cy="8" r="5.2" fill="#F79E1B" />
          <path
            d="M24 3.8a5.2 5.2 0 0 1 0 8.4 5.2 5.2 0 0 1 0-8.4z"
            fill="#FF5F00"
          />
        </svg>
      </span>
    </div>
  );
}
