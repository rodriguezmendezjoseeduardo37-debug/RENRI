"use client";

import { RevenueStats } from "@/types/payments";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
    data: RevenueStats["by_day"];
}

// Custom tooltip with proper typing
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
    }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background ring-1 ring-[#12b4ff] p-3 shadow-[0_0_15px_rgba(18,180,255,0.15)] rounded-xl">
                <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">{label}</p>
                <p className="text-sm font-mono text-foreground font-bold">
                    ${payload[0].value.toLocaleString("es-MX")} MXN
                </p>
            </div>
        );
    }
    return null;
};

export function RevenueChart({ data }: RevenueChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] ring-1 ring-border rounded-2xl flex items-center justify-center bg-background shadow-sm">
                <span className="text-[10px] font-bold tracking-[0.3em] text-foreground uppercase">
                    SIN DATOS SUFICIENTES
                </span>
            </div>
        );
    }

    return (
        <div className="w-full h-[300px] ring-1 ring-border bg-card p-4 pt-8 rounded-2xl overflow-hidden shadow-sm">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        className="font-mono tracking-widest uppercase"
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                        width={60}
                        className="font-mono tracking-widest"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333333', strokeWidth: 1 }} />
                    <Line
                        type="step" // blocky non-rounded aesthetic
                        dataKey="amount"
                        stroke="#12b4ff"
                        strokeWidth={2}
                        dot={{ r: 0 }}
                        activeDot={{ r: 4, fill: "#12b4ff", stroke: "black", strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
