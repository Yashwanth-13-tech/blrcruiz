import React from 'react'
import { MessageCircle, Phone, Car } from 'lucide-react'
import { createWhatsAppLink, createCallLink, genericInquiryMessage } from '../utils/whatsapp.js'

export default function MobileContactBar({ onBookNow }) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">
      <div className="flex items-center justify-between gap-1.5 rounded-2xl bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-md border border-slate-800 text-white">
        
        {/* WhatsApp */}
        <a
          href={createWhatsAppLink(genericInquiryMessage())}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2 px-1 text-xs font-bold text-white transition-transform active:scale-95"
          aria-label="Contact on WhatsApp"
        >
          <MessageCircle size={15} />
          <span>WhatsApp</span>
        </a>

        {/* Call */}
        <a
          href={createCallLink()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2 px-1 text-xs font-bold text-slate-200 transition-transform active:scale-95"
          aria-label="Call hotline"
        >
          <Phone size={14} className="text-accent-400" />
          <span>Call Us</span>
        </a>

        {/* Book Now */}
        <button
          type="button"
          onClick={onBookNow}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-500 py-2 px-1 text-xs font-bold text-white transition-transform active:scale-95"
          aria-label="Book a car now"
        >
          <Car size={15} />
          <span>Book Now</span>
        </button>
      </div>
    </div>
  )
}
