import type { Metadata } from "next"

import { ShowcaseBody } from "./showcase-body"

export const metadata: Metadata = {
  title: "Forms Showcase — T10.2",
}

export default function FormsShowcasePage() {
  return <ShowcaseBody />
}
