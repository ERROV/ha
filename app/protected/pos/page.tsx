// app/pos/page.tsx
import dynamic from "next/dynamic";

const PosMap = dynamic(() => import("./PosMap"), { ssr: false });

export default function PosPage() {
  return (
    <main >
      <PosMap />
    </main>
  );
}
