"use client";

import { useId } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { money } from "../_lib/format";
import styles from "../admin.module.css";

type Point = { label: string; revenue: number; orders?: number };

function Tip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTip}>
      <strong className="block">{label}</strong>
      {payload.map((item) => <span key={item.name} className="block opacity-80">{item.name === "revenue" ? money(item.value) : `${item.value} orders`}</span>)}
    </div>
  );
}

export function RevenueArea({ data, height = 260 }: { data: Point[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 6, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--deep-2)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--deep-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="4 6" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(value) => `$${value}`} width={52} />
        <Tooltip content={<Tip />} cursor={{ stroke: "var(--accent)", strokeWidth: 1.5 }} />
        <Area type="monotone" dataKey="revenue" stroke="var(--deep)" strokeWidth={2.4} fill="url(#revFill)" animationDuration={1200} activeDot={{ r: 5, fill: "var(--accent)", stroke: "#fff", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueBars({ data, height = 280 }: { data: Point[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 6, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="4 6" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} interval="preserveStartEnd" minTickGap={10} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(value) => `$${value}`} width={56} />
        <Tooltip content={<Tip />} cursor={{ fill: "color-mix(in srgb, var(--deep-2) 7%, transparent)" }} />
        <Bar dataKey="revenue" radius={[10, 10, 4, 4]} fill="var(--deep-2)" animationDuration={900} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const donutColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

export function Donut({ data, height = 190 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={3} cornerRadius={8} stroke="none" animationDuration={1000}>
          {data.map((entry, index) => <Cell key={entry.name} fill={donutColors[index % donutColors.length]} />)}
        </Pie>
        <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 12, border: "none", background: "var(--deep)", color: "#fff", fontSize: 12 }} itemStyle={{ color: "#fff" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { donutColors };

export function Sparkline({ values, color = "var(--deep)" }: { values: number[]; color?: string }) {
  const gradientId = `spark-${useId().replace(/:/g, "")}`;
  const data = values.map((value, index) => ({ index, value }));
  return (
    <ResponsiveContainer width="100%" height={42}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
