import Link from "next/link";
import { IconArrowLeft } from "@/components/icons";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-12 items-center gap-2 rounded-xl px-2 text-base font-semibold text-brand"
    >
      <IconArrowLeft className="h-5 w-5" />
      {children}
    </Link>
  );
}
