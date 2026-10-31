import type { Metadata } from 'next'
import ClientApp from '@/components/ClientApp'

export const metadata: Metadata = {
  title: 'Shop counter',
  description: 'Speak or type orders, check the card, save. Due list, customers and WhatsApp messages.',
}

export default function AppPage() {
  return <ClientApp />
}
