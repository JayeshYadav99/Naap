import Landing from './Landing'

// Server-rendered in the visitor's saved language (cookie read in the root layout); switches instantly on the client.
export default function Page() {
  return <Landing />
}
