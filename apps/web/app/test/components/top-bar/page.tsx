import type { Metadata } from 'next';

import { ShowcaseBody } from './showcase-body';

export const metadata: Metadata = {
  title: 'Admin TopBar Showcase — T11.2',
};

export default function AdminTopBarShowcasePage() {
  return <ShowcaseBody />;
}
