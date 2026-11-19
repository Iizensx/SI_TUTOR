"use client";

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
            <stop offset="0%" stopColor="#21463f" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#21463f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#dfe8e4" strokeDasharray="4 6" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#5f716c" }} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#5f716c" }} tickFormatter={(value) => `$${value}`} width={52} />
        <Tooltip content={<Tip />} cursor={{ stroke: "#f4a261", strokeWidth: 1.5 }} />
        <Area type="monotone" dataKey="revenue" stroke="#17332f" strokeWidth={2.4} fill="url(#revFill)" animationDuration={1200} activeDot={{ r: 5, fill: "#f4a261", stroke: "#fff", strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueBars({ data, height = 280 }: { data: Point[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 6, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#dfe8e4" strokeDasharray="4 6" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#5f716c" }} interval="preserveStartEnd" minTickGap={10} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#5f716c" }} tickFormatter={(value) => `$${value}`} width={56} />
        <Tooltip content={<Tip />} cursor={{ fill: "#21463f10" }} />
        <Bar dataKey="revenue" radius={[10, 10, 4, 4]} fill="#21463f" animationDuration={900} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const donutColors = ["#17332f", "#f4a261", "#8fc7b5", "#c9b6e4"];

export function Donut({ data, height = 190 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={3} cornerRadius={8} stroke="none" animationDuration={1000}>
          {data.map((entry, index) => <Cell key={entry.name} fill={donutColors[index % donutColors.length]} />)}
        </Pie>
        <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 12, border: "none", background: "#17332f", color: "#fff", fontSize: 12 }} itemStyle={{ color: "#fff" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { donutColors };

export function Sparkline({ values, color = "#17332f" }: { values: number[]; color?: string }) {
  const data = values.map((value, index) => ({ index, value }));
  return (
    <ResponsiveContainer width="100%" height={42}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#spark-${color})`} isAnimationActive animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
