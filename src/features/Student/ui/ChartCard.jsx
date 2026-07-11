import { ResponsiveContainer } from "recharts";
import SectionCard from "@/components/ui/SectionCard";

/**
 * ChartCard — SectionCard wrapper that sizes a recharts chart responsively.
 * Pass the chart element as children; it is wrapped in a ResponsiveContainer.
 */
export default function ChartCard({ title, subtitle, icon, action, height = 260, className, children }) {
  return (
    <SectionCard title={title} subtitle={subtitle} icon={icon} action={action} className={className} bodyClassName="p-3 sm:p-4">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
