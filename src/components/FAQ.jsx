import React, { useState } from 'react'
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react'
import { createWhatsAppLink, genericInquiryMessage } from '../utils/whatsapp.js'

const FAQS = [
  {
    q: 'What documents are required to rent a car in Bangalore?',
    a: 'You only need a valid Indian Driving License (minimum 1 year old) and an Aadhaar Card or Passport for identity verification. We complete digital verification in under 60 seconds over WhatsApp.',
  },
  {
    q: 'What is the minimum age to rent and drive?',
    a: 'The minimum age is 21 years with a valid driving license. No prior commercial driving experience is needed for self-drive rentals.',
  },
  {
    q: 'How does doorstep delivery and airport handover work?',
    a: 'We deliver your selected car directly to your home, office, hotel, or directly to Terminal 1 & 2 arrival gates at Kempegowda International Airport (BLR). Handover takes less than 5 minutes.',
  },
  {
    q: 'What is the fuel policy?',
    a: 'We follow a simple "Same-to-Same" fuel policy. If you receive the vehicle with a full tank or half tank, simply return it with the same fuel level.',
  },
  {
    q: 'Can I take the rental car outside Bangalore or Karnataka?',
    a: 'Yes! All BLR CRUIZ rental vehicles have All-India commercial taxi permits. You can drive freely to Mysore, Coorg, Ooty, Chikmagalur, Goa, Pondicherry, or anywhere in India.',
  },
  {
    q: 'What happens in case of a breakdown or puncture?',
    a: 'We provide 24/7 on-ground roadside assistance across Greater Bangalore and Karnataka highways. In the rare event of a mechanical issue, we provide roadside mechanics or a free vehicle replacement.',
  },
  {
    q: 'Can I extend my trip while already driving?',
    a: 'Yes, subject to car availability. Simply drop a message on our 24/7 WhatsApp concierge at least 4 hours before your scheduled return time.',
  },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section id="faq" className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="section-eyebrow">Got Questions?</span>
          <h2 className="section-heading">
            Frequently Asked Questions
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            Everything you need to know about renting a car with BLR CRUIZ in Bangalore.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all shadow-2xs"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-slate-50/70"
                >
                  <span className="font-display text-xs sm:text-sm font-bold text-slate-900 pr-4">
                    {faq.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-accent-50 text-accent-600' : ''
                    }`}
                  >
                    <ChevronDown size={15} />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs leading-relaxed text-slate-600 border-t border-slate-100/80">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Still have questions? */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="font-display text-sm font-bold text-slate-900">Still have questions?</p>
            <p className="text-xs text-slate-500">Our Bangalore team is available 24/7 on WhatsApp to help.</p>
          </div>

          <a
            href={createWhatsAppLink(genericInquiryMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp text-xs !py-2 !px-4 font-bold shrink-0"
          >
            <MessageCircle size={14} />
            <span>Chat With Us on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  )
}
